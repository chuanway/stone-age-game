import { PlayerGameResponse } from 'shared'
import * as gamePlayerRepo from '../data/repositories/gamePlayerRepo'
import * as clanRepo from '../data/repositories/clanRepo'
import { loadGameConfig } from '../config/configLoader'
import { nowDate, parseDate } from '../utils/date'

export function getPlayerGameData(playerGameId: number): PlayerGameResponse {
  const playerGame = gamePlayerRepo.findById(playerGameId)!
  const gameConfig = loadGameConfig()
  const tickIntervalMs = gameConfig.resourceTickIntervalMs
  const elapsedMs = nowDate().getTime() - parseDate(playerGame.lastTickAt).getTime()
  const serverRemainingMs = Math.max(0, tickIntervalMs - elapsedMs)
  const member = clanRepo.findMemberByPlayerGameId(playerGameId)
  const clanId = member?.clanId ?? null

  return { playerGame, tickIntervalMs, serverRemainingMs, clanId }
}
