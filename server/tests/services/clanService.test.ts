import { describe, it, expect, vi, beforeEach } from 'vitest'

/* ── Hoisted helpers ── */
const baseClan = vi.hoisted(() => ({
  id: 1, name: 'TestClan', ownerId: 100, gameId: 1,
  clanAttackLevel: 1, clanDefenseLevel: 1,
  clanAttackProgress: 0, clanDefenseProgress: 0,
  lastAttackAt: null, lastDefendedAt: null,
  createdAt: '2024-01-01', updatedAt: '2024-01-01',
}))

const baseMember = vi.hoisted(() => ({
  id: 10, clanId: 1, playerGameId: 100, role: 'leader', contributedCivilians: 500,
  clanEnergy: 100, clanMaxEnergy: 100, clanLastEnergyAt: '2024-01-01',
  joinedAt: '2024-01-01',
}))

const baseMember2 = vi.hoisted(() => ({
  id: 11, clanId: 1, playerGameId: 101, role: 'member', contributedCivilians: 100,
  clanEnergy: 100, clanMaxEnergy: 100, clanLastEnergyAt: '2024-01-01',
  joinedAt: '2024-01-02',
}))

const baseMemberWithUsername = vi.hoisted(() => ({
  id: 10, clanId: 1, playerGameId: 100, username: 'LeaderUser',
  role: 'leader', contributedCivilians: 500, clanEnergy: 100, clanMaxEnergy: 100, clanLastEnergyAt: '2024-01-01',
  joinedAt: '2024-01-01',
}))

const baseMemberWithUsername2 = vi.hoisted(() => ({
  id: 11, clanId: 1, playerGameId: 101, username: 'MemberUser',
  role: 'member', contributedCivilians: 100, clanEnergy: 100, clanMaxEnergy: 100, clanLastEnergyAt: '2024-01-01',
  joinedAt: '2024-01-02',
}))

const baseClanRes = vi.hoisted(() => ({
  id: 20, clanId: 1, food: 1000, wood: 1000, metal: 1000,
  civilians: 5000, soldiers: 500,
  foodCapacity: 10000, woodCapacity: 10000, metalCapacity: 10000,
  lastProductionTickAt: null,
  createdAt: '2024-01-01', updatedAt: '2024-01-01',
}))

const baseBuilding = vi.hoisted(() => ({
  id: 30, clanId: 1, type: 'farm', level: 2,
  contributedFood: 0, contributedWood: 0, contributedMetal: 0,
  createdAt: '2024-01-01', updatedAt: '2024-01-01',
}))

const basePlayerGame = vi.hoisted(() => ({
  id: 100, playerId: 1, gameId: 1,
  lastTickAt: '2024-01-01',
  attackStat: 5, defenseStat: 5,
  createdAt: '2024-01-01',
}))

const clanConfig = vi.hoisted(() => ({
  activationCap: 10000,
  contributionRule: { requiredCivilians: 10, deadlineDays: 7 },
}))

const buildingsConfig = vi.hoisted(() => ({
  clan: {
    startingBuildings: { lumberjackHut: 1, farm: 1, mine: 1 },
    lumberjackHut: {
      upgradeCosts: { wood: { base: 100, multiplier: 1.5 } },
      productionRatePerLevel: 1,
      populationRequirement: { base: 10000, multiplier: 1.2 },
    },
    farm: {
      upgradeCosts: { food: { base: 100, multiplier: 1.5 } },
      productionRatePerLevel: 2,
      populationRequirement: { base: 10000, multiplier: 1.2 },
    },
    mine: {
      upgradeCosts: { metal: { base: 100, multiplier: 1.5 } },
      productionRatePerLevel: 1,
      populationRequirement: { base: 10000, multiplier: 1.2 },
    },
  },
}))

const battleConfig = vi.hoisted(() => ({
  activeStrategy: 'VAR',
  battleStrategy: {
    calculationType: {
      VAR: { cap: 1.0, baseChance: 0.2, varChance: 0.6, maxChance: 0.8, minChance: 0.2 },
      SAR: { victoryThreshold: 0 },
    },
    pvpPopulationBracket: {
      populationThreshold: 0.1,
      varChanceMultiplier: { smallCity: 0.4, mediumCity: 0.6, largeCity: 0.6 },
    },
  },
  clanPvp: {
    enslavementMin: 0.2,
    enslavementMax: 0.5,
    minimumPopulationProtection: 100,
    attackLimitPerDay: 1,
    defenseLimitPerDay: 1,
    pvpVisibilityThreshold: 1000,
  },
  clanPve: {
    monsterHpMultiplierPerMember: 100,
    lootMultiplier: 1,
    energyCostPerAction: 10,
  },
  playerPvp: {
    enslavementMin: 0.2,
    enslavementMax: 0.5,
    minimumPopulationProtection: 100,
    attackLimitPerDay: 1,
    defenseLimitPerDay: 1,
    pvpVisibilityThreshold: 1000,
  },
}))

const armouryConfig = vi.hoisted(() => ({
  player: {
    attack: { costs: { metal: { base: 50, multiplier: 1.5 } } },
    defense: { costs: { metal: { base: 50, multiplier: 1.5 } } },
  },
  clan: {
    attack: { costs: { metal: { base: 500, multiplier: 1.5 } } },
    defense: { costs: { metal: { base: 500, multiplier: 1.5 } } },
  },
}))

const monstersConfig = vi.hoisted(() => ({
  monsters: [
    { id: 'goblin', name: 'Goblin', loot: { food: { min: 5, max: 10 }, wood: { min: 2, max: 5 }, metal: { min: 1, max: 3 } } },
  ],
}))

/* ── Module-level mocks ── */
vi.mock('../../src/data/repositories/clanRepo', () => ({
  findClanById: vi.fn(),
  findClanByName: vi.fn(),
  findClanMembers: vi.fn(),
  findMemberByPlayerGameId: vi.fn(),
  createClan: vi.fn(),
  addClanMember: vi.fn(),
  removeClanMember: vi.fn(),
  updateMemberRole: vi.fn(),
  deleteClan: vi.fn(),
  transferOwnership: vi.fn(),
  findClanMembersWithUsernames: vi.fn(),
  getClanMemberCount: vi.fn(),
  searchClansByName: vi.fn(),
  addContributedCivilians: vi.fn(),
  updateClanStat: vi.fn(),
  updateLastAttackAt: vi.fn(),
  updateLastDefendedAt: vi.fn(),
  updateClanEnergy: vi.fn(),
}))

vi.mock('../../src/data/repositories/clanBuildingRepo', () => ({
  findClanBuildings: vi.fn(),
  findClanBuilding: vi.fn(),
  upsertClanBuilding: vi.fn(),
  addContribution: vi.fn(),
}))

vi.mock('../../src/data/repositories/clanResourceRepo', () => ({
  findByClanId: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  updateTickAt: vi.fn(),
}))

vi.mock('../../src/data/repositories/clanWarRepo', () => ({
  insertClanWar: vi.fn(),
  insertWarParticipants: vi.fn(),
  getWarParticipantsByClan: vi.fn(),
  getWarHistory: vi.fn(),
}))

vi.mock('../../src/data/repositories/clanPveBattleRepo', () => ({
  findActivePveBattle: vi.fn(),
  findDefeatedPveBattle: vi.fn(),
  insertPveBattle: vi.fn(),
  updatePveBattleHp: vi.fn(),
  insertPveContribution: vi.fn(),
  hasPlayerParticipated: vi.fn(),
  getParticipantCount: vi.fn(),
  getPveStatsByClan: vi.fn(),
  updateCollected: vi.fn(),
  findCompletedPveBattles: vi.fn(),
}))

vi.mock('../../src/data/repositories/playerResourceRepo', () => ({
  findByPlayerGameId: vi.fn(),
  update: vi.fn(),
}))

vi.mock('../../src/data/repositories/gamePlayerRepo', () => ({
  findById: vi.fn(),
}))

vi.mock('../../src/data/database', () => ({
  dbRun: vi.fn(),
}))

vi.mock('../../src/domain/clan/warfareResolver', () => ({
  resolveClanWar: vi.fn(() => ({
    roundsCommitted: 1,
    roundsWon: 1,
    roundsLost: 0,
    survivors: 0,
    loot: { food: 500, wood: 300, metal: 200 },
    armyLost: 10,
  })),
}))

vi.mock('../../src/config/configLoader', () => ({
  loadClanConfig: vi.fn(() => clanConfig),
  loadBattleConfig: vi.fn(() => battleConfig),
  loadMonstersConfig: vi.fn(() => monstersConfig),
  loadBuildingsConfig: vi.fn(() => buildingsConfig),
  loadArmouryConfig: vi.fn(() => armouryConfig),
}))

describe('clanService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  /* ── createClan ── */
  describe('createClan', () => {
    it('creates clan with resources and default buildings', async () => {
      const { createClan } = await import('../../src/services/clanService')
      const { findClanByName, createClan: createClanRepo } = await import('../../src/data/repositories/clanRepo')
      const { create: createRes } = await import('../../src/data/repositories/clanResourceRepo')
      const { upsertClanBuilding } = await import('../../src/data/repositories/clanBuildingRepo')

      vi.mocked(findClanByName).mockReturnValue(undefined)
      vi.mocked(createClanRepo).mockReturnValue(baseClan)

      const result = createClan('TestClan', 100)
      expect(result).toEqual({ clan: baseClan })
      expect(createRes).toHaveBeenCalledWith(1)
      expect(upsertClanBuilding).toHaveBeenCalledTimes(3)
      expect(upsertClanBuilding).toHaveBeenCalledWith(1, 'lumberjackHut', 1, 0, 0, 0)
      expect(upsertClanBuilding).toHaveBeenCalledWith(1, 'farm', 1, 0, 0, 0)
      expect(upsertClanBuilding).toHaveBeenCalledWith(1, 'mine', 1, 0, 0, 0)
    })

    it('returns error for duplicate name', async () => {
      const { createClan } = await import('../../src/services/clanService')
      const { findClanByName } = await import('../../src/data/repositories/clanRepo')

      vi.mocked(findClanByName).mockReturnValue(baseClan)

      const result = createClan('Existing', 100)
      expect(result).toEqual({ error: 'A clan with that name already exists' })
    })
  })

  /* ── getClan ── */
  describe('getClan', () => {
    it('enriches members with usernames, pve stats, war stats', async () => {
      const { getClan } = await import('../../src/services/clanService')
      const { findClanById, findClanMembersWithUsernames, findMemberByPlayerGameId } = await import('../../src/data/repositories/clanRepo')
      const { getPveStatsByClan } = await import('../../src/data/repositories/clanPveBattleRepo')
      const { getWarParticipantsByClan } = await import('../../src/data/repositories/clanWarRepo')
      const { findClanBuildings } = await import('../../src/data/repositories/clanBuildingRepo')

      vi.mocked(findClanById).mockReturnValue(baseClan)
      vi.mocked(findClanMembersWithUsernames).mockReturnValue([
        baseMemberWithUsername, baseMemberWithUsername2,
      ])
      vi.mocked(getPveStatsByClan).mockReturnValue([
        { playerGameId: 100, pveBattlesAttended: 3, pveDamageDealt: 500, pveSoldiersSpent: 50 },
      ])
      vi.mocked(getWarParticipantsByClan).mockReturnValue([
        { playerGameId: 100, warsParticipated: 2 },
      ])
      vi.mocked(findClanBuildings).mockReturnValue([
        { ...baseBuilding, type: 'farm' },
        { ...baseBuilding, type: 'lumberjackHut', id: 31 },
        { ...baseBuilding, type: 'mine', id: 32 },
      ])
      vi.mocked(findMemberByPlayerGameId).mockReturnValue(baseMember)

      const result = getClan(1, 100)
      expect(result).toBeDefined()
      expect(result!.members).toHaveLength(2)
      expect(result!.members[0].username).toBe('LeaderUser')
      expect(result!.members[0].pveBattlesAttended).toBe(3)
      expect(result!.members[0].pveDamageDealt).toBe(500)
      expect(result!.members[0].warsParticipated).toBe(2)
      expect(result!.members[1].pveBattlesAttended).toBe(0)
      expect(result!.members[1].warsParticipated).toBe(0)
      expect(result!.viewerRole).toBe('leader')
      expect(result!.buildings[0]).toHaveProperty('nextUpgradeCost')
    })

    it('returns undefined for non-existent clan', async () => {
      const { getClan } = await import('../../src/services/clanService')
      const { findClanById } = await import('../../src/data/repositories/clanRepo')
      vi.mocked(findClanById).mockReturnValue(undefined)
      expect(getClan(999)).toBeUndefined()
    })
  })

  /* ── joinClan ── */
  describe('joinClan', () => {
    it('adds member to clan', async () => {
      const { joinClan } = await import('../../src/services/clanService')
      const { findMemberByPlayerGameId, addClanMember } = await import('../../src/data/repositories/clanRepo')

      vi.mocked(findMemberByPlayerGameId).mockReturnValue(undefined)

      joinClan(1, 200)
      expect(addClanMember).toHaveBeenCalledWith(1, 200)
    })
  })

  /* ── contributeCivilian ── */
  describe('contributeCivilian', () => {
    it('deducts from player and adds to clan resources', async () => {
      const { contributeCivilian } = await import('../../src/services/clanService')
      const { findByPlayerGameId, update } = await import('../../src/data/repositories/playerResourceRepo')
      const { findMemberByPlayerGameId } = await import('../../src/data/repositories/clanRepo')
      const { findByClanId, update: updateClanRes } = await import('../../src/data/repositories/clanResourceRepo')

      vi.mocked(findByPlayerGameId).mockReturnValue({ id: 1, playerGameId: 100, civilians: 100, food: 100, wood: 100, metal: 100, soldiers: 100 })
      vi.mocked(findMemberByPlayerGameId).mockReturnValue(baseMember)
      vi.mocked(findByClanId).mockReturnValue(baseClanRes)

      const result = contributeCivilian(1, 100, 30)
      expect(result).toEqual({ success: true })
      expect(update).toHaveBeenCalledWith(1, { civilians: 70 })
      expect(updateClanRes).toHaveBeenCalledWith(20, { civilians: 5030 })
    })

    it('returns error if player lacks civilians', async () => {
      const { contributeCivilian } = await import('../../src/services/clanService')
      const { findByPlayerGameId } = await import('../../src/data/repositories/playerResourceRepo')

      vi.mocked(findByPlayerGameId).mockReturnValue({ id: 1, playerGameId: 100, civilians: 5, food: 100, wood: 100, metal: 100, soldiers: 100 })

      const result = contributeCivilian(1, 100, 30)
      expect(result).toEqual({ success: false, error: 'Not enough civilians' })
    })

    it('returns error if not a clan member', async () => {
      const { contributeCivilian } = await import('../../src/services/clanService')
      const { findByPlayerGameId } = await import('../../src/data/repositories/playerResourceRepo')
      const { findMemberByPlayerGameId } = await import('../../src/data/repositories/clanRepo')

      vi.mocked(findByPlayerGameId).mockReturnValue({ id: 1, playerGameId: 100, civilians: 100, food: 100, wood: 100, metal: 100, soldiers: 100 })
      vi.mocked(findMemberByPlayerGameId).mockReturnValue(undefined)

      const result = contributeCivilian(1, 100, 30)
      expect(result).toEqual({ success: false, error: 'Not a clan member' })
    })
  })

  /* ── leaveClan ── */
  describe('leaveClan', () => {
    it('allows member to leave', async () => {
      const { leaveClan } = await import('../../src/services/clanService')
      const { findMemberByPlayerGameId, removeClanMember } = await import('../../src/data/repositories/clanRepo')

      vi.mocked(findMemberByPlayerGameId).mockReturnValue({ ...baseMember, role: 'member' })

      const result = leaveClan(101)
      expect(result).toEqual({ success: true })
      expect(removeClanMember).toHaveBeenCalledWith(101)
    })

    it('rejects non-member', async () => {
      const { leaveClan } = await import('../../src/services/clanService')
      const { findMemberByPlayerGameId } = await import('../../src/data/repositories/clanRepo')

      vi.mocked(findMemberByPlayerGameId).mockReturnValue(undefined)

      const result = leaveClan(999)
      expect(result).toEqual({ success: false, error: 'Not in a clan' })
    })

    it('rejects leader', async () => {
      const { leaveClan } = await import('../../src/services/clanService')
      const { findMemberByPlayerGameId } = await import('../../src/data/repositories/clanRepo')

      vi.mocked(findMemberByPlayerGameId).mockReturnValue(baseMember)

      const result = leaveClan(100)
      expect(result).toEqual({ success: false, error: 'Transfer ownership before leaving' })
    })
  })

  /* ── kickMember ── */
  describe('kickMember', () => {
    it('allows leader to kick member', async () => {
      const { kickMember } = await import('../../src/services/clanService')
      const { findMemberByPlayerGameId, findClanMembers, removeClanMember } = await import('../../src/data/repositories/clanRepo')

      vi.mocked(findMemberByPlayerGameId).mockReturnValue(baseMember)
      vi.mocked(findClanMembers).mockReturnValue([baseMember, baseMember2])

      const result = kickMember(1, 100, 101)
      expect(result).toEqual({ success: true })
      expect(removeClanMember).toHaveBeenCalledWith(101)
    })

    it('rejects non-member caller', async () => {
      const { kickMember } = await import('../../src/services/clanService')
      const { findMemberByPlayerGameId } = await import('../../src/data/repositories/clanRepo')

      vi.mocked(findMemberByPlayerGameId).mockReturnValue(undefined)

      const result = kickMember(1, 999, 101)
      expect(result).toEqual({ success: false, error: 'Not a clan member' })
    })

    it('rejects non-leader/officer caller', async () => {
      const { kickMember } = await import('../../src/services/clanService')
      const { findMemberByPlayerGameId } = await import('../../src/data/repositories/clanRepo')

      vi.mocked(findMemberByPlayerGameId).mockReturnValue({ ...baseMember, role: 'member' })

      const result = kickMember(1, 100, 101)
      expect(result).toEqual({ success: false, error: 'Only leaders and officers can kick members' })
    })

    it('rejects kicking the leader', async () => {
      const { kickMember } = await import('../../src/services/clanService')
      const { findMemberByPlayerGameId, findClanMembers } = await import('../../src/data/repositories/clanRepo')

      vi.mocked(findMemberByPlayerGameId).mockReturnValue(baseMember)
      vi.mocked(findClanMembers).mockReturnValue([baseMember, baseMember2])

      const result = kickMember(1, 100, 100)
      expect(result).toEqual({ success: false, error: 'Cannot kick the leader' })
    })

    it('prevents officer from kicking another officer', async () => {
      const { kickMember } = await import('../../src/services/clanService')
      const { findMemberByPlayerGameId, findClanMembers } = await import('../../src/data/repositories/clanRepo')

      vi.mocked(findMemberByPlayerGameId).mockReturnValue({ ...baseMember, role: 'officer', playerGameId: 100 })
      vi.mocked(findClanMembers).mockReturnValue([
        { ...baseMember, role: 'leader', playerGameId: 99 },
        { ...baseMember2, role: 'officer', playerGameId: 101 },
      ])

      const result = kickMember(1, 100, 101)
      expect(result).toEqual({ success: false, error: 'Officers cannot kick other officers' })
    })
  })

  /* ── disbandClan ── */
  describe('disbandClan', () => {
    it('allows leader to disband', async () => {
      const { disbandClan } = await import('../../src/services/clanService')
      const { findMemberByPlayerGameId, findClanMembers, removeClanMember, deleteClan } = await import('../../src/data/repositories/clanRepo')

      vi.mocked(findMemberByPlayerGameId).mockReturnValue(baseMember)
      vi.mocked(findClanMembers).mockReturnValue([baseMember, baseMember2])

      const result = disbandClan(1, 100)
      expect(result).toEqual({ success: true })
      expect(removeClanMember).toHaveBeenCalledTimes(2)
      expect(deleteClan).toHaveBeenCalledWith(1)
    })

    it('rejects non-leader', async () => {
      const { disbandClan } = await import('../../src/services/clanService')
      const { findMemberByPlayerGameId } = await import('../../src/data/repositories/clanRepo')

      vi.mocked(findMemberByPlayerGameId).mockReturnValue({ ...baseMember, role: 'member' })

      const result = disbandClan(1, 100)
      expect(result).toEqual({ success: false, error: 'Only the leader can disband the clan' })
    })

    it('rejects non-member', async () => {
      const { disbandClan } = await import('../../src/services/clanService')
      const { findMemberByPlayerGameId } = await import('../../src/data/repositories/clanRepo')

      vi.mocked(findMemberByPlayerGameId).mockReturnValue(undefined)

      const result = disbandClan(1, 999)
      expect(result).toEqual({ success: false, error: 'Not a clan member' })
    })
  })

  /* ── promoteMember ── */
  describe('promoteMember', () => {
    it('promotes member to officer', async () => {
      const { promoteMember } = await import('../../src/services/clanService')
      const { findMemberByPlayerGameId, findClanMembers, updateMemberRole } = await import('../../src/data/repositories/clanRepo')

      vi.mocked(findMemberByPlayerGameId).mockReturnValue(baseMember)
      vi.mocked(findClanMembers).mockReturnValue([baseMember, baseMember2])

      const result = promoteMember(1, 100, 101)
      expect(result).toEqual({ success: true })
      expect(updateMemberRole).toHaveBeenCalledWith(1, 101, 'officer')
    })

    it('rejects non-leader', async () => {
      const { promoteMember } = await import('../../src/services/clanService')
      const { findMemberByPlayerGameId } = await import('../../src/data/repositories/clanRepo')

      vi.mocked(findMemberByPlayerGameId).mockReturnValue({ ...baseMember, role: 'member' })

      const result = promoteMember(1, 100, 101)
      expect(result).toEqual({ success: false, error: 'Only the leader can promote members' })
    })

    it('rejects promoting already-officer', async () => {
      const { promoteMember } = await import('../../src/services/clanService')
      const { findMemberByPlayerGameId, findClanMembers } = await import('../../src/data/repositories/clanRepo')

      vi.mocked(findMemberByPlayerGameId).mockReturnValue(baseMember)
      vi.mocked(findClanMembers).mockReturnValue([
        baseMember,
        { ...baseMember2, role: 'officer' },
      ])

      const result = promoteMember(1, 100, 101)
      expect(result).toEqual({ success: false, error: 'Only members can be promoted to officer' })
    })
  })

  /* ── demoteMember ── */
  describe('demoteMember', () => {
    it('demotes officer to member', async () => {
      const { demoteMember } = await import('../../src/services/clanService')
      const { findMemberByPlayerGameId, findClanMembers, updateMemberRole } = await import('../../src/data/repositories/clanRepo')

      vi.mocked(findMemberByPlayerGameId).mockReturnValue(baseMember)
      vi.mocked(findClanMembers).mockReturnValue([
        baseMember,
        { ...baseMember2, role: 'officer' },
      ])

      const result = demoteMember(1, 100, 101)
      expect(result).toEqual({ success: true })
      expect(updateMemberRole).toHaveBeenCalledWith(1, 101, 'member')
    })

    it('rejects non-leader', async () => {
      const { demoteMember } = await import('../../src/services/clanService')
      const { findMemberByPlayerGameId } = await import('../../src/data/repositories/clanRepo')

      vi.mocked(findMemberByPlayerGameId).mockReturnValue({ ...baseMember, role: 'member' })

      const result = demoteMember(1, 100, 101)
      expect(result).toEqual({ success: false, error: 'Only the leader can demote officers' })
    })

    it('rejects demoting member (only officers)', async () => {
      const { demoteMember } = await import('../../src/services/clanService')
      const { findMemberByPlayerGameId, findClanMembers } = await import('../../src/data/repositories/clanRepo')

      vi.mocked(findMemberByPlayerGameId).mockReturnValue(baseMember)
      vi.mocked(findClanMembers).mockReturnValue([baseMember, baseMember2])

      const result = demoteMember(1, 100, 101)
      expect(result).toEqual({ success: false, error: 'Only officers can be demoted to member' })
    })
  })

  /* ── transferOwnership ── */
  describe('transferOwnership', () => {
    it('swaps roles between old leader and target', async () => {
      const { transferOwnership } = await import('../../src/services/clanService')
      const { findMemberByPlayerGameId, findClanMembers, transferOwnership: transfer, updateMemberRole } = await import('../../src/data/repositories/clanRepo')

      vi.mocked(findMemberByPlayerGameId).mockReturnValue(baseMember)
      vi.mocked(findClanMembers).mockReturnValue([baseMember, baseMember2])

      const result = transferOwnership(1, 100, 101)
      expect(result).toEqual({ success: true })
      expect(transfer).toHaveBeenCalledWith(1, 101)
      expect(updateMemberRole).toHaveBeenCalledWith(1, 100, 'member')
      expect(updateMemberRole).toHaveBeenCalledWith(1, 101, 'leader')
    })

    it('rejects non-leader', async () => {
      const { transferOwnership } = await import('../../src/services/clanService')
      const { findMemberByPlayerGameId } = await import('../../src/data/repositories/clanRepo')

      vi.mocked(findMemberByPlayerGameId).mockReturnValue({ ...baseMember, role: 'member' })

      const result = transferOwnership(1, 100, 101)
      expect(result).toEqual({ success: false, error: 'Only the leader can transfer ownership' })
    })

    it('rejects self-transfer', async () => {
      const { transferOwnership } = await import('../../src/services/clanService')
      const { findMemberByPlayerGameId, findClanMembers } = await import('../../src/data/repositories/clanRepo')

      vi.mocked(findMemberByPlayerGameId).mockReturnValue(baseMember)
      vi.mocked(findClanMembers).mockReturnValue([baseMember, baseMember2])

      const result = transferOwnership(1, 100, 100)
      expect(result).toEqual({ success: false, error: 'Cannot transfer ownership to yourself' })
    })
  })

  /* ── attackClanPveBattle (energy check) ── */
  describe('attackClanPveBattle', () => {
    it('deducts energy before attack', async () => {
      const { attackClanPveBattle } = await import('../../src/services/clanService')
      const { findClanById, findMemberByPlayerGameId, updateClanEnergy } = await import('../../src/data/repositories/clanRepo')
      const { findActivePveBattle, updatePveBattleHp, insertPveContribution } = await import('../../src/data/repositories/clanPveBattleRepo')
      const { findByPlayerGameId, update } = await import('../../src/data/repositories/playerResourceRepo')

      vi.mocked(findClanById).mockReturnValue(baseClan)
      vi.mocked(findMemberByPlayerGameId).mockReturnValue(baseMember)
      vi.mocked(findActivePveBattle).mockReturnValue({
        id: 50, clanId: 1, monsterId: 'goblin', totalHp: 500, currentHp: 500,
        state: 'active', leaderId: 100, lootPerMember: '{}', collected: '[]',
        createdAt: '2024-01-01', updatedAt: '2024-01-01',
      })
      vi.mocked(findByPlayerGameId).mockReturnValue({ id: 1, playerGameId: 100, civilians: 100, food: 100, wood: 100, metal: 100, soldiers: 100 })

      const result = attackClanPveBattle(1, 100, 10) as any
      expect(result.error).toBeUndefined()
      expect(updateClanEnergy).toHaveBeenCalledWith(10, 90, expect.any(String))
      expect(update).toHaveBeenCalledWith(1, { soldiers: 90 })
      expect(updatePveBattleHp).toHaveBeenCalled()
      expect(insertPveContribution).toHaveBeenCalledWith(50, 100, 10, expect.any(Number))
    })

    it('rejects when energy insufficient', async () => {
      const { attackClanPveBattle } = await import('../../src/services/clanService')
      const { findClanById, findMemberByPlayerGameId } = await import('../../src/data/repositories/clanRepo')
      const { findActivePveBattle } = await import('../../src/data/repositories/clanPveBattleRepo')

      vi.mocked(findClanById).mockReturnValue(baseClan)
      vi.mocked(findMemberByPlayerGameId).mockReturnValue({ ...baseMember, clanEnergy: 5 })
      vi.mocked(findActivePveBattle).mockReturnValue({
        id: 50, clanId: 1, monsterId: 'goblin', totalHp: 500, currentHp: 500,
        state: 'active', leaderId: 100, lootPerMember: '{}', collected: '[]',
        createdAt: '2024-01-01', updatedAt: '2024-01-01',
      })

      const result = attackClanPveBattle(1, 100, 10) as any
      expect(result.error).toContain('Not enough energy')
    })
  })

  /* ── startClanWar (war participants) ── */
  describe('startClanWar', () => {
    it('records all members as war participants', async () => {
      const { startClanWar } = await import('../../src/services/clanService')
      const { findClanById, findMemberByPlayerGameId, findClanMembers } = await import('../../src/data/repositories/clanRepo')
      const { findByClanId, update } = await import('../../src/data/repositories/clanResourceRepo')
      const { insertClanWar, insertWarParticipants } = await import('../../src/data/repositories/clanWarRepo')
      const { findClanBuildings } = await import('../../src/data/repositories/clanBuildingRepo')

      const defClanRes = { ...baseClanRes, id: 21, clanId: 2, civilians: 10000, soldiers: 200 }

      vi.mocked(findClanById).mockImplementation((id: number) =>
        id === 1 ? { ...baseClan, lastAttackAt: null } : { ...baseClan, id: 2 }
      )
      vi.mocked(findByClanId).mockImplementation((id: number) =>
        id === 1 ? { ...baseClanRes, civilians: 15000, soldiers: 500 } : defClanRes
      )
      vi.mocked(findMemberByPlayerGameId).mockReturnValue({ ...baseMember, role: 'leader' })
      vi.mocked(findClanMembers).mockImplementation((id: number) =>
        id === 1
          ? [baseMember, baseMember2]
          : [{ ...baseMember2, id: 12, clanId: 2, playerGameId: 200 }]
      )
      vi.mocked(insertClanWar).mockReturnValue(99)
      vi.mocked(findClanBuildings).mockReturnValue([])

      const result = startClanWar(1, 2, 100, 50) as any
      expect(result.error).toBeUndefined()
      expect(insertClanWar).toHaveBeenCalled()
      expect(insertWarParticipants).toHaveBeenCalledWith(99, [100, 101])
    })
  })

  /* ── isClanActivated ── */
  describe('isClanActivated', () => {
    it('returns true when civilians >= activation cap', async () => {
      const { isClanActivated } = await import('../../src/services/clanService')
      const { findByClanId } = await import('../../src/data/repositories/clanResourceRepo')

      vi.mocked(findByClanId).mockReturnValue({ ...baseClanRes, civilians: 15000 })

      expect(isClanActivated(1)).toEqual({ activated: true })
    })

    it('returns false when civilians < activation cap', async () => {
      const { isClanActivated } = await import('../../src/services/clanService')
      const { findByClanId } = await import('../../src/data/repositories/clanResourceRepo')

      vi.mocked(findByClanId).mockReturnValue({ ...baseClanRes, civilians: 5000 })

      expect(isClanActivated(1)).toEqual({ activated: false })
    })

    it('returns false for non-existent clan', async () => {
      const { isClanActivated } = await import('../../src/services/clanService')
      const { findByClanId } = await import('../../src/data/repositories/clanResourceRepo')

      vi.mocked(findByClanId).mockReturnValue(undefined)

      expect(isClanActivated(999)).toEqual({ activated: false })
    })
  })

  /* ── searchClans ── */
  describe('searchClans', () => {
    it('returns search results with member count and activation status', async () => {
      const { searchClans } = await import('../../src/services/clanService')
      const { findById } = await import('../../src/data/repositories/gamePlayerRepo')
      const { searchClansByName, getClanMemberCount } = await import('../../src/data/repositories/clanRepo')
      const { findByClanId } = await import('../../src/data/repositories/clanResourceRepo')

      vi.mocked(findById).mockReturnValue(basePlayerGame)
      vi.mocked(searchClansByName).mockReturnValue([baseClan, { ...baseClan, id: 2, name: 'OtherClan' }])
      vi.mocked(getClanMemberCount).mockReturnValue(5)
      vi.mocked(findByClanId).mockImplementation((id: number) =>
        id === 1 ? { ...baseClanRes, civilians: 15000 } : { ...baseClanRes, civilians: 5000 }
      )

      const results = searchClans('Test', 100)
      expect(results).toHaveLength(2)
      expect(results[0].activated).toBe(true)
      expect(results[1].activated).toBe(false)
      expect(results[0].memberCount).toBe(5)
    })
  })

  /* ── startClanPveBattle ── */
  describe('startClanPveBattle', () => {
    it('starts PvE fight if leader and no active fight', async () => {
      const { startClanPveBattle } = await import('../../src/services/clanService')
      const { findClanById, findMemberByPlayerGameId, findClanMembers } = await import('../../src/data/repositories/clanRepo')
      const { findActivePveBattle, insertPveBattle } = await import('../../src/data/repositories/clanPveBattleRepo')

      vi.mocked(findClanById).mockReturnValue(baseClan)
      vi.mocked(findMemberByPlayerGameId).mockReturnValue(baseMember)
      vi.mocked(findClanMembers).mockReturnValue([baseMember])
      vi.mocked(findActivePveBattle).mockReturnValue(undefined)
      vi.mocked(insertPveBattle).mockReturnValue(50)

      const result = startClanPveBattle(1, 100, 'goblin')
      expect(result.success).toBe(true)
      expect(result.monster).toBeDefined()
      expect(result.monster!.totalHp).toBe(100)
      expect(insertPveBattle).toHaveBeenCalled()
    })

    it('rejects non-leader', async () => {
      const { startClanPveBattle } = await import('../../src/services/clanService')
      const { findClanById, findMemberByPlayerGameId } = await import('../../src/data/repositories/clanRepo')

      vi.mocked(findClanById).mockReturnValue(baseClan)
      vi.mocked(findMemberByPlayerGameId).mockReturnValue({ ...baseMember, role: 'member' })

      const result = startClanPveBattle(1, 100, 'goblin')
      expect(result).toEqual({ success: false, error: 'Only the clan leader can start a PvE fight' })
    })

    it('rejects if PvE fight already active', async () => {
      const { startClanPveBattle } = await import('../../src/services/clanService')
      const { findClanById, findMemberByPlayerGameId } = await import('../../src/data/repositories/clanRepo')
      const { findActivePveBattle } = await import('../../src/data/repositories/clanPveBattleRepo')

      vi.mocked(findClanById).mockReturnValue(baseClan)
      vi.mocked(findMemberByPlayerGameId).mockReturnValue(baseMember)
      vi.mocked(findActivePveBattle).mockReturnValue({ id: 50 } as any)

      const result = startClanPveBattle(1, 100, 'goblin')
      expect(result).toEqual({ success: false, error: 'A PvE fight is already active' })
    })
  })

  /* ── collectPveLoot ── */
  describe('collectPveLoot', () => {
    it('collects loot and marks as collected', async () => {
      const { collectPveLoot } = await import('../../src/services/clanService')
      const { findMemberByPlayerGameId } = await import('../../src/data/repositories/clanRepo')
      const { findDefeatedPveBattle, hasPlayerParticipated, updateCollected } = await import('../../src/data/repositories/clanPveBattleRepo')
      const { findByPlayerGameId, update } = await import('../../src/data/repositories/playerResourceRepo')

      vi.mocked(findMemberByPlayerGameId).mockReturnValue(baseMember)
      vi.mocked(findDefeatedPveBattle).mockReturnValue({
        id: 50, clanId: 1, monsterId: 'goblin', totalHp: 100, currentHp: 0,
        state: 'defeated', leaderId: 100, lootPerMember: '{"food":10,"wood":5}',
        collected: '[]', createdAt: '2024-01-01', updatedAt: '2024-01-01',
      })
      vi.mocked(hasPlayerParticipated).mockReturnValue(true)
      vi.mocked(findByPlayerGameId).mockReturnValue({ id: 1, playerGameId: 100, civilians: 100, food: 100, wood: 100, metal: 100, soldiers: 100 })

      const result = collectPveLoot(1, 100)
      expect(result).toEqual({ success: true, loot: { food: 10, wood: 5 } })
      expect(update).toHaveBeenCalledWith(1, { food: 110, wood: 105, metal: 100 })
      expect(updateCollected).toHaveBeenCalledWith(50, '[100]')
    })

    it('rejects if not participated', async () => {
      const { collectPveLoot } = await import('../../src/services/clanService')
      const { findMemberByPlayerGameId } = await import('../../src/data/repositories/clanRepo')
      const { findDefeatedPveBattle, hasPlayerParticipated } = await import('../../src/data/repositories/clanPveBattleRepo')

      vi.mocked(findMemberByPlayerGameId).mockReturnValue(baseMember)
      vi.mocked(findDefeatedPveBattle).mockReturnValue({
        id: 50, clanId: 1, monsterId: 'goblin', totalHp: 100, currentHp: 0,
        state: 'defeated', leaderId: 100, lootPerMember: '{}', collected: '[]',
        createdAt: '2024-01-01', updatedAt: '2024-01-01',
      })
      vi.mocked(hasPlayerParticipated).mockReturnValue(false)

      const result = collectPveLoot(1, 100)
      expect(result).toEqual({ error: 'You did not participate in this PvE fight' })
    })
  })
})
