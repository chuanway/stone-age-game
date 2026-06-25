import { BuildingType } from './building';
import { LootTable } from './monster';
import { BattleStrategyType } from './battle';
import { ResourceType } from './base';
import { ClanContributionRule } from './clan';
export interface UpgradeCostDef {
    base: number;
    multiplier: number;
}
export interface StartingBuildings {
    house: number;
    farm: number;
    lumberjackHut: number;
}
export interface BuildingConfig {
    name: string;
    produces: ResourceType | 'stats' | null;
    productionRatePerLevel?: number;
    upgradeLimitLevel: number;
    upgradeCosts: Record<string, UpgradeCostDef>;
    statUpgradeCosts?: Record<string, Record<string, UpgradeCostDef>>;
    operationalThreshold: number | null;
}
export type BuildingsConfig = Record<BuildingType, BuildingConfig> & {
    startingBuildings: StartingBuildings;
};
export interface MonsterConfig {
    id: string;
    name: string;
    minArmyPerRound: number;
    attack: number;
    defense: number;
    loot: LootTable;
}
export interface MonstersConfig {
    monsters: MonsterConfig[];
}
export interface VARStrategyConfig {
    cap: number;
    baseChance: number;
    varChance: number;
    maxChance: number;
    minChance: number;
}
export interface SARStrategyConfig {
    victoryThreshold: number;
}
export interface PvPBracketConfig {
    bracket: string;
    varChanceMultiplier: number;
}
export interface BattleConfig {
    activeStrategy: BattleStrategyType;
    battleStrategy: {
        calculationType: {
            VAR: VARStrategyConfig;
            SAR: SARStrategyConfig;
        };
        pvpPopulationBracket: {
            populationThreshold: number;
            varChanceMultiplier: {
                smallCity: number;
                mediumCity: number;
                largeCity: number;
            };
        };
    };
    clanPvp: {
        enslavementMin: number;
        enslavementMax: number;
        hardCapProtection: number;
        attackLimitPerDay: number;
        defenseLimitPerDay: number;
    };
    clanPve: {
        hpPerMember: number;
        lootMultiplier: number;
    };
    playerPvp: {
        enslavementMin: number;
        enslavementMax: number;
        hardCapProtection: number;
        attackLimitPerDay: number;
        defenseLimitPerDay: number;
    };
}
export interface ProductionScalingConfig {
    populationStep: number;
    foodPerStep: number;
    woodPerStep: number;
    metalPerStep: number;
}
export interface ClanConfig {
    activationCap: number;
    productionScaling: ProductionScalingConfig;
    startingBuildings: {
        lumberjackHut: number;
        farm: number;
        mine: number;
    };
    buildingUpgradeCosts: Record<string, Record<string, UpgradeCostDef>>;
    statUpgradeCosts?: Record<string, Record<string, UpgradeCostDef>>;
    contributionRule: ClanContributionRule;
    buildingProductionBonuses?: Record<string, Record<string, number>>;
    resourceCapacity?: {
        baseCapacity: number;
        perLevelBonus: number;
    };
    pveEnergyCost?: number;
}
export interface PvPConfig {
    visibilityThreshold: number;
}
export interface GameConfig {
    startingResources: {
        food: number;
        wood: number;
        metal: number;
        civilians: number;
        soldiers: number;
    };
    soldierConversionRate: number;
    resourceTickIntervalMs: number;
}
export type ConfigName = 'buildings' | 'monsters' | 'battle' | 'clan' | 'pvp' | 'game';
