import { BattleUnit, BattleRoundResult } from 'shared'

export interface IBattleStrategy {
  resolveBattleRound(attacker: BattleUnit, defender: BattleUnit): BattleRoundResult
}
