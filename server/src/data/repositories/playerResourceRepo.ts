import { dbAll, dbGet, dbRun } from '../database'
import { PlayerResource, ResourceHolder } from 'shared'
import { nowISO } from '../../utils/date'

function mapResource(row: Record<string, any>): PlayerResource {
  return {
    id: row.id as number,
    playerGameId: row.player_game_id as number,
    food: row.food as number,
    wood: row.wood as number,
    metal: row.metal as number,
    civilians: row.civilians as number,
    soldiers: row.soldiers as number,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

export function findByPlayerGameId(playerGameId: number): PlayerResource | undefined {
  const row = dbGet('SELECT * FROM player_resources WHERE player_game_id = ?', [playerGameId])
  return row ? mapResource(row) : undefined
}

function findById(id: number): PlayerResource | undefined {
  const row = dbGet('SELECT * FROM player_resources WHERE id = ?', [id])
  return row ? mapResource(row) : undefined
}

export function findAll(): Array<{ id: number; playerGameId: number; playerId: number; civilians: number; soldiers: number }> {
  return dbAll(
    'SELECT r.id, r.player_game_id, pg.player_id, r.civilians, r.soldiers FROM player_resources r JOIN game_players pg ON pg.id = r.player_game_id'
  ) as Array<{ id: number; playerGameId: number; playerId: number; civilians: number; soldiers: number }>
}

export function create(playerGameId: number): PlayerResource {
  const now = nowISO()
  const result = dbRun(
    'INSERT INTO player_resources (player_game_id, food, wood, metal, civilians, soldiers, created_at, updated_at) VALUES (?, 200, 150, 50, 10, 0, ?, ?)',
    [playerGameId, now, now]
  )
  const resource = findById(result.lastInsertRowid)
  if (!resource) throw new Error('Failed to create resource')
  return resource
}

export function update(id: number, data: Partial<ResourceHolder>): void {
  const sets: string[] = []
  const params: any[] = []
  if (data.food !== undefined) { sets.push('food = ?'); params.push(data.food) }
  if (data.wood !== undefined) { sets.push('wood = ?'); params.push(data.wood) }
  if (data.metal !== undefined) { sets.push('metal = ?'); params.push(data.metal) }
  if (data.civilians !== undefined) { sets.push('civilians = ?'); params.push(data.civilians) }
  if (data.soldiers !== undefined) { sets.push('soldiers = ?'); params.push(data.soldiers) }
  if (sets.length === 0) return
  params.push(nowISO(), id)
  dbRun(`UPDATE player_resources SET ${sets.join(', ')}, updated_at = ? WHERE id = ?`, params)
}
