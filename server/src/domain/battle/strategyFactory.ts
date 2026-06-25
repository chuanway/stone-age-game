import { IBattleStrategy } from './strategies/IBattleStrategy'
import { VARStrategy } from './strategies/VARStrategy'
import { SARStrategy } from './strategies/SARStrategy'
import { BattleStrategyType, VARConfig, SARConfig } from 'shared'

export function createStrategy(
  type: BattleStrategyType,
  config: VARConfig | SARConfig
): IBattleStrategy {
  switch (type) {
    case 'VAR':
      return new VARStrategy(config as VARConfig)
    case 'SAR':
      return new SARStrategy(config as SARConfig)
    default:
      throw new Error(`Unknown battle strategy type: ${type}`)
  }
}
