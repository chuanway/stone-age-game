import { dbAll, dbGet, dbRun } from '../database'
import { Clan, ClanMember, ClanMemberDetail, StatType } from 'shared'
import { nowISO } from '../../utils/date'

function mapClan(row: Record<string, any>): Clan {
  return {
    id: row.id as number,
    ownerId: row.owner_id as number,
    gameId: row.game_id as number,
    name: row.name as string,
    clanAttackLevel: row.clan_attack_level as number,
    clanDefenseLevel: row.clan_defense_level as number,
    clanAttackProgress: row.clan_attack_progress as number,
    clanDefenseProgress: row.clan_defense_progress as number,
    lastAttackAt: row.last_attack_at as string | null,
    lastDefendedAt: row.last_defended_at as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

function mapClanMember(row: Record<string, any>): ClanMember {
  return {
    id: row.id as number,
    clanId: row.clan_id as number,
    playerGameId: row.player_game_id as number,
    role: row.role as ClanMember['role'],
    contributedCivilians: row.contributed_civilians as number,
    clanEnergy: row.clan_energy as number,
    clanMaxEnergy: row.clan_max_energy as number,
    clanLastEnergyAt: row.clan_last_energy_at as string | null,
    createdAt: row.joined_at as string,
    updatedAt: row.joined_at as string,
  }
}

export function findClanById(id: number): Clan | undefined {
  const row = dbGet('SELECT * FROM clans WHERE id = ?', [id])
  return row ? mapClan(row) : undefined
}

export function findClanMembers(clanId: number): ClanMember[] {
  const rows = dbAll('SELECT * FROM clan_members WHERE clan_id = ?', [clanId])
  return rows.map(mapClanMember)
}

export function findMemberByPlayerGameId(playerGameId: number): ClanMember | undefined {
  const row = dbGet('SELECT * FROM clan_members WHERE player_game_id = ?', [playerGameId])
  return row ? mapClanMember(row) : undefined
}

export function findClanByName(name: string, ownerId: number): Clan | undefined {
  const pg = dbGet('SELECT game_id FROM game_players WHERE id = ?', [ownerId]) as { game_id: number } | undefined
  if (!pg) return undefined
  const row = dbGet('SELECT * FROM clans WHERE LOWER(name) = LOWER(?) AND game_id = ?', [name, pg.game_id])
  return row ? mapClan(row) : undefined
}

export function searchClansByName(name: string, gameId: number): Clan[] {
  const rows = dbAll(
    'SELECT * FROM clans WHERE LOWER(name) LIKE LOWER(?) AND game_id = ? ORDER BY name ASC',
    [`%${name}%`, gameId]
  )
  return rows.map(mapClan)
}

export function getClanMemberCount(clanId: number): number {
  const row = dbGet('SELECT COUNT(*) as count FROM clan_members WHERE clan_id = ?', [clanId])
  return (row?.count as number) ?? 0
}

export function createClan(name: string, ownerId: number): Clan {
  const now = nowISO()
  const pg = dbGet('SELECT game_id FROM game_players WHERE id = ?', [ownerId]) as { game_id: number } | undefined
  const gameId = pg ? pg.game_id : 1
  const result = dbRun(
    'INSERT INTO clans (name, owner_id, game_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
    [name, ownerId, gameId, now, now]
  )
  const clanId = result.lastInsertRowid
  dbRun('INSERT INTO clan_members (clan_id, player_game_id, role, joined_at) VALUES (?, ?, ?, ?)',
    [clanId, ownerId, 'leader', now])
  const clan = findClanById(clanId)
  if (!clan) throw new Error('Failed to create clan')
  return clan
}

export function addClanMember(clanId: number, playerGameId: number, role: string = 'member'): void {
  dbRun('INSERT INTO clan_members (clan_id, player_game_id, role, joined_at) VALUES (?, ?, ?, ?)',
    [clanId, playerGameId, role, nowISO()])
}

export interface MemberWithUsername {
  id: number
  clanId: number
  playerGameId: number
  username: string
  role: string
  contributedCivilians: number
  clanEnergy: number
  clanMaxEnergy: number
  clanLastEnergyAt: string | null
  joinedAt: string
}

export function removeClanMember(playerGameId: number): void {
  dbRun('DELETE FROM clan_members WHERE player_game_id = ?', [playerGameId])
}

export function updateMemberRole(clanId: number, playerGameId: number, role: string): void {
  dbRun('UPDATE clan_members SET role = ? WHERE clan_id = ? AND player_game_id = ?', [role, clanId, playerGameId])
}

export function addContributedCivilians(playerGameId: number, amount: number): void {
  dbRun('UPDATE clan_members SET contributed_civilians = contributed_civilians + ? WHERE player_game_id = ?', [amount, playerGameId])
}

export function updateClanEnergy(id: number, energy: number, lastEnergyAt: string): void {
  dbRun(
    'UPDATE clan_members SET clan_energy = ?, clan_last_energy_at = ?, updated_at = ? WHERE id = ?',
    [energy, lastEnergyAt, nowISO(), id]
  )
}

export function updateClanStat(clanId: number, statType: StatType, level: number, progress: number): void {
  const col = statType === 'attack' ? 'clan_attack' : 'clan_defense'
  dbRun(`UPDATE clans SET ${col}_level = ?, ${col}_progress = ?, updated_at = ? WHERE id = ?`, [level, progress, nowISO(), clanId])
}

export function updateLastAttackAt(clanId: number): void {
  dbRun('UPDATE clans SET last_attack_at = ?, updated_at = ? WHERE id = ?', [nowISO(), nowISO(), clanId])
}

export function updateLastDefendedAt(clanId: number): void {
  dbRun('UPDATE clans SET last_defended_at = ?, updated_at = ? WHERE id = ?', [nowISO(), nowISO(), clanId])
}

export function deleteClan(clanId: number): void {
  dbRun('DELETE FROM clan_pve_battles WHERE clan_id = ?', [clanId])
  dbRun('DELETE FROM clan_pve_contributions WHERE pve_battle_id NOT IN (SELECT id FROM clan_pve_battles)', [])
  dbRun('DELETE FROM clan_wars WHERE attacker_clan_id = ? OR defender_clan_id = ?', [clanId, clanId])
  dbRun('DELETE FROM clan_resources WHERE clan_id = ?', [clanId])
  dbRun('DELETE FROM clan_buildings WHERE clan_id = ?', [clanId])
  dbRun('DELETE FROM clan_members WHERE clan_id = ?', [clanId])

  dbRun('DELETE FROM clans WHERE id = ?', [clanId])
}

export function transferOwnership(clanId: number, newOwnerPlayerGameId: number): void {
  dbRun('UPDATE clans SET owner_id = ?, updated_at = ? WHERE id = ?', [newOwnerPlayerGameId, nowISO(), clanId])
}

export function findClanMembersWithUsernames(clanId: number): MemberWithUsername[] {
  const rows = dbAll(
    `SELECT cm.*, p.username
     FROM clan_members cm
     JOIN game_players pg ON cm.player_game_id = pg.id
     JOIN players p ON pg.player_id = p.id
     WHERE cm.clan_id = ?
     ORDER BY cm.role ASC, p.username ASC`,
    [clanId]
  )
  return rows.map(r => ({
    id: r.id as number,
    clanId: r.clan_id as number,
    playerGameId: r.player_game_id as number,
    username: r.username as string,
    role: r.role as string,
    contributedCivilians: r.contributed_civilians as number,
    clanEnergy: r.clan_energy as number,
    clanMaxEnergy: r.clan_max_energy as number,
    clanLastEnergyAt: r.clan_last_energy_at as string | null,
    joinedAt: r.joined_at as string,
  }))
}
