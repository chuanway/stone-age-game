import * as buildingService from '../../services/buildingService'
import { PlayerBuildingCreateRequest, PlayerBuildingUpgradeRequest, PlayerStatUpgradeRequest, PlayerConvertSoldiersRequest } from 'shared'
import { ControllerHandler } from '../utils/controller'

export const configs: ControllerHandler = (_req) => {
  const cfg = buildingService.getBuildingsConfig()
  if (!cfg) return { status: 200, body: {} }
  return { status: 200, body: cfg }
}

export const build: ControllerHandler = (req) => {
  const playerGameId = (req as any).playerGameId
  const { buildingType } = req.body as PlayerBuildingCreateRequest
  const result = buildingService.createBuilding(playerGameId, buildingType)
  if (!result.success) return { status: 400, body: { error: result.error } }
  return { status: 200, body: { success: true } }
}

export const upgrade: ControllerHandler = (req) => {
  const playerGameId = (req as any).playerGameId
  const { buildingType } = req.body as PlayerBuildingUpgradeRequest
  const result = buildingService.upgradeBuilding(playerGameId, buildingType)
  if (!result.success) return { status: 400, body: { error: result.error } }
  return { status: 200, body: { success: true } }
}

export const upgradeStat: ControllerHandler = (req) => {
  const playerGameId = (req as any).playerGameId
  const { stat } = req.body as PlayerStatUpgradeRequest
  const result = buildingService.upgradeStat(playerGameId, stat)
  if (!result.success) return { status: 400, body: { error: result.error } }
  return { status: 200, body: { success: true } }
}

export const convertSoldiers: ControllerHandler = (req) => {
  const playerGameId = (req as any).playerGameId
  const { amount } = req.body as PlayerConvertSoldiersRequest
  const result = buildingService.convertCiviliansToSoldiers(playerGameId, amount)
  if (!result.success) return { status: 400, body: { error: result.error } }
  return { status: 200, body: { success: true } }
}
