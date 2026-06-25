export interface BaseEntity {
    id: number;
    createdAt: string;
    updatedAt: string;
}
export interface ResourceHolder {
    food: number;
    wood: number;
    metal: number;
    civilians: number;
    soldiers: number;
}
export interface ResourceDelta {
    food: number;
    wood: number;
    metal: number;
    civilians: number;
    soldiers: number;
}
export interface ApiResponse {
    success: boolean;
    error?: string;
}
export interface ErrorResponse {
    error: string;
}
export type ResourceType = 'food' | 'wood' | 'metal';
export type StatType = 'attack' | 'defense';
export type ConfigName = 'buildings' | 'monsters' | 'battle' | 'clan' | 'game' | 'armoury';
