import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { createTestDb, TestDbHandle } from '../../helpers/testDb'

const testDbRef = vi.hoisted(() => ({ current: null as any }))

vi.mock('../../../src/data/database', () => ({
  dbRun:          (...args: any[]) => testDbRef.current.dbRun(...args),
  dbGet:          (...args: any[]) => testDbRef.current.dbGet(...args),
  dbAll:          (...args: any[]) => testDbRef.current.dbAll(...args),
  saveDb:         () => {},
  initDb:         async () => {},
  closeDb:        () => testDbRef.current?.destroy?.(),
  dbTransaction:  (fn: () => void) => testDbRef.current.dbTransaction(fn),
}))

describe('clanResourceRepo', () => {
  let db: TestDbHandle

  beforeAll(async () => {
    db = await createTestDb()
    db.applyAllMigrations()
    testDbRef.current = db
  })

  afterAll(() => {
    db.destroy()
  })

  function seedBaseTables() {
    db.dbRun('INSERT OR IGNORE INTO games (id, created_at) VALUES (1, datetime(\'now\'))')
    db.dbRun('INSERT INTO players (id, username, password_hash, created_at) VALUES (1, \'p1\', \'hash\', datetime(\'now\'))')
    db.dbRun(
      `INSERT INTO game_players (id, player_id, game_id, last_tick_at, created_at)
       VALUES (1, 1, 1, datetime('now'), datetime('now'))`
    )
    db.dbRun(
      `INSERT INTO clans (id, name, owner_id, game_id, created_at, updated_at)
       VALUES (1, 'TestClan', 1, 1, datetime('now'), datetime('now'))`
    )
  }

  function cleanAll() {
    db.dbRun('DELETE FROM clan_resources')
    db.dbRun('DELETE FROM clan_members')
    db.dbRun('DELETE FROM clans')
    db.dbRun('DELETE FROM game_players')
    db.dbRun('DELETE FROM players')
    db.dbRun('DELETE FROM games')
    db.dbRun("DELETE FROM sqlite_sequence WHERE name IN ('players','games','game_players','clans','clan_members','clan_resources')")
  }

  it('create inserts row with default capacity values', async () => {
    seedBaseTables()

    const { create, findByClanId } = await import('../../../src/data/repositories/clanResourceRepo')
    const row = create(1)

    expect(row.clanId).toBe(1)
    expect(row.food).toBe(200)
    expect(row.wood).toBe(150)
    expect(row.metal).toBe(50)
    expect(row.civilians).toBe(10)
    expect(row.soldiers).toBe(0)
    expect(row.foodCapacity).toBe(10000)
    expect(row.woodCapacity).toBe(10000)
    expect(row.metalCapacity).toBe(10000)
    expect(row.lastProductionTickAt).toBeNull()

    const found = findByClanId(1)
    expect(found).toBeDefined()
    expect(found!.foodCapacity).toBe(10000)
    expect(found!.woodCapacity).toBe(10000)
    expect(found!.metalCapacity).toBe(10000)

    cleanAll()
  })

  it('update modifies resource values and preserves capacity', async () => {
    seedBaseTables()

    db.dbRun(
      `INSERT INTO clan_resources (id, clan_id, food, wood, metal, civilians, soldiers, food_capacity, wood_capacity, metal_capacity)
       VALUES (10, 1, 100, 200, 300, 500, 50, 20000, 25000, 30000)`
    )

    const { update, findByClanId } = await import('../../../src/data/repositories/clanResourceRepo')

    update(10, { food: 500, wood: 600, metal: 700 })

    const row = findByClanId(1)
    expect(row!.food).toBe(500)
    expect(row!.wood).toBe(600)
    expect(row!.metal).toBe(700)
    expect(row!.civilians).toBe(500)
    expect(row!.soldiers).toBe(50)
    expect(row!.foodCapacity).toBe(20000)
    expect(row!.woodCapacity).toBe(25000)
    expect(row!.metalCapacity).toBe(30000)

    cleanAll()
  })

  it('updateTickAt sets the last production tick timestamp', async () => {
    seedBaseTables()

    db.dbRun(
      `INSERT INTO clan_resources (id, clan_id, food, wood, metal, civilians, soldiers)
       VALUES (10, 1, 0, 0, 0, 0, 0)`
    )

    const { updateTickAt, findByClanId } = await import('../../../src/data/repositories/clanResourceRepo')

    const ts = '2024-06-15T12:00:00.000Z'
    updateTickAt(10, ts)

    const row = findByClanId(1)
    expect(row!.lastProductionTickAt).toBe(ts)

    cleanAll()
  })
})
