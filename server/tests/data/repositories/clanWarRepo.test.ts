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

describe('clanWarRepo', () => {
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
    db.dbRun('INSERT INTO players (id, username, password_hash, created_at) VALUES (2, \'p2\', \'hash\', datetime(\'now\'))')
    db.dbRun('INSERT INTO players (id, username, password_hash, created_at) VALUES (3, \'p3\', \'hash\', datetime(\'now\'))')

    db.dbRun(
      `INSERT INTO game_players (id, player_id, game_id, last_tick_at, created_at)
       VALUES (100, 1, 1, datetime('now'), datetime('now'))`
    )
    db.dbRun(
      `INSERT INTO game_players (id, player_id, game_id, last_tick_at, created_at)
       VALUES (101, 2, 1, datetime('now'), datetime('now'))`
    )
    db.dbRun(
      `INSERT INTO game_players (id, player_id, game_id, last_tick_at, created_at)
       VALUES (200, 3, 1, datetime('now'), datetime('now'))`
    )
    db.dbRun(
      `INSERT INTO clans (id, name, owner_id, game_id, created_at, updated_at)
       VALUES (1, 'AttackerClan', 100, 1, datetime('now'), datetime('now'))`
    )
    db.dbRun(
      `INSERT INTO clans (id, name, owner_id, game_id, created_at, updated_at)
       VALUES (2, 'DefenderClan', 200, 1, datetime('now'), datetime('now'))`
    )
    db.dbRun(
      `INSERT INTO clans (id, name, owner_id, game_id, created_at, updated_at)
       VALUES (3, 'NeutralClan', 200, 1, datetime('now'), datetime('now'))`
    )
    db.dbRun(
      `INSERT INTO clan_members (id, clan_id, player_game_id, role, contributed_civilians, joined_at)
       VALUES (10, 1, 100, 'leader', 100, datetime('now'))`
    )
    db.dbRun(
      `INSERT INTO clan_members (id, clan_id, player_game_id, role, contributed_civilians, joined_at)
       VALUES (11, 1, 101, 'member', 50, datetime('now'))`
    )
    db.dbRun(
      `INSERT INTO clan_members (id, clan_id, player_game_id, role, contributed_civilians, joined_at)
       VALUES (12, 2, 200, 'leader', 100, datetime('now'))`
    )
    db.dbRun(
      `INSERT INTO clan_resources (id, clan_id, food, wood, metal, civilians, soldiers)
       VALUES (1, 1, 1000, 1000, 1000, 10000, 500)`
    )
    db.dbRun(
      `INSERT INTO clan_resources (id, clan_id, food, wood, metal, civilians, soldiers)
       VALUES (2, 2, 1000, 1000, 1000, 5000, 200)`
    )
  }

  function cleanAll() {
    db.dbRun('DELETE FROM clan_war_participants')
    db.dbRun('DELETE FROM clan_wars')
    db.dbRun('DELETE FROM clan_resources')
    db.dbRun('DELETE FROM clan_members')
    db.dbRun('DELETE FROM clans')
    db.dbRun('DELETE FROM game_players')
    db.dbRun('DELETE FROM players')
    db.dbRun('DELETE FROM games')
    db.dbRun("DELETE FROM sqlite_sequence WHERE name IN ('players','games','game_players','clans','clan_members','clan_resources','clan_wars','clan_war_participants')")
  }

  describe('insertWarParticipants', () => {
    it('records all members for a war', async () => {
      seedBaseTables()

      const inserted = db.dbRun(
        `INSERT INTO clan_wars (attacker_clan_id, defender_clan_id, attacker_army, defender_army,
          rounds_committed, rounds_won, rounds_lost, enslaved, winner_clan_id, created_at)
         VALUES (1, 2, 100, 50, 5, 3, 2, 10, 1, datetime('now'))`
      )
      const warId = inserted.lastInsertRowid

      const { insertWarParticipants, getWarParticipantsByClan } = await import('../../../src/data/repositories/clanWarRepo')
      insertWarParticipants(warId, [100, 101])

      const participants = getWarParticipantsByClan(1)
      expect(participants).toHaveLength(2)
      expect(participants.find(p => p.playerGameId === 100)!.warsParticipated).toBe(1)
      expect(participants.find(p => p.playerGameId === 101)!.warsParticipated).toBe(1)

      cleanAll()
    })
  })

  describe('getWarParticipantsByClan', () => {
    it('returns aggregated war counts per member', async () => {
      seedBaseTables()

      const w1 = db.dbRun(
        `INSERT INTO clan_wars (attacker_clan_id, defender_clan_id, attacker_army, defender_army,
          rounds_committed, rounds_won, rounds_lost, enslaved, winner_clan_id, created_at)
         VALUES (1, 2, 100, 50, 5, 3, 2, 10, 1, datetime('now'))`
      )
      const w2 = db.dbRun(
        `INSERT INTO clan_wars (attacker_clan_id, defender_clan_id, attacker_army, defender_army,
          rounds_committed, rounds_won, rounds_lost, enslaved, winner_clan_id, created_at)
         VALUES (1, 2, 100, 50, 5, 3, 2, 10, 1, datetime('now'))`
      )

      db.dbRun('INSERT INTO clan_war_participants (war_id, player_game_id) VALUES (?, ?)', [w1.lastInsertRowid, 100])
      db.dbRun('INSERT INTO clan_war_participants (war_id, player_game_id) VALUES (?, ?)', [w1.lastInsertRowid, 101])
      db.dbRun('INSERT INTO clan_war_participants (war_id, player_game_id) VALUES (?, ?)', [w2.lastInsertRowid, 100])

      const { getWarParticipantsByClan } = await import('../../../src/data/repositories/clanWarRepo')
      const participants = getWarParticipantsByClan(1)

      expect(participants.find(p => p.playerGameId === 100)!.warsParticipated).toBe(2)
      expect(participants.find(p => p.playerGameId === 101)!.warsParticipated).toBe(1)

      cleanAll()
    })
  })

  describe('getWarHistory', () => {
    it('returns wars where clan is attacker or defender', async () => {
      seedBaseTables()

      db.dbRun(
        `INSERT INTO clan_wars (attacker_clan_id, defender_clan_id, attacker_army, defender_army,
          rounds_committed, rounds_won, rounds_lost, enslaved, winner_clan_id, created_at)
         VALUES (1, 2, 100, 50, 5, 3, 2, 10, 1, datetime('now'))`
      )
      db.dbRun(
        `INSERT INTO clan_wars (attacker_clan_id, defender_clan_id, attacker_army, defender_army,
          rounds_committed, rounds_won, rounds_lost, enslaved, winner_clan_id, created_at)
         VALUES (3, 1, 100, 50, 4, 1, 3, 5, 3, datetime('now'))`
      )

      const { getWarHistory } = await import('../../../src/data/repositories/clanWarRepo')
      const wars = getWarHistory(1)

      expect(wars).toHaveLength(2)
      expect(wars.some(w => w.attackerClanId === 1)).toBe(true)
      expect(wars.some(w => w.defenderClanId === 1)).toBe(true)

      cleanAll()
    })

    it('returns empty array for clan with no war history', async () => {
      const { getWarHistory } = await import('../../../src/data/repositories/clanWarRepo')
      const wars = getWarHistory(999)
      expect(wars).toEqual([])
    })
  })
})
