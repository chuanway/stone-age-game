import { describe, it, expect } from 'vitest'
import { calculateProduction, computeTickProgress } from '../../../src/domain/economy/resourceTick'
import type { PlayerBuilding, BuildingConfig } from 'shared'

describe('calculateProduction', () => {
  const baseConfigs: Record<string, BuildingConfig> = {
    farm: {
      name: 'Farm',
      produces: 'food',
      productionRatePerLevel: 10,
      upgradeLimitLevel: 0,
      upgradeCosts: { food: { base: 100, multiplier: 1.5 } },
      operationalThreshold: 5,
    },
    house: {
      name: 'House',
      produces: 'civilians',
      productionRatePerLevel: 2,
      upgradeLimitLevel: 0,
      upgradeCosts: { food: { base: 50, multiplier: 1.5 }, wood: { base: 50, multiplier: 1.5 } },
      operationalThreshold: null,
    },
    lumberjackHut: {
      name: 'Lumberjack Hut',
      produces: 'wood',
      productionRatePerLevel: 8,
      upgradeLimitLevel: 0,
      upgradeCosts: { wood: { base: 80, multiplier: 1.5 } },
      operationalThreshold: 3,
    },
    armoury: {
      name: 'Armoury',
      produces: 'stats',
      productionRatePerLevel: 0,
      upgradeLimitLevel: 0,
      upgradeCosts: { metal: { base: 200, multiplier: 2 } },
      operationalThreshold: null,
    },
  }

  it('returns zero delta for no buildings', () => {
    const delta = calculateProduction([], 10, baseConfigs, 1)
    expect(delta).toEqual({ food: 0, wood: 0, metal: 0, civilians: 0, soldiers: 0 })
  })

  it('calculates production for active buildings over 1 hour', () => {
    const buildings: PlayerBuilding[] = [
      { id: 1, playerId: 1, type: 'farm', level: 2, createdAt: '', updatedAt: '' },
      { id: 2, playerId: 1, type: 'lumberjackHut', level: 1, createdAt: '', updatedAt: '' },
    ]
    const delta = calculateProduction(buildings, 10, baseConfigs, 1)
    expect(delta.food).toBe(20)
    expect(delta.wood).toBe(8)
    expect(delta.metal).toBe(0)
  })

  it('skips buildings below operational threshold', () => {
    const buildings: PlayerBuilding[] = [
      { id: 1, playerId: 1, type: 'farm', level: 1, createdAt: '', updatedAt: '' },
    ]
    const delta = calculateProduction(buildings, 2, baseConfigs, 1)
    expect(delta.food).toBe(0)
  })

  it('allows house to produce even below threshold', () => {
    const buildings: PlayerBuilding[] = [
      { id: 1, playerId: 1, type: 'house', level: 1, createdAt: '', updatedAt: '' },
    ]
    const delta = calculateProduction(buildings, 0, baseConfigs, 1)
    expect(delta.civilians).toBe(2)
  })

  it('skips buildings with null produces (e.g. armoury/stats)', () => {
    const buildings: PlayerBuilding[] = [
      { id: 1, playerId: 1, type: 'armoury', level: 5, createdAt: '', updatedAt: '' },
    ]
    const delta = calculateProduction(buildings, 10, baseConfigs, 1)
    expect(delta.food).toBe(0)
    expect(delta.wood).toBe(0)
    expect(delta.metal).toBe(0)
    expect(delta.civilians).toBe(0)
  })

  it('scales production linearly with time', () => {
    const buildings: PlayerBuilding[] = [
      { id: 1, playerId: 1, type: 'farm', level: 1, createdAt: '', updatedAt: '' },
    ]
    const oneHour = calculateProduction(buildings, 10, baseConfigs, 1)
    const twoHours = calculateProduction(buildings, 10, baseConfigs, 2)
    expect(twoHours.food).toBe(oneHour.food * 2)
  })

  it('ignores buildings with no matching config', () => {
    const buildings: PlayerBuilding[] = [
      { id: 1, playerId: 1, type: 'nonexistent', level: 1, createdAt: '', updatedAt: '' },
    ]
    const delta = calculateProduction(buildings, 10, baseConfigs, 1)
    expect(delta.food).toBe(0)
    expect(delta.wood).toBe(0)
  })
})

describe('computeTickProgress', () => {
  it('returns zero full intervals when elapsed is less than one tick', () => {
    const result = computeTickProgress(120000, 300000)
    expect(result).toEqual({ fullIntervals: 0, remainderMs: 120000 })
  })

  it('returns one full interval when elapsed equals one tick', () => {
    const result = computeTickProgress(300000, 300000)
    expect(result).toEqual({ fullIntervals: 1, remainderMs: 0 })
  })

  it('returns zero values when elapsed is zero', () => {
    const result = computeTickProgress(0, 300000)
    expect(result).toEqual({ fullIntervals: 0, remainderMs: 0 })
  })

  it('accumulates partial time across multiple refreshes without losing progress', () => {
    const tickIntervalMs = 300000
    let lastTickAt = 0

    // T=2min: elapsed 120s from T=0
    let result = computeTickProgress(120000, tickIntervalMs)
    expect(result).toEqual({ fullIntervals: 0, remainderMs: 120000 })

    // T=7min: elapsed 420s from T=0 (lastTickAt hasn't advanced)
    result = computeTickProgress(420000, tickIntervalMs)
    expect(result).toEqual({ fullIntervals: 1, remainderMs: 120000 })
    lastTickAt += result.fullIntervals * tickIntervalMs

    // T=9min: elapsed 240s from new lastTickAt (T=5min)
    result = computeTickProgress(240000, tickIntervalMs)
    expect(result).toEqual({ fullIntervals: 0, remainderMs: 240000 })

    // T=12min: elapsed 420s from T=5min
    result = computeTickProgress(420000, tickIntervalMs)
    expect(result).toEqual({ fullIntervals: 1, remainderMs: 120000 })
    lastTickAt += result.fullIntervals * tickIntervalMs

    expect(lastTickAt).toBe(600000)
  })
})
