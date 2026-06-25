import { dbGet, dbRun } from '../database'
import { Player } from 'shared'

function mapPlayer(row: Record<string, any>): Player {
  return {
    id: row.id as number,
    username: row.username as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

export function findPlayerById(id: number): Player | undefined {
  const row = dbGet('SELECT id, username, created_at, updated_at FROM players WHERE id = ?', [id])
  return row ? mapPlayer(row) : undefined
}

export function findPlayerByUsername(username: string): Player | undefined {
  const row = dbGet('SELECT id, username, created_at, updated_at FROM players WHERE username = ?', [username])
  return row ? mapPlayer(row) : undefined
}

export function createPlayer(username: string, passwordHash: string): Player {
  const result = dbRun('INSERT INTO players (username, password_hash) VALUES (?, ?)',
    [username, passwordHash])
  const player = findPlayerById(result.lastInsertRowid)
  if (!player) throw new Error('Failed to create player')
  return player
}

export function findPasswordHashByUsername(username: string): string | undefined {
  const row = dbGet('SELECT password_hash FROM players WHERE username = ?', [username])
  return row ? (row.password_hash as string) : undefined
}
