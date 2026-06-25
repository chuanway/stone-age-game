import { describe, it, expect } from 'vitest'
import { calculateClanProduction, getPopulationRequirement } from '../../../src/domain/clan/clanProduction'
import type { PopulationRequirement } from '../../../src/domain/clan/clanProduction'

describe('getPopulationRequirement', () => {
  const req: PopulationRequirement = { base: 10000, multiplier: 1.2 }

  it('returns base for level 1', () => {
    expect(getPopulationRequirement(req, 1)).toBe(10000)
  })

  it('scales with multiplier per level', () => {
    expect(getPopulationRequirement(req, 2)).toBe(12000)
    expect(getPopulationRequirement(req, 3)).toBe(14400)
    expect(getPopulationRequirement(req, 4)).toBe(17280)
  })

  it('rounds the result', () => {
    const req2: PopulationRequirement = { base: 10, multiplier: 1.5 }
    expect(getPopulationRequirement(req2, 3)).toBe(Math.round(10 * Math.pow(1.5, 2)))
  })
})

describe('calculateClanProduction', () => {
  it('returns zero for no buildings', () => {
    const result = calculateClanProduction(10000, [])
    expect(result).toEqual({ food: 0, wood: 0, metal: 0 })
  })

  it('produces resources from buildings meeting population requirement', () => {
    const buildings = [
      { type: 'farm', level: 2, config: { productionRatePerLevel: 2, populationRequirement: { base: 10000, multiplier: 1.2 } } },
      { type: 'lumberjackHut', level: 3, config: { productionRatePerLevel: 1, populationRequirement: { base: 10000, multiplier: 1.2 } } },
    ]
    // farm: 2*2 = 4 food, lumberjack: 1*3 = 3 wood
    const result = calculateClanProduction(15000, buildings)
    expect(result).toEqual({ food: 4, wood: 3, metal: 0 })
  })

  it('skips buildings that do not meet population requirement', () => {
    const buildings = [
      { type: 'farm', level: 2, config: { productionRatePerLevel: 2, populationRequirement: { base: 10000, multiplier: 1.2 } } },
    ]
    // Level 2 requires 12000 pop, but clan has 11000 → building is skipped
    const result = calculateClanProduction(11000, buildings)
    expect(result).toEqual({ food: 0, wood: 0, metal: 0 })
  })

  it('produces from buildings without population requirement', () => {
    const buildings = [
      { type: 'mine', level: 5, config: { productionRatePerLevel: 1 } },
    ]
    const result = calculateClanProduction(0, buildings)
    expect(result).toEqual({ food: 0, wood: 0, metal: 5 })
  })

  it('handles mixed building types', () => {
    const buildings = [
      { type: 'farm', level: 1, config: { productionRatePerLevel: 2 } },
      { type: 'lumberjackHut', level: 2, config: { productionRatePerLevel: 1 } },
      { type: 'mine', level: 3, config: { productionRatePerLevel: 1 } },
    ]
    const result = calculateClanProduction(0, buildings)
    expect(result).toEqual({ food: 2, wood: 2, metal: 3 })
  })

  it('ignores unknown building types', () => {
    const buildings = [
      { type: 'barracks', level: 1, config: { productionRatePerLevel: 5 } },
    ]
    const result = calculateClanProduction(0, buildings)
    expect(result).toEqual({ food: 0, wood: 0, metal: 0 })
  })
})
