import { dbAll, dbGet, dbRun } from '../database'
import { Game } from 'shared'

function mapGame(row: Record<string, any>): Game {
  return {
    id: row.id as number,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    status: row.status as string,
  }
}

function findById(id: number): Game | undefined {
  const row = dbGet('SELECT * FROM games WHERE id = ?', [id])
  return row ? mapGame(row) : undefined
}

export function findByPlayerId(playerId: number): Game | undefined {
  const row = dbGet(
    'SELECT g.* FROM games g JOIN game_players pg ON pg.game_id = g.id WHERE pg.player_id = ?',
    [playerId]
  )
  return row ? mapGame(row) : undefined
}

export function findActive(): Game | undefined {
  const row = dbGet('SELECT * FROM games WHERE status = \'active\' ORDER BY id ASC LIMIT 1')
  return row ? mapGame(row) : undefined
}

export function create(): Game {
  const result = dbRun('INSERT INTO games (status) VALUES (\'active\')')
  const game = findById(result.lastInsertRowid)
  if (!game) throw new Error('Failed to create game')
  return game
}
