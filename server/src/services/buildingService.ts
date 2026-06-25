import { BuildingConfig, PlayerBuildingUpgradeResponse, PlayerBuildingCreateResponse, PlayerConvertSoldiersResponse, PlayerStatUpgradeResponse, PlayerBuilding, PlayerBuildableBuilding, PlayerBuildingsResponse, BuildingType, StatType, PlayerArmouryStatUpgrade } from 'shared'
import * as buildingRepo from '../data/repositories/buildingRepo'
import * as playerResourceRepo from '../data/repositories/playerResourceRepo'
import * as gamePlayerRepo from '../data/repositories/gamePlayerRepo'
import { loadBuildingsConfig, loadGameConfig, loadArmouryConfig } from '../config/configLoader'
import { getUpgradeCost, canAffordUpgrade, deductCost } from '../domain/economy/buildingUpgrade'
import { calculateProductionRates } from '../domain/economy/productionRates'
import { calculateConvertedSoldiers } from '../domain/economy/soldierConversion'
import { computeCost } from '../domain/economy/costCalculator'

export function getBuildingsConfig(): Record<string, unknown> {
  const cfg = loadBuildingsConfig()
  const { startingBuildings, ...rest } = cfg
  return rest
}

export function createBuilding(
  playerGameId: number,
  buildingType: BuildingType,
): PlayerBuildingCreateResponse {
  const cfg = loadBuildingsConfig()
  const buildingConfig = cfg[buildingType] as BuildingConfig | undefined
  if (!buildingConfig) return { success: false, error: 'Unknown building type' }

  const resource = playerResourceRepo.findByPlayerGameId(playerGameId)!
  const existing = buildingRepo.findBuilding(playerGameId, buildingType)
  if (existing) return { success: false, error: 'Building already exists' }

  const cost = getUpgradeCost(buildingConfig, 0)
  const resources = { food: resource.food, wood: resource.wood, metal: resource.metal }

  if (!canAffordUpgrade(resources, cost)) {
    return { success: false, error: 'Insufficient resources' }
  }

  const remaining = deductCost(resources, cost)
  playerResourceRepo.update(resource.id, { food: remaining.food, wood: remaining.wood, metal: remaining.metal })

  buildingRepo.createBuilding(playerGameId, buildingType, 1)

  return { success: true }
}

export function upgradeBuilding(
  playerGameId: number,
  buildingType: BuildingType,
): PlayerBuildingUpgradeResponse {
  const cfg = loadBuildingsConfig()
  const buildingConfig = cfg[buildingType] as BuildingConfig | undefined
  if (!buildingConfig) return { success: false, error: 'Unknown building type' }

  const resource = playerResourceRepo.findByPlayerGameId(playerGameId)!
  const building = buildingRepo.findBuilding(playerGameId, buildingType)

  if (!building) return { success: false, error: 'Building not found' }

  if (buildingConfig.upgradeLimitLevel > 0 && building.level >= buildingConfig.upgradeLimitLevel) {
    return { success: false, error: 'Building cannot be upgraded further' }
  }

  const cost = getUpgradeCost(buildingConfig, building.level)
  const resources = {
    food: resource.food,
    wood: resource.wood,
    metal: resource.metal,
  }

  if (!canAffordUpgrade(resources, cost)) {
    return { success: false, error: 'Insufficient resources' }
  }

  const remaining = deductCost(resources, cost)

  playerResourceRepo.update(resource.id, { food: remaining.food, wood: remaining.wood, metal: remaining.metal })

  buildingRepo.updateBuildingLevel(building.id, building.level + 1)

  return { success: true }
}

export function getPlayerBuildingsData(playerGameId: number): PlayerBuildingsResponse {
  const resource = playerResourceRepo.findByPlayerGameId(playerGameId)!
  const buildings = buildingRepo.findBuildingsByPlayerGameId(playerGameId)
  const rawConfigs = loadBuildingsConfig()
  const buildingConfigs = rawConfigs as unknown as Record<string, BuildingConfig>
  const ownedTypes = new Set<string>(buildings.map(b => b.type))

  const buildingsWithInfo: PlayerBuilding[] = buildings.map(b => {
    const config = buildingConfigs[b.type]
    const isAtLimit = config.upgradeLimitLevel > 0 && b.level >= config.upgradeLimitLevel
    return {
      id: b.id,
      playerGameId: b.playerGameId,
      type: b.type,
      level: b.level,
      name: config.name,
      produces: config.produces,
      nextUpgradeCost: isAtLimit ? null : getUpgradeCost(config, b.level),
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
    }
  })

  const buildable: PlayerBuildableBuilding[] = []
  for (const [type, cfg] of Object.entries(buildingConfigs)) {
    if (type === 'startingBuildings' || type === 'clan') continue
    if (ownedTypes.has(type)) continue
    const config = cfg as BuildingConfig
    const cost = getUpgradeCost(config, 0)
    buildable.push({ type: type as BuildingType, name: config.name, produces: config.produces, cost })
  }

  const productionRates = calculateProductionRates(buildings, resource.civilians, buildingConfigs)

  return { buildings: buildingsWithInfo, buildable, productionRates }
}

export function convertCiviliansToSoldiers(
  playerGameId: number,
  amount: number,
): PlayerConvertSoldiersResponse {
  const gameConfig = loadGameConfig()
  const conversionRate = gameConfig.soldierConversionRate

  const resource = playerResourceRepo.findByPlayerGameId(playerGameId)!
  if (resource.civilians < amount) {
    return { success: false, error: 'Not enough civilians' }
  }

  const soldiersAdded = calculateConvertedSoldiers(amount, conversionRate)
  playerResourceRepo.update(resource.id, { civilians: resource.civilians - amount, soldiers: resource.soldiers + soldiersAdded })

  return { success: true }
}

export function upgradeStat(
  playerGameId: number,
  statType: StatType,
): PlayerStatUpgradeResponse {
  const armouryCfg = loadArmouryConfig()
  const statUpgrade = armouryCfg.player[statType] as PlayerArmouryStatUpgrade | undefined
  if (!statUpgrade) return { success: false, error: 'Armoury stat upgrades not configured' }

  const costDef = statUpgrade.costs['metal']
  if (!costDef) return { success: false, error: 'No metal cost defined' }

  const pg = gamePlayerRepo.findById(playerGameId)!
  const currentValue = statType === 'attack' ? pg.attackStat : pg.defenseStat
  const cost = computeCost(costDef.base, costDef.multiplier, currentValue - 1)

  const resource = playerResourceRepo.findByPlayerGameId(playerGameId)!
  if (resource.metal < cost) return { success: false, error: 'Not enough metal' }

  const remaining = resource.metal - cost
  playerResourceRepo.update(resource.id, { metal: remaining })

  const newAttack = statType === 'attack' ? currentValue + 1 : pg.attackStat
  const newDefense = statType === 'defense' ? currentValue + 1 : pg.defenseStat
  gamePlayerRepo.updateStats(playerGameId, newAttack, newDefense)

  return { success: true }
}
