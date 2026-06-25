export interface BattleUnit {
    armySize: number;
    attackStat: number;
    defenseStat: number;
}
export interface BattleRoundResult {
    success: boolean | number;
    attackerArmySurvivors?: number;
}
export interface BattleTotalResult {
    roundsCommitted: number;
    roundsWon: number;
    roundsLost: number;
    survivors: number;
    loot: Record<string, number>;
    armyLost: number;
}
export type BattleStrategyType = 'VAR' | 'SAR';
export interface VARConfig {
    cap: number;
    baseChance: number;
    varChance: number;
    maxChance: number;
    minChance: number;
}
export interface SARConfig {
    victoryThreshold: number;
}
export interface PvpTarget {
    id: number;
    totalPopulation: number;
}
export interface PvPBracketConfig {
    bracket: string;
    varChanceMultiplier: number;
}
export interface BattleConfig {
    activeStrategy: BattleStrategyType;
    battleStrategy: {
        calculationType: {
            VAR: VARConfig;
            SAR: SARConfig;
        };
        pvpPopulationBracket: {
            populationThreshold: number;
            varChanceMultiplier: Record<string, number>;
        };
    };
    clanPvp: {
        enslavementMin: number;
        enslavementMax: number;
        minimumPopulationProtection: number;
        attackLimitPerDay: number;
        defenseLimitPerDay: number;
        pvpVisibilityThreshold: number;
    };
    clanPve: {
        monsterHpMultiplierPerMember: number;
        lootMultiplier: number;
        energyCostPerAction: number;
    };
    playerPvp: {
        enslavementMin: number;
        enslavementMax: number;
        minimumPopulationProtection: number;
        attackLimitPerDay: number;
        defenseLimitPerDay: number;
        pvpVisibilityThreshold: number;
    };
}
