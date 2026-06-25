import { BaseEntity } from './base'
import { ResourceType } from './base'

export type BuildingType =
  | 'house'
  | 'farm'
  | 'lumberjackHut'
  | 'mine'
  | 'armoury'
  | 'barracks'

export interface UpgradeCostDef {
  base: number
  multiplier: number
}

export type StartingBuildings = Record<string, number>

export interface BuildingConfig {
  name: string
  produces: ResourceType | null
  productionRatePerLevel?: number
  upgradeLimitLevel: number
  upgradeCosts: Record<ResourceType, UpgradeCostDef>
  operationalThreshold: number | null
}

export type BuildingsConfig = Record<BuildingType, BuildingConfig> & {
  startingBuildings: StartingBuildings
  clan: ClanBuildingsConfig
}

/* ── Player Buildings ── */

export interface PlayerBuilding extends BaseEntity {
  playerGameId: number
  type: BuildingType
  level: number
  name?: string
  produces?: string | null
  nextUpgradeCost?: Record<ResourceType, number> | null
}

export interface PlayerBuildableBuilding {
  type: BuildingType
  name: string
  produces: string | null
  cost: Record<ResourceType, number>
}

/* ── Clan Buildings ── */

export interface ClanBuilding {
  clanId: number
  type: BuildingType
  level: number
  contributedWood: number
  contributedFood: number
  contributedMetal: number
  nextUpgradeCost?: Record<string, number> | null
}

export interface PopulationRequirement {
  base: number
  multiplier: number
}

export interface ClanBuildingConfig {
  upgradeCosts?: Record<string, UpgradeCostDef>
  productionRatePerLevel?: number
  populationRequirement?: PopulationRequirement
  baseCapacity?: number
  capacityUpgradePerLevel?: number
}

export interface ClanBuildingsConfig {
  startingBuildings: Record<string, number>
  lumberjackHut: ClanBuildingConfig
  farm: ClanBuildingConfig
  mine: ClanBuildingConfig
  armoury: ClanBuildingConfig
  [key: string]: ClanBuildingConfig | Record<string, number>
}
