import { dbGet, dbRun } from '../database'
import { ResourceHolder, ResourceType } from 'shared'
import { nowISO } from '../../utils/date'

export interface ClanResourceRow {
  id: number
  clanId: number
  food: number
  wood: number
  metal: number
  civilians: number
  soldiers: number
  foodCapacity: number
  woodCapacity: number
  metalCapacity: number
  lastProductionTickAt: string | null
  createdAt: string
  updatedAt: string
}

function mapRow(row: Record<string, any>): ClanResourceRow {
  return {
    id: row.id as number,
    clanId: row.clan_id as number,
    food: row.food as number,
    wood: row.wood as number,
    metal: row.metal as number,
    civilians: row.civilians as number,
    soldiers: row.soldiers as number,
    foodCapacity: row.food_capacity as number,
    woodCapacity: row.wood_capacity as number,
    metalCapacity: row.metal_capacity as number,
    lastProductionTickAt: row.last_production_tick_at as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

export function findByClanId(clanId: number): ClanResourceRow | undefined {
  const row = dbGet('SELECT * FROM clan_resources WHERE clan_id = ?', [clanId])
  return row ? mapRow(row) : undefined
}

export function create(clanId: number): ClanResourceRow {
  const now = nowISO()
  const result = dbRun(
    'INSERT INTO clan_resources (clan_id, food, wood, metal, civilians, soldiers, created_at, updated_at) VALUES (?, 200, 150, 50, 10, 0, ?, ?)',
    [clanId, now, now]
  )
  const resource = findByClanId(clanId)
  if (!resource) throw new Error('Failed to create clan resource')
  return resource
}

export function updateTickAt(id: number, tickAt: string): void {
  dbRun('UPDATE clan_resources SET last_production_tick_at = ?, updated_at = ? WHERE id = ?', [tickAt, nowISO(), id])
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
  dbRun(`UPDATE clan_resources SET ${sets.join(', ')}, updated_at = ? WHERE id = ?`, params)
}

export function addContribution(clanId: number, resourceType: ResourceType, amount: number): void {
  dbRun(`UPDATE clan_resources SET ${resourceType} = ${resourceType} + ?, updated_at = datetime('now') WHERE clan_id = ?`,
    [amount, clanId])
}
