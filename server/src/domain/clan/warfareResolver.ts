import { IBattleStrategy } from '../battle/strategies/IBattleStrategy'
import { BattleUnit, BattleTotalResult, BattleRoundResult, LootTable } from 'shared'
import { calculateLoot } from '../battle/lootCalculator'

export function resolveClanWar(
  strategy: IBattleStrategy,
  attacker: BattleUnit,
  defender: BattleUnit,
  rounds: number,
  lootTable?: LootTable
): BattleTotalResult {
  const roundsResults: BattleRoundResult[] = []
  let roundsWon = 0
  let armyRemaining = attacker.armySize

  for (let i = 0; i < rounds; i++) {
    const roundArmy = Math.min(defender.armySize, armyRemaining)
    const roundAttacker: BattleUnit = {
      ...attacker,
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
    armyLost: attacker.armySize - armyRemaining,
  }
}
