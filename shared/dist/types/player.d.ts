import { BaseEntity } from './base';
export interface Player extends BaseEntity {
    username: string;
}
export interface PlayerGame extends BaseEntity {
    playerId: number;
    gameId: number;
    attackStat: number;
    defenseStat: number;
    lastTickAt: string;
}
export interface PlayerResource extends BaseEntity {
    playerGameId: number;
    food: number;
    wood: number;
    metal: number;
    civilians: number;
    soldiers: number;
}
