import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import express from 'express'
import request from 'supertest'

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

vi.mock('../../src/middleware/auth', () => ({
  authMiddleware: (req: any, _res: any, next: any) => {
    req.playerId = 1
    next()
  },
}))

vi.mock('../../src/middleware/gameOwnership', () => ({
  gameOwnershipMiddleware: (req: any, _res: any, next: any) => {
    req.playerGameId = 1
    next()
  },
  resolvePlayerGameId: (req: any, _res: any, next: any) => {
    req.playerGameId = 1
    next()
  },
}))

vi.mock('../../src/middleware/resourceTick', () => ({
  resourceTickMiddleware: (_req: any, _res: any, next: any) => {
    next()
  },
}))

describe('API Routes', () => {
  let handle: any
  let app: express.Express

  beforeAll(async () => {
    const { createTestDb } = await import('../helpers/testDb')
    handle = await createTestDb()
    handle.applyAllMigrations()
    testDbRef.current = handle

    const { router } = await import('../../src/api/router')
    app = express()
    app.use(express.json())
    app.use('/api', router)
  }, 15000)

  afterAll(() => handle?.destroy())

  /* ── Auth Routes ── */
  describe('POST /api/auth/register', () => {
    it('registers a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'testuser', password: 'secret123' })
      expect(res.status).toBe(201)
      expect(res.body).toHaveProperty('token')
      expect(res.body).toHaveProperty('player')
      expect(res.body.player.username).toBe('testuser')
    })

    it('rejects duplicate username', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'testuser', password: 'secret123' })
      expect(res.status).toBe(409)
      expect(res.body).toHaveProperty('error')
    })
  })

  describe('POST /api/auth/login', () => {
    it('logs in with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'testuser', password: 'secret123' })
      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('token')
    })

    it('rejects wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'testuser', password: 'wrong' })
      expect(res.status).toBe(401)
    })
  })

  /* ── Player Game Routes ── */
  describe('GET /api/game/:gameId/player-game', () => {
    it('returns player game data', async () => {
      const res = await request(app).get('/api/game/1/player-game')
      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('playerGame')
    })
  })

  describe('GET /api/game/:gameId/player-game/resource', () => {
    it('returns resource data', async () => {
      const res = await request(app).get('/api/game/1/player-game/resource')
      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('resource')
    })
  })

  describe('GET /api/game/:gameId/player-game/buildings', () => {
    it('returns buildings list', async () => {
      const res = await request(app).get('/api/game/1/player-game/buildings')
      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('buildings')
      expect(res.body).toHaveProperty('buildable')
    })
  })

  /* ── Building Routes ── */
  describe('POST /api/game/:gameId/buildings/create', () => {
    it('creates a mine (not in starting buildings)', async () => {
      const res = await request(app)
        .post('/api/game/1/buildings/create')
        .send({ buildingType: 'mine' })
      expect(res.status).toBe(200)
      expect(res.body).toEqual({ success: true })
    })
  })

  describe('POST /api/game/:gameId/buildings/convert', () => {
    it('converts civilians to soldiers', async () => {
      const res = await request(app)
        .post('/api/game/1/buildings/convert')
        .send({ amount: 5 })
      expect(res.status).toBe(200)
    })
  })

  /* ── Battle Routes ── */
  describe('POST /api/game/:gameId/battle/player-pve', () => {
    it('executes player PvE battle', async () => {
      const res = await request(app)
        .post('/api/game/1/battle/player-pve')
        .send({ monsterId: 'wolf', rounds: 12, strategyType: 'VAR' })
      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('roundsCommitted')
      expect(res.body).toHaveProperty('roundsWon')
      expect(res.body).toHaveProperty('monsterName')
    })

    it('rejects unknown monster', async () => {
      const res = await request(app)
        .post('/api/game/1/battle/player-pve')
        .send({ monsterId: 'nonexistent', rounds: 12, strategyType: 'VAR' })
      expect(res.status).toBe(400)
      expect(res.body.error).toBe('Unknown monster')
    })
  })

  describe('POST /api/game/:gameId/battle/pvp', () => {
    it('rejects PvP battle for non-existent target', async () => {
      const res = await request(app)
        .post('/api/game/1/battle/pvp')
        .send({ targetId: 999, armyToCommit: 10 })
      expect(res.status).toBe(400)
    })
  })

  /* ── Monster Config Route ── */
  describe('GET /api/player-pve/monsters', () => {
    it('returns monster list', async () => {
      const res = await request(app).get('/api/player-pve/monsters')
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
      if (res.body.length > 0) {
        expect(res.body[0]).toHaveProperty('id')
        expect(res.body[0]).toHaveProperty('name')
      }
    })
  })

  /* ── PvP Routes ── */
  describe('GET /api/pvp/targets', () => {
    it('returns PvP targets', async () => {
      const res = await request(app).get('/api/pvp/targets')
      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('targets')
    })
  })

  /* ── Clan Routes ── */
  describe('POST /api/game/:gameId/clan/create', () => {
    it('creates a clan', async () => {
      const res = await request(app)
        .post('/api/game/1/clan/create')
        .send({ name: 'TestClan' })
      expect(res.status).toBe(201)
      expect(res.body).toHaveProperty('id')
      expect(res.body.name).toBe('TestClan')
    })
  })

  describe('GET /api/game/:gameId/clan/:id', () => {
    it('returns clan data', async () => {
      const res = await request(app).get('/api/game/1/clan/1')
      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('clan')
      expect(res.body).toHaveProperty('members')
      expect(res.body).toHaveProperty('buildings')
    })
  })

  describe('GET /api/game/:gameId/clan/:id/activation', () => {
    it('returns activation status', async () => {
      const res = await request(app).get('/api/game/1/clan/1/activation')
      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('activated')
    })
  })

  describe('GET /api/game/:gameId/clan/upkeep', () => {
    it('returns upkeep status', async () => {
      const res = await request(app).get('/api/game/1/clan/upkeep')
      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('met')
    })
  })

  describe('POST /api/game/:gameId/clan/:id/contribute', () => {
    it('contributes civilians to clan', async () => {
      const res = await request(app)
        .post('/api/game/1/clan/1/contribute')
        .send({ amount: 5 })
      expect(res.status).toBe(200)
    })
  })

  describe('POST /api/game/:gameId/clan/:id/buildings/upgrade', () => {
    it('contributes resources to clan building upgrade', async () => {
      // Need sufficient clan civilians to satisfy population requirement for level 2 upgrade
      await handle.dbRun('UPDATE clan_resources SET civilians = 20000 WHERE clan_id = 1')

      const res = await request(app)
        .post('/api/game/1/clan/1/buildings/upgrade')
        .send({ buildingType: 'farm', resourceType: 'food', amount: 1 })
      expect(res.status).toBe(200)
    })
  })

  describe('POST /api/game/:gameId/clan/:id/war', () => {
    it('rejects war on non-existent clan', async () => {
      const res = await request(app)
        .post('/api/game/1/clan/1/war')
        .send({ targetClanId: 999, armyToCommit: 10 })
      expect(res.status).toBe(400)
    })
  })

  describe('POST /api/game/:gameId/clan/:id/pve/start', () => {
    it('rejects clan PvE fight for non-existent monster', async () => {
      const res = await request(app)
        .post('/api/game/1/clan/1/pve/start')
        .send({ monsterId: 'nonexistent' })
      expect(res.status).toBe(400)
    })
  })
})
