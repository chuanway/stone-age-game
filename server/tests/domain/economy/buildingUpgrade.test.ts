import { describe, it, expect } from 'vitest'
import { getUpgradeCost, canAffordUpgrade, deductCost } from '../../../src/domain/economy/buildingUpgrade'
import type { BuildingConfig } from 'shared'

describe('buildingUpgrade', () => {
  const farmConfig: BuildingConfig = {
    name: 'Farm',
    produces: 'food',
    productionRatePerLevel: 10,
    upgradeLimitLevel: 0,
    upgradeCosts: {
      food: { base: 100, multiplier: 1.5 },
      wood: { base: 50, multiplier: 1.5 },
    },
    operationalThreshold: 5,
  }

  describe('getUpgradeCost', () => {
    it('calculates cost at level 1', () => {
      const cost = getUpgradeCost(farmConfig, 1)
      expect(cost.food).toBe(150)
      expect(cost.wood).toBe(75)
    })

    it('calculates cost at level 5', () => {
      const cost = getUpgradeCost(farmConfig, 5)
      expect(cost.food).toBe(Math.floor(100 * 1.5 ** 5))
      expect(cost.wood).toBe(Math.floor(50 * 1.5 ** 5))
    })

    it('returns cost for level 0', () => {
      const cost = getUpgradeCost(farmConfig, 0)
      expect(cost.food).toBe(100)
      expect(cost.wood).toBe(50)
    })
  })

  describe('canAffordUpgrade', () => {
    it('returns true when enough resources', () => {
      expect(canAffordUpgrade({ food: 200, wood: 100, metal: 0 }, { food: 150, wood: 75 })).toBe(true)
    })

    it('returns false when insufficient resources', () => {
      expect(canAffordUpgrade({ food: 100, wood: 100, metal: 0 }, { food: 150, wood: 75 })).toBe(false)
    })

    it('returns false when missing a resource key', () => {
      expect(canAffordUpgrade({ food: 200 }, { food: 150, wood: 75 })).toBe(false)
    })
  })

  describe('deductCost', () => {
    it('subtracts cost from resources', () => {
      const remaining = deductCost({ food: 200, wood: 100, metal: 0 }, { food: 150, wood: 75 })
      expect(remaining.food).toBe(50)
      expect(remaining.wood).toBe(25)
    })

    it('does not mutate original resources object', () => {
      const resources = { food: 200, wood: 100, metal: 0 }
      const copy = { ...resources }
      deductCost(resources, { food: 150, wood: 75 })
      expect(resources).toEqual(copy)
    })
  })
})
