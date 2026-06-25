import { describe, it, expect, vi, beforeEach } from 'vitest'

/* ── Hoisted helpers ── */
const basePg = vi.hoisted(() => ({
  id: 100, playerId: 1, gameId: 1,
  lastTickAt: '2024-06-01T00:00:00.000Z',
  attackStat: 5, defenseStat: 5,
  createdAt: '2024-06-01',
}))

const baseMember = vi.hoisted(() => ({
  id: 10, clanId: 1, playerGameId: 100, role: 'member', contributedCivilians: 500,
  clanEnergy: 50, clanMaxEnergy: 100, clanLastEnergyAt: '2024-06-01T00:00:00.000Z',
  joinedAt: '2024-06-01',
}))

const baseClanRes = vi.hoisted(() => ({
  id: 20, clanId: 1, food: 5000, wood: 5000, metal: 5000,
  civilians: 10000, soldiers: 500,
  foodCapacity: 10000, woodCapacity: 10000, metalCapacity: 10000,
  lastProductionTickAt: '2024-06-01T00:00:00.000Z',
  createdAt: '2024-06-01', updatedAt: '2024-06-01',
}))

const baseBuilding = vi.hoisted(() => ({
  id: 30, clanId: 1, type: 'farm', level: 2,
  contributedFood: 0, contributedWood: 0, contributedMetal: 0,
  createdAt: '2024-06-01', updatedAt: '2024-06-01',
}))

const basePlayerResource = vi.hoisted(() => ({
  id: 1, playerGameId: 100, civilians: 100, food: 200, wood: 200, metal: 200, soldiers: 100,
}))

/* ── Mocks ── */
vi.mock('../../src/data/repositories/gamePlayerRepo', () => ({
  findById: vi.fn(),
  updateLastTickAt: vi.fn(),
}))

vi.mock('../../src/data/repositories/playerResourceRepo', () => ({
  findByPlayerGameId: vi.fn(),
  update: vi.fn(),
}))

vi.mock('../../src/data/repositories/buildingRepo', () => ({
  findBuildingsByPlayerGameId: vi.fn(),
}))

vi.mock('../../src/data/repositories/clanRepo', () => ({
  findMemberByPlayerGameId: vi.fn(),
  updateClanEnergy: vi.fn(),
}))

vi.mock('../../src/data/repositories/clanResourceRepo', () => ({
  findByClanId: vi.fn(),
  update: vi.fn(),
  updateTickAt: vi.fn(),
}))

vi.mock('../../src/data/repositories/clanBuildingRepo', () => ({
  findClanBuildings: vi.fn(),
}))

vi.mock('../../src/config/configLoader', () => ({
  loadBuildingsConfig: vi.fn(() => ({
    clan: {
      startingBuildings: { lumberjackHut: 1, farm: 1, mine: 1 },
      lumberjackHut: { upgradeCosts: { wood: { base: 500, multiplier: 1.5 } }, productionRatePerLevel: 1, populationRequirement: { base: 10000, multiplier: 1.2 }, baseCapacity: 3000, capacityUpgradePerLevel: 500 },
      farm: { upgradeCosts: { food: { base: 500, multiplier: 1.5 } }, productionRatePerLevel: 2, populationRequirement: { base: 10000, multiplier: 1.2 }, baseCapacity: 3000, capacityUpgradePerLevel: 500 },
      mine: { upgradeCosts: { metal: { base: 500, multiplier: 1.5 } }, productionRatePerLevel: 1, populationRequirement: { base: 10000, multiplier: 1.2 }, baseCapacity: 3000, capacityUpgradePerLevel: 500 },
    },
  })),
  loadGameConfig: vi.fn(() => ({ resourceTickIntervalMs: 60000 })),
  loadClanConfig: vi.fn(() => ({
    activationCap: 10000,
    contributionRule: { requiredCivilians: 200, deadlineDays: 3 },
  })),
}))

vi.mock('../../src/domain/economy/resourceTick', () => ({
  computeTickProgress: vi.fn(),
  calculateProduction: vi.fn(),
}))

vi.mock('../../src/domain/clan/clanProduction', () => ({
  calculateClanProduction: vi.fn(),
}))

describe('resourceService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('applyClanEnergyRegen (via applyTick)', () => {
    it('skips regen when no elapsed time', async () => {
      const pgRepo = await import('../../src/data/repositories/gamePlayerRepo')
      const clanRepo = await import('../../src/data/repositories/clanRepo')
      const resRepo = await import('../../src/data/repositories/playerResourceRepo')
      const { computeTickProgress, calculateProduction } = await import('../../src/domain/economy/resourceTick')
      const bldRepo = await import('../../src/data/repositories/buildingRepo')

      vi.mocked(pgRepo.findById).mockReturnValue(basePg)
      vi.mocked(clanRepo.findMemberByPlayerGameId).mockReturnValue(baseMember)
      vi.mocked(resRepo.findByPlayerGameId).mockReturnValue(basePlayerResource)
      vi.mocked(bldRepo.findBuildingsByPlayerGameId).mockReturnValue([])
      vi.mocked(computeTickProgress).mockReturnValue({ fullIntervals: 0, elapsedBeforePartial: 0, partialProgressRatio: 0 })
      vi.mocked(calculateProduction).mockReturnValue({ food: 0, wood: 0, metal: 0, civilians: 0, soldiers: 0 })

      const { applyTick } = await import('../../src/services/resourceService')
      applyTick(100)

      expect(clanRepo.updateClanEnergy).not.toHaveBeenCalled()
    })
  })

  describe('applyClanProductionTick (via applyTick)', () => {
    async function setupBaseMocks() {
      const pgRepo = await import('../../src/data/repositories/gamePlayerRepo')
      const resRepo = await import('../../src/data/repositories/playerResourceRepo')
      const bldRepo = await import('../../src/data/repositories/buildingRepo')
      const { computeTickProgress, calculateProduction } = await import('../../src/domain/economy/resourceTick')

      vi.mocked(pgRepo.findById).mockReturnValue(basePg)
      vi.mocked(resRepo.findByPlayerGameId).mockReturnValue(basePlayerResource)
      vi.mocked(bldRepo.findBuildingsByPlayerGameId).mockReturnValue([])
      vi.mocked(computeTickProgress).mockReturnValue({ fullIntervals: 2, elapsedBeforePartial: 0, partialProgressRatio: 0 })
      vi.mocked(calculateProduction).mockReturnValue({ food: 10, wood: 5, metal: 3, civilians: 0, soldiers: 0 })
    }

    it('skips production for non-member', async () => {
      const clanRepo = await import('../../src/data/repositories/clanRepo')
      const clanResRepo = await import('../../src/data/repositories/clanResourceRepo')
      await setupBaseMocks()

      vi.mocked(clanRepo.findMemberByPlayerGameId).mockReturnValue(undefined)

      const { applyTick } = await import('../../src/services/resourceService')
      applyTick(100)

      expect(clanResRepo.update).not.toHaveBeenCalled()
    })

    it('distributes production to player and clan resources', async () => {
      const clanRepo = await import('../../src/data/repositories/clanRepo')
      const clanResRepo = await import('../../src/data/repositories/clanResourceRepo')
      const clanBldRepo = await import('../../src/data/repositories/clanBuildingRepo')
      const resRepo = await import('../../src/data/repositories/playerResourceRepo')
      const { calculateClanProduction } = await import('../../src/domain/clan/clanProduction')

      await setupBaseMocks()

      vi.mocked(clanRepo.findMemberByPlayerGameId).mockReturnValue(baseMember)
      vi.mocked(clanResRepo.findByClanId).mockReturnValue(baseClanRes)
      vi.mocked(clanBldRepo.findClanBuildings).mockReturnValue([
        { ...baseBuilding, type: 'farm', level: 2 },
        { ...baseBuilding, type: 'lumberjackHut', id: 31, level: 3 },
        { ...baseBuilding, type: 'mine', id: 32, level: 1 },
      ])
      vi.mocked(calculateClanProduction).mockReturnValue({ food: 4, wood: 3, metal: 1 })

      const { applyTick } = await import('../../src/services/resourceService')
      applyTick(100)

      // Player tick: calculateProduction returns { food:10, wood:5, metal:3, civilians:0 }
      expect(resRepo.update).toHaveBeenNthCalledWith(1, 1, {
        food: 210, wood: 205, metal: 203, civilians: 100,
      })
      // Clan production tick adds to player: foodProd = 4*2 = 8
      expect(resRepo.update).toHaveBeenNthCalledWith(2, 1, {
        food: 208, wood: 206, metal: 202,
      })
      // Clan gets the clan production scaled by intervals (4*2=8)
      // cap = base(3000) + perLevel(500)*level
      // farm=level2 → food cap=4000, lumberjack=level3 → wood cap=4500, mine=level1 → metal cap=3500
      expect(clanResRepo.update).toHaveBeenCalledWith(20, {
        food: Math.min(4000, 5000 + 8),
        wood: Math.min(4500, 5000 + 6),
        metal: Math.min(3500, 5000 + 2),
      })
    })

    it('caps clan resources at capacity', async () => {
      const clanRepo = await import('../../src/data/repositories/clanRepo')
      const clanResRepo = await import('../../src/data/repositories/clanResourceRepo')
      const clanBldRepo = await import('../../src/data/repositories/clanBuildingRepo')
      const { calculateClanProduction } = await import('../../src/domain/clan/clanProduction')

      await setupBaseMocks()

      vi.mocked(clanRepo.findMemberByPlayerGameId).mockReturnValue(baseMember)
      // Clan resource almost at capacity: food=11900, capacity=12000
      vi.mocked(clanResRepo.findByClanId).mockReturnValue({ ...baseClanRes, food: 11900, wood: 11900, metal: 11900 })
      vi.mocked(clanBldRepo.findClanBuildings).mockReturnValue([
        { ...baseBuilding, type: 'farm', level: 1 },
        { ...baseBuilding, type: 'lumberjackHut', id: 31, level: 1 },
        { ...baseBuilding, type: 'mine', id: 32, level: 1 },
      ])
      vi.mocked(calculateClanProduction).mockReturnValue({ food: 2, wood: 1, metal: 1 })

      const { applyTick } = await import('../../src/services/resourceService')
      applyTick(100)

      // cap = 3000 + 500*1 = 3500 per resource
      // clan res was 11900, +2*2ints = 11904, but cap is 3500 → Math.min(3500, 11904) = 3500
      expect(clanResRepo.update).toHaveBeenCalledWith(20, {
        food: 3500,
        wood: 3500,
        metal: 3500,
      })
    })

    it('skips when no elapsed intervals', async () => {
      const clanRepo = await import('../../src/data/repositories/clanRepo')
      const clanResRepo = await import('../../src/data/repositories/clanResourceRepo')
      const { computeTickProgress, calculateProduction } = await import('../../src/domain/economy/resourceTick')

      await setupBaseMocks()

      vi.mocked(clanRepo.findMemberByPlayerGameId).mockReturnValue(baseMember)
      vi.mocked(clanResRepo.findByClanId).mockReturnValue(baseClanRes)
      vi.mocked(computeTickProgress).mockReturnValue({ fullIntervals: 0, elapsedBeforePartial: 0, partialProgressRatio: 0 })
      vi.mocked(calculateProduction).mockReturnValue({ food: 0, wood: 0, metal: 0, civilians: 0, soldiers: 0 })

      const { applyTick } = await import('../../src/services/resourceService')
      applyTick(100)

      expect(clanResRepo.update).not.toHaveBeenCalled()
    })
  })
})
