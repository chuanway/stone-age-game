import { describe, it, expect, vi } from 'vitest'
import { resolveMultiRound } from '../../../src/domain/battle/roundResolver'
import type { IBattleStrategy } from '../../../src/domain/battle/strategies/IBattleStrategy'
import type { BattleUnit, BattleRoundResult, LootTable } from 'shared'

describe('resolveMultiRound', () => {
  const alwaysWin: IBattleStrategy = {
    resolveBattleRound: (_a: BattleUnit, _d: BattleUnit): BattleRoundResult => ({
      success: true,
    }),
  }

  const alwaysLose: IBattleStrategy = {
    resolveBattleRound: (_a: BattleUnit, _d: BattleUnit): BattleRoundResult => ({
      success: false,
    }),
  }

  const attacker: BattleUnit = { armySize: 100, attackStat: 10, defenseStat: 5 }
  const defender: BattleUnit = { armySize: 5, attackStat: 3, defenseStat: 3 }

  it('resolves correct number of rounds', () => {
    const result = resolveMultiRound(alwaysWin, attacker, defender, 10, 5)
    expect(result.roundsCommitted).toBe(10)
  })

  it('counts rounds won and lost', () => {
    const win = resolveMultiRound(alwaysWin, attacker, defender, 10, 5)
    expect(win.roundsWon).toBe(10)
    expect(win.roundsLost).toBe(0)

    const lose = resolveMultiRound(alwaysLose, attacker, defender, 10, 5)
    expect(lose.roundsWon).toBe(0)
    expect(lose.roundsLost).toBe(10)
  })

  it('tracks survivors correctly', () => {
    const result = resolveMultiRound(alwaysWin, attacker, defender, 10, 5)
    expect(result.survivors).toBe(50)
    expect(result.armyLost).toBe(50)
  })

  it('caps per-round army to minArmyPerRound', () => {
    const smallAttacker: BattleUnit = { armySize: 12, attackStat: 10, defenseStat: 5 }
    const result = resolveMultiRound(alwaysWin, smallAttacker, defender, 10, 5)
    expect(result.roundsCommitted).toBe(10)
    expect(result.survivors).toBe(0)
    expect(result.armyLost).toBe(12)
  })

  it('calculates loot when loot table is provided', () => {
    const lootTable: LootTable = { food: { min: 10, max: 10 } }
    const result = resolveMultiRound(alwaysWin, attacker, defender, 5, 5, lootTable)
    expect(result.loot.food).toBe(50)
  })

  it('returns empty loot when no loot table', () => {
    const result = resolveMultiRound(alwaysWin, attacker, defender, 5, 5)
    expect(result.loot).toEqual({})
  })
})
