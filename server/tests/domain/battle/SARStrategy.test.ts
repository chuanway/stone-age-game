import { describe, it, expect } from 'vitest'
import { SARStrategy } from '../../../src/domain/battle/strategies/SARStrategy'
import type { BattleUnit, SARConfig } from 'shared'

describe('SARStrategy', () => {
  const config: SARConfig = { victoryThreshold: 0 }

  it('returns positive success when SAR > 0', () => {
    const strategy = new SARStrategy(config)
    const attacker: BattleUnit = { armySize: 10, attackStat: 5, defenseStat: 3 }
    const defender: BattleUnit = { armySize: 5, attackStat: 3, defenseStat: 2 }
    const result = strategy.resolveBattleRound(attacker, defender)
    expect(result.success).toBeGreaterThan(0)
    expect(result.attackerArmySurvivors).toBeGreaterThan(0)
  })

  it('returns non-positive success when SAR <= 0', () => {
    const strategy = new SARStrategy(config)
    const attacker: BattleUnit = { armySize: 1, attackStat: 1, defenseStat: 1 }
    const defender: BattleUnit = { armySize: 10, attackStat: 5, defenseStat: 5 }
    const result = strategy.resolveBattleRound(attacker, defender)
    expect(result.success).toBeLessThanOrEqual(0)
    expect(result.attackerArmySurvivors).toBeLessThanOrEqual(0)
  })

  it('returns positive success when SAR equals victoryThreshold exactly', () => {
    const strategy = new SARStrategy({ victoryThreshold: 5 })
    const attacker: BattleUnit = { armySize: 5, attackStat: 1, defenseStat: 1 }
    const defender: BattleUnit = { armySize: 0, attackStat: 0, defenseStat: 0 }
    const result = strategy.resolveBattleRound(attacker, defender)
    expect(result.success).toBe(5)
  })
})
