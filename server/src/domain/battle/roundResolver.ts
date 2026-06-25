import { IBattleStrategy } from './strategies/IBattleStrategy'
import { BattleUnit, BattleRoundResult, BattleTotalResult, LootTable } from 'shared'
import { calculateLoot } from './lootCalculator'

export function resolveMultiRound(
  strategy: IBattleStrategy,
  attackerBase: BattleUnit,
  defender: BattleUnit,
  rounds: number,
  minArmyPerRound: number,
  lootTable?: LootTable
): BattleTotalResult {
  const roundsResults: BattleRoundResult[] = []
  let roundsWon = 0
  let armyRemaining = attackerBase.armySize

  for (let i = 0; i < rounds; i++) {
    const roundArmy = Math.min(minArmyPerRound, armyRemaining)
    const roundAttacker: BattleUnit = {
      ...attackerBase,
      armySize: roundArmy,
    }

    const roundResult = strategy.resolveBattleRound(roundAttacker, defender)
    roundsResults.push(roundResult)

    if (roundResult.success) {
      roundsWon++
    }
    armyRemaining -= roundArmy
  }

  const loot = lootTable ? calculateLoot(roundsWon, lootTable) as unknown as Record<string, number> : {}

  return {
    roundsCommitted: rounds,
    roundsWon,
    roundsLost: rounds - roundsWon,
    survivors: armyRemaining,
    loot,
    armyLost: attackerBase.armySize - armyRemaining,
  }
}
