import * as clanService from '../../services/clanService'
import { CreateClanRequest, ClanContributeCivilianRequest, ClanBuildingUpgradeRequest, ClanContributeResourceRequest, ClanStatUpgradeRequest, ClanWarRequest, ClanPveStartRequest, ClanPveAttackRequest, JoinClanRequest } from 'shared'
import { ControllerHandler } from '../utils/controller'

export const create: ControllerHandler = (req) => {
  const playerGameId = (req as any).playerGameId
  const { name } = req.body as CreateClanRequest
  const result = clanService.createClan(name, playerGameId)
  if ('error' in result) return { status: 400, body: { error: result.error } }
  return { status: 201, body: result.clan }
}

export const getClan: ControllerHandler = (req) => {
  const playerGameId = (req as any).playerGameId
  const clanId = parseInt(req.params.id as string, 10)
  const clan = clanService.getClan(clanId, playerGameId)
  if (!clan) return { status: 404, body: { error: 'Clan not found' } }
  return { status: 200, body: clan }
}

export const searchClans: ControllerHandler = (req) => {
  const playerGameId = (req as any).playerGameId
  const name = (req.query.name as string).trim()
  const results = clanService.searchClans(name, playerGameId)
  return { status: 200, body: results }
}

export const join: ControllerHandler = (req) => {
  const playerGameId = (req as any).playerGameId
  const { clanId } = req.body as JoinClanRequest
  const result = clanService.joinClan(clanId, playerGameId)
  if ('error' in result) return { status: 400, body: { error: result.error } }
  return { status: 200, body: { success: true } }
}

export const contribute: ControllerHandler = (req) => {
  const playerGameId = (req as any).playerGameId
  const clanId = parseInt(req.params.id as string, 10)
  const { amount } = req.body as ClanContributeCivilianRequest
  const result = clanService.contributeCivilian(clanId, playerGameId, amount)
  if (!result.success) return { status: 400, body: { error: result.error } }
  return { status: 200, body: { success: true } }
}

export const upgradeBuilding: ControllerHandler = (req) => {
  const playerGameId = (req as any).playerGameId
  const clanId = parseInt(req.params.id as string, 10)
  const { buildingType, resourceType, amount } = req.body as ClanBuildingUpgradeRequest
  const result = clanService.upgradeClanBuilding(clanId, playerGameId, buildingType, resourceType, amount)
  if (!result.success) return { status: 400, body: { error: result.error } }
  return { status: 200, body: { success: true } }
}

export const contributeResource: ControllerHandler = (req) => {
  const playerGameId = (req as any).playerGameId
  const clanId = parseInt(req.params.id as string, 10)
  const { resourceType, amount } = req.body as ClanContributeResourceRequest
  const result = clanService.contributeClanResource(clanId, playerGameId, resourceType, amount)
  if (!result.success) return { status: 400, body: { error: result.error } }
  return { status: 200, body: { success: true } }
}

export const upgradeClanStat: ControllerHandler = (req) => {
  const playerGameId = (req as any).playerGameId
  const clanId = parseInt(req.params.id as string, 10)
  const { statType, amount } = req.body as ClanStatUpgradeRequest
  const result = clanService.upgradeClanStat(clanId, playerGameId, statType, amount)
  if (!result.success) return { status: 400, body: { error: result.error } }
  return { status: 200, body: { success: true } }
}

export const getActivationStatus: ControllerHandler = (req) => {
  const clanId = parseInt(req.params.id as string, 10)
  const result = clanService.isClanActivated(clanId)
  return { status: 200, body: result }
}

export const getUpkeep: ControllerHandler = (req) => {
  const playerGameId = (req as any).playerGameId
  const result = clanService.checkUpkeep(playerGameId)
  return { status: 200, body: result }
}

export const startWar: ControllerHandler = (req) => {
  const playerGameId = (req as any).playerGameId
  const clanId = parseInt(req.params.id as string, 10)
  const { targetClanId, armyToCommit } = req.body as ClanWarRequest
  const result = clanService.startClanWar(clanId, targetClanId, playerGameId, armyToCommit)
  if ('error' in result) return { status: 400, body: { error: result.error } }
  return { status: 200, body: result }
}

export const startPveBattle: ControllerHandler = (req) => {
  const playerGameId = (req as any).playerGameId
  const clanId = parseInt(req.params.id as string, 10)
  const { monsterId } = req.body as ClanPveStartRequest
  const result = clanService.startClanPveBattle(clanId, playerGameId, monsterId)
  if (!result.success) return { status: 400, body: { error: result.error } }
  return { status: 200, body: result.monster }
}

export const attackPveBattle: ControllerHandler = (req) => {
  const playerGameId = (req as any).playerGameId
  const clanId = parseInt(req.params.id as string, 10)
  const { soldierCount } = req.body as ClanPveAttackRequest
  const result = clanService.attackClanPveBattle(clanId, playerGameId, soldierCount)
  if ('error' in result) return { status: 400, body: { error: result.error } }
  return { status: 200, body: result }
}

export const pveStatus: ControllerHandler = (req) => {
  const playerGameId = (req as any).playerGameId
  const clanId = parseInt(req.params.id as string, 10)
  const result = clanService.getPveStatus(clanId, playerGameId)
  return { status: 200, body: result }
}

export const collectPveLoot: ControllerHandler = (req) => {
  const playerGameId = (req as any).playerGameId
  const clanId = parseInt(req.params.id as string, 10)
  const result = clanService.collectPveLoot(clanId, playerGameId)
  if ('error' in result) return { status: 400, body: { error: result.error } }
  return { status: 200, body: result }
}

/* ── Clan Management ── */

export const leave: ControllerHandler = (req) => {
  const playerGameId = (req as any).playerGameId
  const result = clanService.leaveClan(playerGameId)
  if (!result.success) return { status: 400, body: { error: result.error } }
  return { status: 200, body: { success: true } }
}

export const kick: ControllerHandler = (req) => {
  const playerGameId = (req as any).playerGameId
  const clanId = parseInt(req.params.id as string, 10)
  const { targetPlayerGameId } = req.body
  const result = clanService.kickMember(clanId, playerGameId, targetPlayerGameId)
  if (!result.success) return { status: 400, body: { error: result.error } }
  return { status: 200, body: { success: true } }
}

export const disband: ControllerHandler = (req) => {
  const playerGameId = (req as any).playerGameId
  const clanId = parseInt(req.params.id as string, 10)
  const result = clanService.disbandClan(clanId, playerGameId)
  if (!result.success) return { status: 400, body: { error: result.error } }
  return { status: 200, body: { success: true } }
}

export const promote: ControllerHandler = (req) => {
  const playerGameId = (req as any).playerGameId
  const clanId = parseInt(req.params.id as string, 10)
  const { targetPlayerGameId } = req.body
  const result = clanService.promoteMember(clanId, playerGameId, targetPlayerGameId)
  if (!result.success) return { status: 400, body: { error: result.error } }
  return { status: 200, body: { success: true } }
}

export const demote: ControllerHandler = (req) => {
  const playerGameId = (req as any).playerGameId
  const clanId = parseInt(req.params.id as string, 10)
  const { targetPlayerGameId } = req.body
  const result = clanService.demoteMember(clanId, playerGameId, targetPlayerGameId)
  if (!result.success) return { status: 400, body: { error: result.error } }
  return { status: 200, body: { success: true } }
}

export const transfer: ControllerHandler = (req) => {
  const playerGameId = (req as any).playerGameId
  const clanId = parseInt(req.params.id as string, 10)
  const { targetPlayerGameId } = req.body
  const result = clanService.transferOwnership(clanId, playerGameId, targetPlayerGameId)
  if (!result.success) return { status: 400, body: { error: result.error } }
  return { status: 200, body: { success: true } }
}

export const warHistory: ControllerHandler = (req) => {
  const clanId = parseInt(req.params.id as string, 10)
  const playerGameId = (req as any).playerGameId
  const result = clanService.getWarHistory(clanId, playerGameId)
  if ('error' in result) return { status: 403, body: { error: result.error } }
  return { status: 200, body: result }
}
