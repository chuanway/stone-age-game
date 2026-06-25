import { describe, it, expect, vi } from 'vitest'
import { VARStrategy } from '../../../src/domain/battle/strategies/VARStrategy'
import type { BattleUnit, VARConfig } from 'shared'

describe('VARStrategy', () => {
  const config: VARConfig = {
    cap: 1.0, baseChance: 0.2, varChance: 0.6, maxChance: 0.8, minChance: 0.2,
  }

  it('returns success within chance range', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1)
    const strategy = new VARStrategy(config)
    const attacker: BattleUnit = { armySize: 10, attackStat: 5, defenseStat: 3 }
    const defender: BattleUnit = { armySize: 5, attackStat: 3, defenseStat: 2 }
    const result = strategy.resolveBattleRound(attacker, defender)
    expect(result.success).toBe(true)
    vi.restoreAllMocks()
  })

  it('applies minChance floor', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.01)
    const strategy = new VARStrategy({ ...config, minChance: 0.3 })
    const attacker: BattleUnit = { armySize: 1, attackStat: 1, defenseStat: 1 }
    const defender: BattleUnit = { armySize: 100, attackStat: 100, defenseStat: 100 }
    const result = strategy.resolveBattleRound(attacker, defender)
    expect(result.success).toBe(true)
    vi.restoreAllMocks()
  })

  it('caps VAR at 1.0', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1)
    const strategy = new VARStrategy(config)
    const attacker: BattleUnit = { armySize: 100, attackStat: 50, defenseStat: 10 }
    const defender: BattleUnit = { armySize: 1, attackStat: 1, defenseStat: 1 }
    const result = strategy.resolveBattleRound(attacker, defender)
    expect(result.success).toBe(true)
    vi.restoreAllMocks()
  })

  it('caps success chance at maxChance', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.9)
    const strategy = new VARStrategy({ ...config, maxChance: 0.5 })
    const attacker: BattleUnit = { armySize: 100, attackStat: 50, defenseStat: 10 }
    const defender: BattleUnit = { armySize: 1, attackStat: 1, defenseStat: 1 }
    const result = strategy.resolveBattleRound(attacker, defender)
    expect(result.success).toBe(false)
    vi.restoreAllMocks()
  })

  it('handles zero defender stats', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1)
    const strategy = new VARStrategy(config)
    const attacker: BattleUnit = { armySize: 10, attackStat: 5, defenseStat: 3 }
    const defender: BattleUnit = { armySize: 0, attackStat: 0, defenseStat: 0 }
    const result = strategy.resolveBattleRound(attacker, defender)
    expect(result.success).toBe(true)
    vi.restoreAllMocks()
  })
})
