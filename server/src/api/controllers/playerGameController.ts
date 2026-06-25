import * as playerService from '../../services/playerService'
import * as gameService from '../../services/gameService'
import * as buildingService from '../../services/buildingService'
import * as resourceService from '../../services/resourceService'
import { ControllerHandler } from '../utils/controller'

export const getPlayerGame: ControllerHandler = (req) => {
  const playerGameId = (req as any).playerGameId
  const data = gameService.getPlayerGameData(playerGameId)
  return { status: 200, body: data }
}

export const getPlayer: ControllerHandler = (req) => {
  const playerId = (req as any).playerId
  const data = playerService.getProfile(playerId)
  return { status: 200, body: data }
}

export const getResource: ControllerHandler = (req) => {
  const playerGameId = (req as any).playerGameId
  const data = resourceService.getResourceData(playerGameId)
  return { status: 200, body: data }
}

export const getBuildings: ControllerHandler = (req) => {
  const playerGameId = (req as any).playerGameId
  const data = buildingService.getPlayerBuildingsData(playerGameId)
  return { status: 200, body: data }
}
