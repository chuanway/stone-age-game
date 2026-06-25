import * as battleService from '../../services/battleService'
import { PlayerPvEBattleRequest, PvPBattleRequest } from 'shared'
import { ControllerHandler } from '../utils/controller'

export const startPve: ControllerHandler = (req) => {
  const playerGameId = (req as any).playerGameId
  const { monsterId, rounds, strategyType } = req.body as PlayerPvEBattleRequest
  const result = battleService.startPveBattle(playerGameId, monsterId, rounds, strategyType)
  if ('error' in result) return { status: 400, body: { error: result.error } }
  return { status: 200, body: result }
}

export const startPvp: ControllerHandler = (req) => {
  const playerGameId = (req as any).playerGameId
  const { targetId, armyToCommit } = req.body as PvPBattleRequest
  const gameId = parseInt(req.params.gameId as string, 10)
  const result = battleService.startPvPBattle(playerGameId, targetId, gameId, armyToCommit)
  if ('error' in result) return { status: 400, body: { error: result.error } }
  return { status: 200, body: result }
}

export const list: ControllerHandler = (_req) => {
  const monsters = battleService.getMonsters()
  return { status: 200, body: monsters }
}

export const getTargets: ControllerHandler = (_req) => {
  const result = battleService.getTargets()
  return { status: 200, body: result }
}
