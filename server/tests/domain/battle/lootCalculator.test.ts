import { describe, it, expect } from 'vitest'
import { calculateLoot } from '../../../src/domain/battle/lootCalculator'
import type { LootTable } from 'shared'

describe('calculateLoot', () => {
  it('returns zeros for 0 rounds won', () => {
    const lootTable: LootTable = { food: { min: 10, max: 20 } }
    const loot = calculateLoot(0, lootTable)
    expect(loot.food).toBe(0)
    expect(loot.wood).toBe(0)
    expect(loot.metal).toBe(0)
  })

  it('calculates loot within range for 1 round', () => {
    const lootTable: LootTable = { food: { min: 10, max: 20 } }
    const loot = calculateLoot(1, lootTable)
    expect(loot.food).toBeGreaterThanOrEqual(10)
    expect(loot.food).toBeLessThanOrEqual(20)
  })

  it('scales loot linearly with rounds won', () => {
    const lootTable: LootTable = { food: { min: 10, max: 20 } }
    const loot = calculateLoot(3, lootTable)
    expect(loot.food).toBeGreaterThanOrEqual(30)
    expect(loot.food).toBeLessThanOrEqual(60)
  })

  it('handles multiple resource types', () => {
    const lootTable: LootTable = {
      food: { min: 20, max: 40 },
      wood: { min: 10, max: 30 },
      metal: { min: 5, max: 15 },
    }
    const loot = calculateLoot(2, lootTable)
    expect(loot.food).toBeGreaterThanOrEqual(40)
    expect(loot.food).toBeLessThanOrEqual(80)
    expect(loot.wood).toBeGreaterThanOrEqual(20)
    expect(loot.wood).toBeLessThanOrEqual(60)
    expect(loot.metal).toBeGreaterThanOrEqual(10)
    expect(loot.metal).toBeLessThanOrEqual(30)
  })

  it('handles empty loot table', () => {
    const loot = calculateLoot(5, {})
    expect(loot).toEqual({ food: 0, wood: 0, metal: 0, civilians: 0, soldiers: 0 })
  })

  it('returns integer values', () => {
    const lootTable: LootTable = { food: { min: 10, max: 10 } }
    const loot = calculateLoot(1, lootTable)
    expect(Number.isInteger(loot.food)).toBe(true)
  })
})
