import { ResourceType } from './base';
export interface PlayerArmouryUpgradeCost {
    base: number;
    multiplier: number;
}
export interface PlayerArmouryStatUpgrade {
    costs: Record<ResourceType, PlayerArmouryUpgradeCost>;
}
export interface ClanArmouryUpgradeCost {
    base: number;
    multiplier: number;
}
export interface ClanArmouryStatUpgrade {
    costs: Record<ResourceType, ClanArmouryUpgradeCost>;
}
export interface ArmouryConfig {
    player: Record<string, PlayerArmouryStatUpgrade>;
    clan: Record<string, ClanArmouryStatUpgrade>;
}
