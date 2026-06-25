import { dbAll, dbGet, dbRun } from '../database'
import { PlayerGame } from 'shared'
import { nowISO } from '../../utils/date'

function mapGamePlayer(row: Record<string, any>): PlayerGame {
  return {
    id: row.id as number,
    playerId: row.player_id as number,
    gameId: row.game_id as number,
    attackStat: row.attack_stat as number,
    defenseStat: row.defense_stat as number,
    lastTickAt: row.last_tick_at as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

export function findByPlayerAndGame(playerId: number, gameId: number): PlayerGame | undefined {
  const row = dbGet('SELECT * FROM game_players WHERE player_id = ? AND game_id = ?', [playerId, gameId])
  return row ? mapGamePlayer(row) : undefined
}

export function findById(id: number): PlayerGame | undefined {
  const row = dbGet('SELECT * FROM game_players WHERE id = ?', [id])
  return row ? mapGamePlayer(row) : undefined
}

export function create(playerId: number, gameId: number): PlayerGame {
  const now = nowISO()
  const result = dbRun(
    'INSERT INTO game_players (player_id, game_id, last_tick_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
    [playerId, gameId, now, now, now]
  )
  const playerGame = findById(result.lastInsertRowid)
  if (!playerGame) throw new Error('Failed to create playerGame')
  return playerGame
}

export function updateStats(id: number, attackStat: number, defenseStat: number): void {
  dbRun(
    "UPDATE game_players SET attack_stat = ?, defense_stat = ?, updated_at = ? WHERE id = ?",
    [attackStat, defenseStat, nowISO(), id]
  )
}

export function updateLastTickAt(id: number, lastTickAt: string): void {
  dbRun(
    "UPDATE game_players SET last_tick_at = ?, updated_at = ? WHERE id = ?",
    [lastTickAt, nowISO(), id]
  )
}
