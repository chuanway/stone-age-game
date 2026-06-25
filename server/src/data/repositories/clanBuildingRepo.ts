import { dbAll, dbGet, dbRun } from '../database'
import { ClanBuilding, BuildingType, ResourceType } from 'shared'

function mapClanBuilding(row: Record<string, any>): ClanBuilding {
  return {
    clanId: row.clan_id as number,
    type: row.type as ClanBuilding['type'],
    level: row.level as number,
    contributedWood: row.contributed_wood as number,
    contributedFood: row.contributed_food as number,
    contributedMetal: row.contributed_metal as number,
  }
}

export function findClanBuildings(clanId: number): ClanBuilding[] {
  const rows = dbAll('SELECT * FROM clan_buildings WHERE clan_id = ?', [clanId])
  return rows.map(mapClanBuilding)
}

export function findClanBuilding(clanId: number, type: BuildingType): ClanBuilding | undefined {
  const row = dbGet('SELECT * FROM clan_buildings WHERE clan_id = ? AND type = ?', [clanId, type])
  return row ? mapClanBuilding(row) : undefined
}

export function upsertClanBuilding(
  clanId: number, type: BuildingType, level: number,
  contributedWood: number, contributedFood: number, contributedMetal: number
): void {
  const existing = findClanBuilding(clanId, type)
  if (existing) {
    dbRun(
      `UPDATE clan_buildings SET level = ?, contributed_wood = ?, contributed_food = ?, contributed_metal = ?, updated_at = datetime('now') WHERE clan_id = ? AND type = ?`,
      [level, contributedWood, contributedFood, contributedMetal, clanId, type]
    )
  } else {
    dbRun(
      `INSERT INTO clan_buildings (clan_id, type, level, contributed_wood, contributed_food, contributed_metal) VALUES (?, ?, ?, ?, ?, ?)`,
      [clanId, type, level, contributedWood, contributedFood, contributedMetal]
    )
  }
}
