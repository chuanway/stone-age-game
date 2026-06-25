import { dbAll, dbGet, dbRun } from '../database'
import { nowISO } from '../../utils/date'

export interface PveBattleRow {
  id: number
  clanId: number
  monsterId: string
  totalHp: number
  currentHp: number
  state: string
  leaderId: number
  lootPerMember: string
  collected: string
  createdAt: string
  updatedAt: string
}

export interface PveContributionRow {
  id: number
  pveBattleId: number
  playerGameId: number
  soldiersSpent: number
  damageDealt: number
  createdAt: string
}

function mapPveBattle(row: Record<string, any>): PveBattleRow {
  return {
    id: row.id as number,
    clanId: row.clan_id as number,
    monsterId: row.monster_id as string,
    totalHp: row.total_hp as number,
    currentHp: row.current_hp as number,
    state: row.state as string,
    leaderId: row.leader_id as number,
    lootPerMember: row.loot_per_member as string,
    collected: row.collected as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

function mapPveContribution(row: Record<string, any>): PveContributionRow {
  return {
    id: row.id as number,
    pveBattleId: row.pve_battle_id as number,
    playerGameId: row.player_game_id as number,
    soldiersSpent: row.soldiers_spent as number,
    damageDealt: row.damage_dealt as number,
    createdAt: row.created_at as string,
  }
}

export function findActivePveBattle(clanId: number): PveBattleRow | undefined {
  const row = dbGet(
    'SELECT * FROM clan_pve_battles WHERE clan_id = ? AND state = \'active\' ORDER BY id DESC LIMIT 1',
    [clanId]
  )
  return row ? mapPveBattle(row) : undefined
}

export function findDefeatedPveBattle(clanId: number): PveBattleRow | undefined {
  const row = dbGet(
    'SELECT * FROM clan_pve_battles WHERE clan_id = ? AND state = \'defeated\' ORDER BY id DESC LIMIT 1',
    [clanId]
  )
  return row ? mapPveBattle(row) : undefined
}

export function insertPveBattle(
  clanId: number,
  monsterId: string,
  totalHp: number,
  leaderId: number,
  lootPerMember: string
): number {
  const now = nowISO()
  const result = dbRun(
    `INSERT INTO clan_pve_battles (clan_id, monster_id, total_hp, current_hp, state, leader_id, loot_per_member, collected, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'active', ?, ?, '[]', ?, ?)`,
    [clanId, monsterId, totalHp, totalHp, leaderId, lootPerMember, now, now]
  )
  return result.lastInsertRowid as number
}

export function updatePveBattleHp(id: number, currentHp: number, state: string): void {
  dbRun(
    'UPDATE clan_pve_battles SET current_hp = ?, state = ?, updated_at = ? WHERE id = ?',
    [currentHp, state, nowISO(), id]
  )
}

export function insertPveContribution(
  pveBattleId: number,
  playerGameId: number,
  soldiersSpent: number,
  damageDealt: number
): void {
  dbRun(
    `INSERT INTO clan_pve_contributions (pve_battle_id, player_game_id, soldiers_spent, damage_dealt, created_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(pve_battle_id, player_game_id) DO UPDATE SET
       soldiers_spent = soldiers_spent + excluded.soldiers_spent,
       damage_dealt = damage_dealt + excluded.damage_dealt`,
    [pveBattleId, playerGameId, soldiersSpent, damageDealt, nowISO()]
  )
}

export function hasPlayerParticipated(pveBattleId: number, playerGameId: number): boolean {
  const row = dbGet(
    'SELECT id FROM clan_pve_contributions WHERE pve_battle_id = ? AND player_game_id = ?',
    [pveBattleId, playerGameId]
  )
  return !!row
}

export function getParticipantCount(pveBattleId: number): number {
  const row = dbGet('SELECT COUNT(DISTINCT player_game_id) as count FROM clan_pve_contributions WHERE pve_battle_id = ?', [pveBattleId]) as { count: number } | undefined
  return row?.count ?? 0
}

export function updateCollected(pveBattleId: number, collected: string): void {
  dbRun(
    'UPDATE clan_pve_battles SET collected = ?, updated_at = ? WHERE id = ?',
    [collected, nowISO(), pveBattleId]
  )
}

export function getPveStatsByClan(clanId: number): { playerGameId: number; pveBattlesAttended: number; pveDamageDealt: number; pveSoldiersSpent: number }[] {
  const rows = dbAll(
    `SELECT bc.player_game_id,
            COUNT(DISTINCT bc.pve_battle_id) as pve_battles_attended,
            SUM(bc.soldiers_spent) as pve_soldiers_spent,
            SUM(bc.damage_dealt) as pve_damage_dealt
     FROM clan_pve_contributions bc
     JOIN clan_pve_battles cbf ON bc.pve_battle_id = cbf.id
     WHERE cbf.clan_id = ?
     GROUP BY bc.player_game_id`,
    [clanId]
  )
  return rows.map(r => ({
    playerGameId: r.player_game_id as number,
    pveBattlesAttended: r.pve_battles_attended as number,
    pveDamageDealt: r.pve_damage_dealt as number,
    pveSoldiersSpent: r.pve_soldiers_spent as number,
  }))
}


