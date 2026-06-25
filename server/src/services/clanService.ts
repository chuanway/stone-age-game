import { Clan, ClanMember, ClanMemberDetail, ClanPveMonster, BattleTotalResult, BattleUnit, ClanResponse, ClanWarResponse, ClanCivilianUpkeepResponse, ClanWarActivationResponse, ClanContributeCivilianResponse, ClanBuildingUpgradeResponse, ClanStatUpgradeResponse, ClanPveStatusResponse, ClanPveAttackResponse, ClanPveCollectLootResponse, ErrorResponse, ResourceType, BuildingType, StatType, ClanBuildingConfig, ClanBuilding } from 'shared'
import * as clanRepo from '../data/repositories/clanRepo'
import * as clanBuildingRepo from '../data/repositories/clanBuildingRepo'
import * as clanPveBattleRepo from '../data/repositories/clanPveBattleRepo'
import * as clanResourceRepo from '../data/repositories/clanResourceRepo'
import * as clanWarRepo from '../data/repositories/clanWarRepo'
import * as playerResourceRepo from '../data/repositories/playerResourceRepo'
import * as gamePlayerRepo from '../data/repositories/gamePlayerRepo'
import { loadClanConfig, loadBattleConfig, loadMonstersConfig, loadBuildingsConfig, loadArmouryConfig } from '../config/configLoader'
import { createStrategy } from '../domain/battle/strategyFactory'
import { resolveClanWar } from '../domain/clan/warfareResolver'
import { calculateWarEnslavement } from '../domain/clan/enslavementCalc'
import { calculateClanProduction, getPopulationRequirement } from '../domain/clan/clanProduction'
import { calculateLoot } from '../domain/battle/lootCalculator'
import { computeCost } from '../domain/economy/costCalculator'
import { calculateClanPveDamage } from '../domain/clan/clanPveDamage'
import { calculateClanCapacity } from '../domain/clan/clanCapacity'
import { nowDate, nowISO, parseDate, MS_IN_DAY } from '../utils/date'

function checkIsClanMember(
  playerGameId: number,
  clanId: number,
  errorMessage?: string,
  includeSuccess?: true
): ClanMember | { success: false; error: string }
function checkIsClanMember(
  playerGameId: number,
  clanId: number,
  errorMessage: string,
  includeSuccess: false
): ClanMember | { error: string }
function checkIsClanMember(
  playerGameId: number,
  clanId?: undefined,
  errorMessage?: string,
  includeSuccess?: false
): { error: string } | undefined
function checkIsClanMember(
  playerGameId: number,
  clanId?: undefined,
  errorMessage?: string,
  includeSuccess?: true
): ClanMember | { success: false; error: string }
function checkIsClanMember(
  playerGameId: number,
  clanId?: number,
  errorMessage?: string,
  includeSuccess?: boolean
): ClanMember | { success: false; error: string } | { error: string } | undefined
function checkIsClanMember(
  playerGameId: number,
  clanId?: number,
  errorMessage = 'Not a clan member',
  includeSuccess = true,
): ClanMember | { success: false; error: string } | { error: string } | undefined {
  const m = clanRepo.findMemberByPlayerGameId(playerGameId)

  if (clanId === undefined) {
    // includeSuccess=false → error if member IS found (inverse, for joinClan)
    // includeSuccess=true  → error if member NOT found (for leaveClan)
    if (includeSuccess ? !m : m) {
      return includeSuccess
        ? { success: false, error: errorMessage }
        : { error: errorMessage }
    }
    return includeSuccess ? m : undefined
  }

  if (!m || m.clanId !== clanId) {
    return includeSuccess
      ? { success: false, error: errorMessage }
      : { error: errorMessage }
  }
  return m
}

export function createClan(name: string, playerGameId: number): { clan: Clan } | { error: string } {
  const existing = clanRepo.findClanByName(name, playerGameId)
  if (existing) return { error: 'A clan with that name already exists' }

  const clan = clanRepo.createClan(name, playerGameId)
  clanResourceRepo.create(clan.id)
  const buildingsConfig = loadBuildingsConfig()
  for (const [buildingType, level] of Object.entries(buildingsConfig.clan.startingBuildings)) {
    clanBuildingRepo.upsertClanBuilding(clan.id, buildingType as BuildingType, level as number, 0, 0, 0)
  }
  return { clan }
}

export function getClan(clanId: number, viewerPlayerGameId?: number): ClanResponse | undefined {
  const clan = clanRepo.findClanById(clanId)
  if (!clan) return undefined

  const rawMembers = clanRepo.findClanMembersWithUsernames(clanId)
  const bossStats = clanPveBattleRepo.getPveStatsByClan(clanId)
  const warParticipants = clanWarRepo.getWarParticipantsByClan(clanId)

  const bossStatsMap = new Map(bossStats.map(b => [b.playerGameId, b]))
  const warStatsMap = new Map(warParticipants.map(w => [w.playerGameId, w]))

  const members: ClanMemberDetail[] = rawMembers.map(m => {
    const bs = bossStatsMap.get(m.playerGameId)
    const ws = warStatsMap.get(m.playerGameId)
    return {
      id: m.id,
      clanId: m.clanId,
      playerGameId: m.playerGameId,
      username: m.username,
      role: m.role as ClanMemberDetail['role'],
      contributedCivilians: m.contributedCivilians,
      clanEnergy: m.clanEnergy,
      clanMaxEnergy: m.clanMaxEnergy,
      clanLastEnergyAt: m.clanLastEnergyAt,
      pveBattlesAttended: bs?.pveBattlesAttended ?? 0,
      pveDamageDealt: bs?.pveDamageDealt ?? 0,
      pveSoldiersSpent: bs?.pveSoldiersSpent ?? 0,
      warsParticipated: ws?.warsParticipated ?? 0,
      createdAt: m.joinedAt,
      updatedAt: m.joinedAt,
    }
  })

  const buildings = clanBuildingRepo.findClanBuildings(clanId)
  const buildingsConfig = loadBuildingsConfig()

  const enrichedBuildings = buildings.map(b => {
    const cfg = buildingsConfig.clan[b.type] as ClanBuildingConfig | undefined
    const costDefs = cfg?.upgradeCosts
    if (!costDefs) return { ...b, nextUpgradeCost: null }
    const nextCost: Record<string, number> = {}
    for (const [res, costDef] of Object.entries(costDefs)) {
      nextCost[res] = computeCost(costDef.base, costDef.multiplier, b.level)
    }
    return { ...b, nextUpgradeCost: nextCost }
  })

  let viewerRole: ClanResponse['viewerRole']
  if (viewerPlayerGameId) {
    const viewerMember = rawMembers.find(m => m.playerGameId === viewerPlayerGameId)
    viewerRole = viewerMember?.role as ClanResponse['viewerRole']
  }

  return { clan, members, buildings: enrichedBuildings, viewerRole: viewerRole as ClanResponse['viewerRole'] }
}

export function searchClans(name: string, playerGameId: number): { clan: Clan; memberCount: number; activated: boolean }[] {
  const pg = gamePlayerRepo.findById(playerGameId)
  if (!pg) return []
  const clanConfig = loadClanConfig()
  return clanRepo.searchClansByName(name, pg.gameId).map(clan => {
    const clanRes = clanResourceRepo.findByClanId(clan.id)
    return {
      clan,
      memberCount: clanRepo.getClanMemberCount(clan.id),
      activated: clanRes ? clanRes.civilians >= clanConfig.activationCap : false,
    }
  })
}

export function joinClan(clanId: number, playerGameId: number): { success: true } | { error: string } {
  const result = checkIsClanMember(playerGameId, undefined, 'Already in a clan', false)
  if (result !== undefined) return result
  clanRepo.addClanMember(clanId, playerGameId)
  return { success: true }
}

export function contributeCivilian(clanId: number, playerGameId: number, amount: number): ClanContributeCivilianResponse {
  const resource = playerResourceRepo.findByPlayerGameId(playerGameId)
  if (!resource) return { success: false, error: 'Player not found' }
  if (resource.civilians < amount) return { success: false, error: 'Not enough civilians' }

  const member = checkIsClanMember(playerGameId, clanId)
  if ('error' in member) return member

  playerResourceRepo.update(resource.id, { civilians: resource.civilians - amount })

  const clanRes = clanResourceRepo.findByClanId(clanId)
  if (clanRes) {
    clanResourceRepo.update(clanRes.id, { civilians: clanRes.civilians + amount })
  }
  clanRepo.addContributedCivilians(playerGameId, amount)

  return { success: true }
}

export function upgradeClanBuilding(
  clanId: number,
  playerGameId: number,
  buildingType: BuildingType,
  resourceType: ResourceType,
  amount: number
): ClanBuildingUpgradeResponse {
  const clan = clanRepo.findClanById(clanId)
  if (!clan) return { success: false, error: 'Clan not found' }

  const member = checkIsClanMember(playerGameId, clanId)
  if ('error' in member) return member

  const building = clanBuildingRepo.findClanBuilding(clanId, buildingType)
  if (!building) return { success: false, error: 'Building not found' }

  const buildingsConfig = loadBuildingsConfig()
  const cfg = buildingsConfig.clan[buildingType] as ClanBuildingConfig | undefined
  if (!cfg) return { success: false, error: 'Building type cannot be upgraded' }

  const costDefs = cfg.upgradeCosts
  if (!costDefs) return { success: false, error: 'Building type cannot be upgraded' }

  const costDef = costDefs[resourceType]
  if (!costDef) return { success: false, error: 'Invalid resource type' }

  const clanRes = clanResourceRepo.findByClanId(clanId)
  if (!clanRes) return { success: false, error: 'Clan resources not found' }

  const nextLevel = building.level + 1
  const popReq = cfg.populationRequirement
  if (popReq) {
    const required = getPopulationRequirement(popReq, nextLevel)
    if (clanRes.civilians < required) {
      return { success: false, error: `Clan population too low. Need ${required} civilians for level ${nextLevel}` }
    }
  }

  const updatedBuilding = clanBuildingRepo.findClanBuilding(clanId, buildingType)!
  const totalRequired = computeCost(costDef.base, costDef.multiplier, building.level)

  const totalContributed = updatedBuilding.contributedWood + updatedBuilding.contributedFood + updatedBuilding.contributedMetal
  if (totalContributed >= totalRequired) {
    const overflow = totalContributed - totalRequired
    const newLevel = building.level + 1
    clanBuildingRepo.upsertClanBuilding(clanId, buildingType, newLevel,
      resourceType === 'wood' ? overflow : 0,
      resourceType === 'food' ? overflow : 0,
      resourceType === 'metal' ? overflow : 0)
    return { success: true }
  }

  return { success: true }
}

export function contributeClanResource(
  clanId: number,
  playerGameId: number,
  resourceType: ResourceType,
  amount: number
): ClanBuildingUpgradeResponse {
  const clan = clanRepo.findClanById(clanId)
  if (!clan) return { success: false, error: 'Clan not found' }

  const member = checkIsClanMember(playerGameId, clanId)
  if ('error' in member) return member

  const resource = playerResourceRepo.findByPlayerGameId(playerGameId)!

  const actualContribution = Math.min(amount, resource[resourceType])
  if (actualContribution <= 0) return { success: false, error: 'No resources to contribute' }  

  const updatedPlayerResource = resource[resourceType] - actualContribution;

  const updateData: Record<string, number> = {}
  updateData[resourceType] = updatedPlayerResource
  playerResourceRepo.update(resource.id, updateData as any)

  clanResourceRepo.addContribution(clanId, resourceType, actualContribution)

  return { success: true }
}

export function upgradeClanStat(
  clanId: number,
  playerGameId: number,
  statType: StatType,
  amount: number
): ClanStatUpgradeResponse {
  const clan = clanRepo.findClanById(clanId)
  if (!clan) return { success: false, error: 'Clan not found' }

  const member = checkIsClanMember(playerGameId, clanId)
  if ('error' in member) return member

  const resource = playerResourceRepo.findByPlayerGameId(playerGameId)!
  const actualContribution = Math.min(amount, resource.metal)
  if (actualContribution <= 0) return { success: false, error: 'No metal to contribute' }

  playerResourceRepo.update(resource.id, { metal: resource.metal - actualContribution })

  const armouryCfg = loadArmouryConfig()
  const statCfg = armouryCfg.clan[statType]
  if (!statCfg) return { success: false, error: 'Stat upgrades not configured' }
  const metalCost = statCfg.costs['metal']
  if (!metalCost) return { success: false, error: 'No metal cost defined' }

  let currentLevel = statType === 'attack' ? clan.clanAttackLevel : clan.clanDefenseLevel
  let currentProgress = statType === 'attack' ? clan.clanAttackProgress : clan.clanDefenseProgress
  let nextCost = computeCost(metalCost.base, metalCost.multiplier, currentLevel - 1)

  currentProgress += actualContribution

  while (currentProgress >= nextCost) {
    currentProgress -= nextCost
    currentLevel += 1
    nextCost = computeCost(metalCost.base, metalCost.multiplier, currentLevel - 1)
  }

  clanRepo.updateClanStat(clanId, statType, currentLevel, currentProgress)

  return { success: true }
}

export function isClanActivated(clanId: number): ClanWarActivationResponse {
  const clanRes = clanResourceRepo.findByClanId(clanId)
  if (!clanRes) return { activated: false }
  const clanConfig = loadClanConfig()
  return { activated: clanRes.civilians >= clanConfig.activationCap }
}

export function checkUpkeep(playerGameId: number): ClanCivilianUpkeepResponse {
  const member = clanRepo.findMemberByPlayerGameId(playerGameId)
  if (!member) return { met: true, message: 'Not in a clan' }

  const clanConfig = loadClanConfig()
  const rule = clanConfig.contributionRule
  const met = member.contributedCivilians >= rule.requiredCivilians

  return {
    met,
    message: met
      ? 'Upkeep requirements met'
      : `Need ${rule.requiredCivilians - member.contributedCivilians} more civilians contributed within ${rule.deadlineDays} days`,
  }
}

export function startClanWar(
  attackerClanId: number,
  defenderClanId: number,
  playerGameId: number,
  armyToCommit: number
): ClanWarResponse | ErrorResponse {
  const attackerClan = clanRepo.findClanById(attackerClanId)
  const defenderClan = clanRepo.findClanById(defenderClanId)
  if (!attackerClan || !defenderClan) return { error: 'Clan not found' }

  const member = checkIsClanMember(playerGameId, attackerClanId, 'Not a member of the attacking clan', false)
  if ('error' in member) return member
  if (member.role !== 'leader' && member.role !== 'officer') return { error: 'Only leaders and officers can declare war' }

  const clanConfig = loadClanConfig()
  const battleConfig = loadBattleConfig()
  const attackerRes = clanResourceRepo.findByClanId(attackerClanId)
  const defenderRes = clanResourceRepo.findByClanId(defenderClanId)

  if (!attackerRes || !defenderRes) return { error: 'Clan resources not initialized' }
  if (attackerRes.soldiers < armyToCommit) return { error: 'Not enough soldiers' }
  if (attackerRes.civilians < clanConfig.activationCap) return { error: 'Clan not activated' }

  const now = nowDate()
  const lastAttack = attackerClan.lastAttackAt ? parseDate(attackerClan.lastAttackAt) : null
  const attackLimitMs = battleConfig.clanPvp.attackLimitPerDay * MS_IN_DAY
  if (lastAttack && (now.getTime() - lastAttack.getTime()) < attackLimitMs) {
    return { error: 'Clan already attacked today' }
  }

  const lastDefense = defenderClan.lastDefendedAt ? parseDate(defenderClan.lastDefendedAt) : null
  const defenseLimitMs = battleConfig.clanPvp.defenseLimitPerDay * MS_IN_DAY
  if (lastDefense && (now.getTime() - lastDefense.getTime()) < defenseLimitMs) {
    return { error: 'Clan already defended today' }
  }

  const varConfig = battleConfig.battleStrategy.calculationType.VAR as any
  const strategy = createStrategy('VAR', varConfig)

  const attacker: BattleUnit = {
    armySize: armyToCommit,
    attackStat: attackerClan.clanAttackLevel || 1,
    defenseStat: attackerClan.clanDefenseLevel || 1,
  }

  const defender: BattleUnit = {
    armySize: defenderRes.soldiers,
    attackStat: defenderClan.clanAttackLevel || 1,
    defenseStat: defenderClan.clanDefenseLevel || 1,
  }

  const rounds = Math.floor(armyToCommit / Math.max(1, defenderRes.soldiers))
  const battleResult = resolveClanWar(strategy, attacker, defender, Math.max(1, rounds))

  const attackerWon = battleResult.roundsWon > battleResult.roundsLost
  let enslavement: { enslaved: number; winnerClanId: number; loserClanId: number }

  if (attackerWon) {
    const enslavementResult = calculateWarEnslavement(
      attackerRes.civilians, defenderRes.civilians,
      battleConfig.clanPvp.enslavementMin, battleConfig.clanPvp.enslavementMax, battleConfig.clanPvp.minimumPopulationProtection,
    )
    const winnerCivs = attackerRes.civilians + enslavementResult.enslaved
    const loserCivs = defenderRes.civilians - enslavementResult.actualDeduction
    const attackerSoldiers = Math.max(0, attackerRes.soldiers - armyToCommit)

    clanResourceRepo.update(attackerRes.id, { civilians: winnerCivs, soldiers: attackerSoldiers })
    clanResourceRepo.update(defenderRes.id, { civilians: loserCivs })
    clanRepo.updateLastAttackAt(attackerClanId)
    clanRepo.updateLastDefendedAt(defenderClanId)

    enslavement = { enslaved: enslavementResult.enslaved, winnerClanId: attackerClanId, loserClanId: defenderClanId }
  } else {
    const attackerSoldiers = Math.max(0, attackerRes.soldiers - armyToCommit)
    const lowerPop = Math.min(attackerRes.civilians, defenderRes.civilians)
    const enslavementResult = calculateWarEnslavement(
      defenderRes.civilians, lowerPop,
      battleConfig.clanPvp.enslavementMin, battleConfig.clanPvp.enslavementMax, battleConfig.clanPvp.minimumPopulationProtection,
    )
    const penaltyTarget = attackerRes.civilians < defenderRes.civilians ? 'attacker' : 'defender'

    if (penaltyTarget === 'attacker') {
      const attackerCivs = Math.max(battleConfig.clanPvp.minimumPopulationProtection, attackerRes.civilians - enslavementResult.actualDeduction)
      const defenderCivs = defenderRes.civilians + enslavementResult.enslaved
      clanResourceRepo.update(attackerRes.id, { civilians: attackerCivs, soldiers: attackerSoldiers })
      clanResourceRepo.update(defenderRes.id, { civilians: defenderCivs })
      clanRepo.updateLastAttackAt(attackerClanId)
      enslavement = { enslaved: enslavementResult.enslaved, winnerClanId: defenderClanId, loserClanId: attackerClanId }
    } else {
      const defenderCivs = Math.max(battleConfig.clanPvp.minimumPopulationProtection, defenderRes.civilians - enslavementResult.actualDeduction)
      const attackerCivs = attackerRes.civilians + enslavementResult.enslaved
      clanResourceRepo.update(attackerRes.id, { civilians: attackerCivs, soldiers: attackerSoldiers })
      clanResourceRepo.update(defenderRes.id, { civilians: defenderCivs })
      clanRepo.updateLastAttackAt(attackerClanId)
      enslavement = { enslaved: enslavementResult.enslaved, winnerClanId: defenderClanId, loserClanId: attackerClanId }
    }
  }

  const warId = clanWarRepo.insertClanWar(
    attackerClanId, defenderClanId, armyToCommit, defenderRes.soldiers,
    battleResult.roundsCommitted, battleResult.roundsWon, battleResult.roundsLost,
    enslavement.enslaved, enslavement.winnerClanId
  )

  const allMembers = clanRepo.findClanMembers(attackerClanId)
  clanWarRepo.insertWarParticipants(warId, allMembers.map(m => m.playerGameId))

  return { result: battleResult, warId: warId as number, enslavement }
}

/* ── Clan PvE System ── */

export function startClanPveBattle(
  clanId: number,
  playerGameId: number,
  monsterId: string
): { success: boolean; error?: string; monster?: ClanPveMonster } {
  const clan = clanRepo.findClanById(clanId)
  if (!clan) return { success: false, error: 'Clan not found' }

  const member = checkIsClanMember(playerGameId, clanId)
  if ('error' in member) return member
  if (member.role !== 'leader') return { success: false, error: 'Only the clan leader can start a PvE fight' }

  const existing = clanPveBattleRepo.findActivePveBattle(clanId)
  if (existing) return { success: false, error: 'A PvE fight is already active' }

  const monstersConfig = loadMonstersConfig()
  const monsterDef = monstersConfig.monsters.find(m => m.id === monsterId)
  if (!monsterDef) return { success: false, error: 'Unknown monster' }

  const battleConfig = loadBattleConfig()
  const memberCount = clanRepo.findClanMembers(clanId).length
  const totalHp = battleConfig.clanPve.monsterHpMultiplierPerMember * memberCount

  const loot = calculateLoot(1, monsterDef.loot)
  const multiplier = battleConfig.clanPve.lootMultiplier
  const lootPerMember: Record<string, number> = {}
  for (const [resource, value] of Object.entries(loot)) {
    lootPerMember[resource] = Math.floor(value * multiplier)
  }

  const fightId = clanPveBattleRepo.insertPveBattle(
    clanId, monsterId, totalHp, playerGameId, JSON.stringify(lootPerMember)
  )

  return {
    success: true,
    monster: {
      id: fightId,
      monsterId,
      monsterName: monsterDef.name,
      totalHp,
      currentHp: totalHp,
      state: 'active',
      lootPerMember,
      participants: 1,
      collected: [],
    },
  }
}

export function attackClanPveBattle(
  clanId: number,
  playerGameId: number,
  soldierCount: number
): ClanPveAttackResponse | { error: string } {
  const clan = clanRepo.findClanById(clanId)
  if (!clan) return { error: 'Clan not found' }

  const member = checkIsClanMember(playerGameId, clanId, 'Not a clan member', false)
  if ('error' in member) return member

  const monster = clanPveBattleRepo.findActivePveBattle(clanId)
  if (!monster) return { error: 'No active PvE fight' }

  if (soldierCount < 1) return { error: 'Must send at least 1 soldier' }

  const battleConfig = loadBattleConfig()
  const energyCost = battleConfig.clanPve.energyCostPerAction ?? 10
  const currentEnergy = member.clanEnergy
  if (currentEnergy < energyCost) return { error: `Not enough energy (need ${energyCost}, have ${currentEnergy})` }

  clanRepo.updateClanEnergy(member.id, currentEnergy - energyCost, nowISO())

  const resource = playerResourceRepo.findByPlayerGameId(playerGameId)!
  if (resource.soldiers < soldierCount) return { error: 'Not enough soldiers' }

  playerResourceRepo.update(resource.id, { soldiers: resource.soldiers - soldierCount })

  const damage = calculateClanPveDamage(soldierCount, clan.clanAttackLevel)

  const newHp = Math.max(0, monster.currentHp - damage)
  const defeated = newHp <= 0
  const newState = defeated ? 'defeated' : 'active'

  clanPveBattleRepo.updatePveBattleHp(monster.id, newHp, newState)
  clanPveBattleRepo.insertPveContribution(monster.id, playerGameId, soldierCount, damage)

  return {
    damageDealt: damage,
    remainingHp: newHp,
    monsterDefeated: defeated,
  }
}

function buildPveResponse(monster: clanPveBattleRepo.PveBattleRow): ClanPveStatusResponse {
  const monstersConfig = loadMonstersConfig()
  return {
    active: monster.state === 'active',
    monster: {
      id: monster.id,
      monsterId: monster.monsterId,
      totalHp: monster.totalHp,
      currentHp: monster.currentHp,
      state: monster.state,
      lootPerMember: JSON.parse(monster.lootPerMember),
      participants: clanPveBattleRepo.getParticipantCount(monster.id),
      collected: JSON.parse(monster.collected),
    },
  }
}

export function getPveStatus(clanId: number, playerGameId: number): ClanPveStatusResponse {
  const defeatedMonster = clanPveBattleRepo.findDefeatedPveBattle(clanId)
  if (defeatedMonster) {
    const collected: number[] = JSON.parse(defeatedMonster.collected)
    if (!collected.includes(playerGameId) && clanPveBattleRepo.hasPlayerParticipated(defeatedMonster.id, playerGameId)) {
      return buildPveResponse(defeatedMonster)
    }
  }

  const activeMonster = clanPveBattleRepo.findActivePveBattle(clanId)
  if (activeMonster) {
    return buildPveResponse(activeMonster)
  }

  return { active: false }
}

export function collectPveLoot(
  clanId: number,
  playerGameId: number
): ClanPveCollectLootResponse | { error: string } {
  const member = checkIsClanMember(playerGameId, clanId, 'Not a clan member', false)
  if ('error' in member) return member

  const monster = clanPveBattleRepo.findDefeatedPveBattle(clanId)
  if (!monster) return { error: 'No defeated PvE fight' }

  if (!clanPveBattleRepo.hasPlayerParticipated(monster.id, playerGameId)) {
    return { error: 'You did not participate in this PvE fight' }
  }

  const collected: number[] = JSON.parse(monster.collected)
  if (collected.includes(playerGameId)) return { error: 'Already collected loot' }

  const lootPerMember: Record<string, number> = JSON.parse(monster.lootPerMember)
  const resource = playerResourceRepo.findByPlayerGameId(playerGameId)!
  playerResourceRepo.update(resource.id, {
    food: resource.food + (lootPerMember.food || 0),
    wood: resource.wood + (lootPerMember.wood || 0),
    metal: resource.metal + (lootPerMember.metal || 0),
  })

  collected.push(playerGameId)
  clanPveBattleRepo.updateCollected(monster.id, JSON.stringify(collected))

  return { success: true, loot: lootPerMember }
}

/* ── Clan Management ── */

export function leaveClan(playerGameId: number): { success: boolean; error?: string } {
  const member = checkIsClanMember(playerGameId, undefined, 'Not in a clan', true)
  if ('error' in member) return member
  if (member.role === 'leader') return { success: false, error: 'Transfer ownership before leaving' }
  clanRepo.removeClanMember(playerGameId)
  return { success: true }
}

export function kickMember(clanId: number, callerPlayerGameId: number, targetPlayerGameId: number): { success: boolean; error?: string } {
  const caller = checkIsClanMember(callerPlayerGameId, clanId)
  if ('error' in caller) return caller
  if (caller.role !== 'leader' && caller.role !== 'officer') return { success: false, error: 'Only leaders and officers can kick members' }

  const target = clanRepo.findClanMembers(clanId).find(m => m.playerGameId === targetPlayerGameId)
  if (!target) return { success: false, error: 'Target not in clan' }
  if (target.role === 'leader') return { success: false, error: 'Cannot kick the leader' }
  if (caller.role === 'officer' && target.role === 'officer') return { success: false, error: 'Officers cannot kick other officers' }

  clanRepo.removeClanMember(targetPlayerGameId)
  return { success: true }
}

export function disbandClan(clanId: number, playerGameId: number): { success: boolean; error?: string } {
  const member = checkIsClanMember(playerGameId, clanId)
  if ('error' in member) return member
  if (member.role !== 'leader') return { success: false, error: 'Only the leader can disband the clan' }

  const members = clanRepo.findClanMembers(clanId)
  for (const m of members) {
    clanRepo.removeClanMember(m.playerGameId)
  }
  clanRepo.deleteClan(clanId)
  return { success: true }
}

export function promoteMember(clanId: number, callerPlayerGameId: number, targetPlayerGameId: number): { success: boolean; error?: string } {
  const caller = checkIsClanMember(callerPlayerGameId, clanId)
  if ('error' in caller) return caller
  if (caller.role !== 'leader') return { success: false, error: 'Only the leader can promote members' }

  const target = clanRepo.findClanMembers(clanId).find(m => m.playerGameId === targetPlayerGameId)
  if (!target) return { success: false, error: 'Target not in clan' }
  if (target.role !== 'member') return { success: false, error: 'Only members can be promoted to officer' }

  clanRepo.updateMemberRole(clanId, targetPlayerGameId, 'officer')
  return { success: true }
}

export function demoteMember(clanId: number, callerPlayerGameId: number, targetPlayerGameId: number): { success: boolean; error?: string } {
  const caller = checkIsClanMember(callerPlayerGameId, clanId)
  if ('error' in caller) return caller
  if (caller.role !== 'leader') return { success: false, error: 'Only the leader can demote officers' }

  const target = clanRepo.findClanMembers(clanId).find(m => m.playerGameId === targetPlayerGameId)
  if (!target) return { success: false, error: 'Target not in clan' }
  if (target.role !== 'officer') return { success: false, error: 'Only officers can be demoted to member' }

  clanRepo.updateMemberRole(clanId, targetPlayerGameId, 'member')
  return { success: true }
}

export function getWarHistory(clanId: number, playerGameId: number): { wars: any[]; clanNames: Record<string, string> } | { error: string } {
  const member = checkIsClanMember(playerGameId, clanId, 'Not a member of this clan', false)
  if ('error' in member) return member

  const wars = clanWarRepo.getWarHistory(clanId)
  const clanNames = new Map<number, string>()
  for (const w of wars) {
    if (!clanNames.has(w.attackerClanId)) {
      const c = clanRepo.findClanById(w.attackerClanId)
      if (c) clanNames.set(w.attackerClanId, c.name)
    }
    if (!clanNames.has(w.defenderClanId)) {
      const c = clanRepo.findClanById(w.defenderClanId)
      if (c) clanNames.set(w.defenderClanId, c.name)
    }
  }

  return { wars, clanNames: Object.fromEntries(clanNames) }
}

export function transferOwnership(clanId: number, callerPlayerGameId: number, targetPlayerGameId: number): { success: boolean; error?: string } {
  const caller = checkIsClanMember(callerPlayerGameId, clanId)
  if ('error' in caller) return caller
  if (caller.role !== 'leader') return { success: false, error: 'Only the leader can transfer ownership' }

  const target = clanRepo.findClanMembers(clanId).find(m => m.playerGameId === targetPlayerGameId)
  if (!target) return { success: false, error: 'Target not in clan' }
  if (target.playerGameId === callerPlayerGameId) return { success: false, error: 'Cannot transfer ownership to yourself' }

  clanRepo.transferOwnership(clanId, targetPlayerGameId)
  clanRepo.updateMemberRole(clanId, callerPlayerGameId, 'member')
  clanRepo.updateMemberRole(clanId, targetPlayerGameId, 'leader')
  return { success: true }
}
