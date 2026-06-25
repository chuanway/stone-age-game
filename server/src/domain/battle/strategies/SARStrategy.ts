import { IBattleStrategy } from './IBattleStrategy'
import { BattleUnit, BattleRoundResult, SARConfig } from 'shared'
import { roundToIntegers } from '../../../utils/numbers'

export class SARStrategy implements IBattleStrategy {
  constructor(private config: SARConfig) {}

  resolveBattleRound(attacker: BattleUnit, defender: BattleUnit): BattleRoundResult {
    const { armySize: attackerArmySize, attackStat: attackerAttackStat } = attacker
    const { armySize: defenderArmySize, defenseStat: defenderDefenseStat } = defender

    const attackerAttackPoints = attackerArmySize * attackerAttackStat
    const defenderDefensePoints = defenderArmySize * defenderDefenseStat

    const sar = roundToIntegers(attackerAttackPoints - defenderDefensePoints)

    const attackerArmySurvivors = roundToIntegers(sar / attackerAttackStat)

    return {
      success: sar > 0 ? sar : 0,
      attackerArmySurvivors,
    }
  }
}
