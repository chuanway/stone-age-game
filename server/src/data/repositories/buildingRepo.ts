import { dbAll, dbGet, dbRun } from '../database'
import { PlayerBuilding, BuildingType } from 'shared'
import { nowISO } from '../../utils/date'

function mapBuilding(row: Record<string, any>): PlayerBuilding {
  return {
    id: row.id as number,
    playerGameId: row.player_game_id as number,
    type: row.type as PlayerBuilding['type'],
    level: row.level as number,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

export function findBuildingsByPlayerGameId(playerGameId: number): PlayerBuilding[] {
  const rows = dbAll('SELECT * FROM player_buildings WHERE player_game_id = ?', [playerGameId])
  return rows.map(mapBuilding)
}

export function findBuilding(playerGameId: number, type: BuildingType): PlayerBuilding | undefined {
  const row = dbGet('SELECT * FROM player_buildings WHERE player_game_id = ? AND type = ?', [playerGameId, type])
  return row ? mapBuilding(row) : undefined
}

export function createBuilding(playerGameId: number, type: BuildingType, level: number = 1): void {
  dbRun('INSERT INTO player_buildings (player_game_id, type, level) VALUES (?, ?, ?)', [playerGameId, type, level])
}

export function updateBuildingLevel(id: number, level: number): void {
  dbRun("UPDATE player_buildings SET level = ?, updated_at = ? WHERE id = ?", [level, nowISO(), id])
}
