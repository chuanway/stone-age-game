import { BaseEntity } from './base'

export interface Game extends BaseEntity {
  status: string
}

export interface GameConfig {
  startingResources: {
    food: number
    wood: number
    metal: number
    civilians: number
    soldiers: number
  }
  soldierConversionRate: number
  resourceTickIntervalMs: number
}
