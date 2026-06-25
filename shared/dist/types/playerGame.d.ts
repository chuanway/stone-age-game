import { BaseEntity } from './base';
import { BuildingType } from './building';
export interface PlayerGame extends BaseEntity {
    playerId: number;
    gameId: number;
    attackStat: number;
    defenseStat: number;
    lastTickAt: string;
    clanEnergy?: number;
    clanMaxEnergy?: number;
    clanLastEnergyAt?: string | null;
}
export interface PlayerResource extends BaseEntity {
    playerGameId: number;
    food: number;
    wood: number;
    metal: number;
    civilians: number;
    soldiers: number;
}
export interface PlayerBuilding extends BaseEntity {
    playerGameId: number;
    type: BuildingType;
    level: number;
    name?: string;
    produces?: string | null;
    nextUpgradeCost?: Record<string, number> | null;
}
export interface PlayerBuildableBuilding {
    type: BuildingType;
    name: string;
    produces: string | null;
    cost: Record<string, number>;
}
