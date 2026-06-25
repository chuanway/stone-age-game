import { IBattleStrategy } from './IBattleStrategy'
import { BattleUnit, BattleRoundResult, VARConfig } from 'shared'
import { roundToTwoDecimals, isFinite, getLowestNumber, generateRandomNumber } from '../../../utils/numbers'

export class VARStrategy implements IBattleStrategy {
  constructor(private config: VARConfig) {}

  resolveBattleRound(attacker: BattleUnit, defender: BattleUnit): BattleRoundResult {
    const { cap, baseChance, varChance } = this.config;

    const { attackStat: attackerAttackStat } = attacker
    const { defenseStat: defenderDefenseStat } = defender

    const rawVarRate = (attackerAttackStat / defenderDefenseStat) / 2
    const finalRawVarRate = isFinite(rawVarRate) ? rawVarRate : cap

    const varRate = getLowestNumber([finalRawVarRate, cap])

    const successChance = roundToTwoDecimals(baseChance + (varRate * varChance))

    const success = generateRandomNumber(1) < successChance

    return {
      success,
    }
  }
}
