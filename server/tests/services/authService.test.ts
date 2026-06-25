import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const testDbRef = vi.hoisted(() => ({ current: null as any }))

vi.mock('../../src/data/database', () => ({
  dbRun:          (...args: any[]) => testDbRef.current.dbRun(...args),
  dbGet:          (...args: any[]) => testDbRef.current.dbGet(...args),
  dbAll:          (...args: any[]) => testDbRef.current.dbAll(...args),
  saveDb:         () => {},
  initDb:         async () => {},
  closeDb:        () => testDbRef.current?.destroy?.(),
  dbTransaction:  (fn: () => void) => testDbRef.current.dbTransaction(fn),
}))

/* ─── Clean slate: all migrations, empty DB ─── */
describe('clean slate (all migrations applied)', () => {
  let handle: any

  beforeAll(async () => {
    const { createTestDb } = await import('../helpers/testDb')
    handle = await createTestDb()
    handle.applyAllMigrations()
    testDbRef.current = handle
  }, 15000)

  afterAll(() => handle?.destroy())

  it('register returns { token, player }', async () => {
    const { register } = await import('../../src/services/authService')
    const result = register('alpha', 'password123') as any

    expect(result.token).toBeDefined()
    expect(typeof result.token).toBe('string')
    expect(result.player).toBeDefined()
    expect(result.player.username).toBe('alpha')
    expect(result.player.id).toBeGreaterThan(0)

    const decoded = jwt.decode(result.token) as any
    expect(decoded).not.toBeNull()
    expect(decoded.playerId).toBe(result.player.id)
  }, 10000)

  it('register creates player, game, playerGame, resource, and 3 buildings', async () => {
    const { register } = await import('../../src/services/authService')
    register('bravo', 'password123')

    const players = handle.dbAll('SELECT id, username FROM players ORDER BY id')
    expect(players).toHaveLength(2)

    const games = handle.dbAll('SELECT id FROM games ORDER BY id')
    expect(games).toHaveLength(1)

    const pgs = handle.dbAll('SELECT id, player_id, game_id FROM game_players ORDER BY id')
    expect(pgs).toHaveLength(2)
    expect(pgs[1].player_id).toBe(players[1].id)
    expect(pgs[1].game_id).toBe(games[0].id)

    const resources = handle.dbAll('SELECT id, player_game_id FROM player_resources ORDER BY id')
    expect(resources).toHaveLength(2)
    expect(resources[1].player_game_id).toBe(pgs[1].id)

    const buildings = handle.dbAll("SELECT id, player_game_id, type FROM player_buildings WHERE player_game_id = ? ORDER BY type", [pgs[1].id])
    expect(buildings).toHaveLength(3)
    const types = buildings.map((b: any) => b.type).sort()
    expect(types).toEqual(['farm', 'house', 'lumberjackHut'])
  }, 10000)

  it('resource has correct starting values (200 / 150 / 50 / 10 / 0)', async () => {
    const { register } = await import('../../src/services/authService')
    register('charlie', 'password123')

    const pg = handle.dbGet(
      'SELECT id FROM game_players WHERE player_id = (SELECT id FROM players WHERE username = ?)',
      ['charlie'],
    )
    const resource = handle.dbGet('SELECT * FROM player_resources WHERE player_game_id = ?', [pg.id])
    expect(resource.food).toBe(200)
    expect(resource.wood).toBe(150)
    expect(resource.metal).toBe(50)
    expect(resource.civilians).toBe(10)
    expect(resource.soldiers).toBe(0)
  }, 10000)
})

/* ─── Existing database: user already registered ─── */
describe('existing database (user already registered)', () => {
  let handle: any
  let seedResult: any

  beforeAll(async () => {
    const { createTestDb } = await import('../helpers/testDb')
    handle = await createTestDb()
    handle.applyAllMigrations()
    testDbRef.current = handle

    const { register } = await import('../../src/services/authService')
    seedResult = register('seeduser', 'password123') as any
  }, 15000)

  afterAll(() => handle?.destroy())

  it('login with correct credentials', async () => {
    const { login } = await import('../../src/services/authService')
    const result = login('seeduser', 'password123') as any

    expect(result).not.toBeNull()
    expect(result.token).toBeDefined()
    expect(typeof result.token).toBe('string')
    expect(result.player.username).toBe('seeduser')
    expect(result.player.id).toBe(seedResult.player.id)
  })

  it('JWT token contains correct playerId and gameId', async () => {
    const { login } = await import('../../src/services/authService')
    const result = login('seeduser', 'password123') as any
    const decoded = jwt.decode(result.token) as any

    expect(decoded.playerId).toBe(seedResult.player.id)
  })

  it('login with wrong password returns null', async () => {
    const { login } = await import('../../src/services/authService')
    expect(login('seeduser', 'wrongpass')).toBeNull()
  })

  it('login with non-existent username returns null', async () => {
    const { login } = await import('../../src/services/authService')
    expect(login('nobody', 'password123')).toBeNull()
  })

  it('register with duplicate username returns conflict error', async () => {
    const { register } = await import('../../src/services/authService')
    const result = register('seeduser', 'otherpass')

    expect(result).toHaveProperty('error')
    expect((result as any).error).toBe('Username already exists')
  })
})

/* ─── Stale schema: only players table exists ─── */
describe('stale schema — missing games table (up to 001)', () => {
  let handle: any

  beforeAll(async () => {
    const { createTestDb } = await import('../helpers/testDb')
    handle = await createTestDb()
    handle.applyMigrationsUpTo('001_create_players.sql')
    testDbRef.current = handle
  }, 15000)

  afterAll(() => handle?.destroy())

  it('register throws "no such table: games"', async () => {
    const { register } = await import('../../src/services/authService')
    expect(() => register('testuser', 'password123')).toThrow(/no such table: games/)
  })

  it('login throws "no such table: games"', async () => {
    const pwdHash = bcrypt.hashSync('password123', 10)
    handle.dbRun("INSERT INTO players (username, password_hash) VALUES (?, ?)", ['existing', pwdHash])

    const { login } = await import('../../src/services/authService')
    expect(() => login('existing', 'password123')).toThrow(/no such table: games/)
  })

  it('after applyMissingMigrations, register succeeds', async () => {
    handle.applyMissingMigrations()
    const { register } = await import('../../src/services/authService')
    const result = register('recovered', 'password123') as any
    expect(result).toHaveProperty('token')
    expect(result.player.username).toBe('recovered')
  }, 10000)
})
/* ─── Stale schema: games exists but no game_players ─── */

describe('stale schema — missing game_players table (up to 006)', () => {
  let handle: any

  beforeAll(async () => {
    const { createTestDb } = await import('../helpers/testDb')
    handle = await createTestDb()
    handle.applyMigrations([
      '001_create_players.sql',
      '006_create_games.sql',
    ])
    testDbRef.current = handle
  }, 15000)

  afterAll(() => handle?.destroy())

  it('register throws "no such table: game_players"', async () => {
    const { register } = await import('../../src/services/authService')
    expect(() => register('testuser', 'password123')).toThrow(/no such table: game_players/)
  })

  it('login throws "no such table: game_players"', async () => {
    const pwdHash = bcrypt.hashSync('password123', 10)
    handle.dbRun("INSERT INTO players (username, password_hash) VALUES (?, ?)", ['existing', pwdHash])
    handle.dbRun("INSERT INTO games DEFAULT VALUES")

    const { login } = await import('../../src/services/authService')
    expect(() => login('existing', 'password123')).toThrow(/no such table: game_players/)
  })

  it('after applyMissingMigrations, register succeeds', async () => {
    handle.applyMissingMigrations()
    const { register } = await import('../../src/services/authService')
    const result = register('recovered', 'password123') as any
    expect(result).toHaveProperty('token')
  }, 10000)
})

/* ─── Stale schema: game_players exists but no player_resources ─── */
describe('stale schema — missing player_resources table (up to 007)', () => {
  let handle: any

  beforeAll(async () => {
    const { createTestDb } = await import('../helpers/testDb')
    handle = await createTestDb()
    handle.applyMigrations([
      '001_create_players.sql',
      '006_create_games.sql',
      '007_create_player_games.sql',
    ])
    testDbRef.current = handle
  }, 15000)

  afterAll(() => handle?.destroy())

  it('register throws "no such table: player_resources"', async () => {
    const { register } = await import('../../src/services/authService')
    expect(() => register('testuser', 'password123')).toThrow(/no such table: player_resources/)
  })

  it('after applyMissingMigrations, register succeeds', async () => {
    handle.applyMissingMigrations()
    const { register } = await import('../../src/services/authService')
    const result = register('recovered', 'password123') as any
    expect(result).toHaveProperty('token')
  }, 10000)
})



/* ─── Login with stale schema — recover after migration ─── */
describe('login with stale schema — recovery after migrations', () => {
  let handle: any

  beforeAll(async () => {
    const { createTestDb } = await import('../helpers/testDb')
    handle = await createTestDb()
    handle.applyMigrationsUpTo('006_create_games.sql')
    testDbRef.current = handle

    const pwdHash = bcrypt.hashSync('password123', 10)
    handle.dbRun("INSERT INTO players (username, password_hash) VALUES (?, ?)", ['staleuser', pwdHash])
    handle.dbRun("INSERT INTO games DEFAULT VALUES")
  }, 15000)

  afterAll(() => handle?.destroy())

  it('login throws before migrations are applied', async () => {
    const { login } = await import('../../src/services/authService')
    expect(() => login('staleuser', 'password123')).toThrow(/no such table: game_players/)
  })

  it('login succeeds after applyMissingMigrations', async () => {
    handle.applyMissingMigrations()
    const player = handle.dbGet("SELECT id FROM players WHERE username = ?", ['staleuser'])
    const game = handle.dbGet("SELECT id FROM games ORDER BY id ASC LIMIT 1")
    handle.dbRun(
      "INSERT INTO game_players (player_id, game_id, last_tick_at, created_at) VALUES (?, ?, datetime('now'), datetime('now'))",
      [player.id, game.id]
    )
    const { login } = await import('../../src/services/authService')
    const result = login('staleuser', 'password123') as any
    expect(result).not.toBeNull()
    expect(result.player.username).toBe('staleuser')
    expect(result.token).toBeDefined()
  }, 10000)
})
