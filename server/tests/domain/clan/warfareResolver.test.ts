import { describe, it, expect } from 'vitest'
import { resolveClanWar } from '../../../src/domain/clan/warfareResolver'
import type { IBattleStrategy } from '../../../src/domain/battle/strategies/IBattleStrategy'
import type { BattleUnit, BattleRoundResult, LootTable } from 'shared'

describe('resolveClanWar', () => {
  const alwaysWin: IBattleStrategy = {
    resolveBattleRound: (_a: BattleUnit, _d: BattleUnit): BattleRoundResult => ({
      success: true,
    }),
  }

  const attacker: BattleUnit = { armySize: 100, attackStat: 10, defenseStat: 5 }
  const defender: BattleUnit = { armySize: 20, attackStat: 3, defenseStat: 3 }

  it('resolves rounds based on army commitment', () => {
    const result = resolveClanWar(alwaysWin, attacker, defender, 5)
    expect(result.roundsCommitted).toBe(5)
    expect(result.roundsWon).toBe(5)
  })

  it('tracks survivors and losses', () => {
    const result = resolveClanWar(alwaysWin, attacker, defender, 3)
    expect(result.survivors).toBe(40)
    expect(result.armyLost).toBe(60)
  })

  it('limits round army to defender army size', () => {
    const bigAttacker: BattleUnit = { armySize: 400, attackStat: 10, defenseStat: 5 }
    const result = resolveClanWar(alwaysWin, bigAttacker, defender, 5)
    expect(result.roundsWon).toBe(5)
    expect(result.armyLost).toBe(100)
  })

  it('calculates loot when loot table is provided', () => {
    const lootTable: LootTable = { metal: { min: 5, max: 5 } }
    const result = resolveClanWar(alwaysWin, attacker, defender, 4, lootTable)
    expect(result.loot.metal).toBe(20)
  })

  it('returns empty loot when no loot table', () => {
    const result = resolveClanWar(alwaysWin, attacker, defender, 4)
    expect(result.loot).toEqual({})
  })
})
