import { Router } from 'express'
import * as authController from './controllers/authController'
import * as playerGameController from './controllers/playerGameController'
import * as buildingController from './controllers/buildingController'
import * as battleController from './controllers/battleController'
import * as clanController from './controllers/clanController'

import { authMiddleware } from '../middleware/auth'
import { resourceTickMiddleware } from '../middleware/resourceTick'
import { gameOwnershipMiddleware } from '../middleware/gameOwnership'
import { errorHandler } from '../middleware/errorHandler'
import { wrap } from './utils/controller'
import { validate, validateQuery } from './validators/index'
import { validateRegister, validateLogin } from './validators/authValidation'
import { validatePveBattle } from './validators/battleValidation'
import { validateCreateClan, validateContributeCivilian, validateClanBuildingUpgrade, validateClanContributeResource, validateClanStatUpgrade, validateClanWar, validateClanPveStart, validateClanPveAttack, validateKickMember, validatePromoteMember, validateDemoteMember, validateTransferOwnership, validateSearchClans } from './validators/clanValidation'
import { validateCreateBuilding, validateUpgradeBuilding, validateConvertSoldiers, validateUpgradeStat, validatePvpBattle } from './validators/buildingValidation'

export const router = Router()

router.post('/auth/register', validate(validateRegister), wrap(authController.register))
router.post('/auth/login', validate(validateLogin), wrap(authController.login))

const authTickAndGame = [authMiddleware, gameOwnershipMiddleware, resourceTickMiddleware]

/* ── Game-scoped player-game routes ── */
router.get('/game/:gameId/player-game', authTickAndGame, wrap(playerGameController.getPlayerGame))
router.get('/game/:gameId/player-game/player', authTickAndGame, wrap(playerGameController.getPlayer))
router.get('/game/:gameId/player-game/resource', authTickAndGame, wrap(playerGameController.getResource))
router.get('/game/:gameId/player-game/buildings', authTickAndGame, wrap(playerGameController.getBuildings))

/* ── Game-scoped building routes ── */
router.post('/game/:gameId/buildings/create', authTickAndGame, validate(validateCreateBuilding), wrap(buildingController.build))
router.post('/game/:gameId/buildings/upgrade', authTickAndGame, validate(validateUpgradeBuilding), wrap(buildingController.upgrade))
router.post('/game/:gameId/buildings/convert', authTickAndGame, validate(validateConvertSoldiers), wrap(buildingController.convertSoldiers))
router.post('/game/:gameId/buildings/upgrade-stat', authTickAndGame, validate(validateUpgradeStat), wrap(buildingController.upgradeStat))

/* ── Game-scoped battle routes ── */
router.post('/game/:gameId/battle/player-pve', authTickAndGame, validate(validatePveBattle), wrap(battleController.startPve))
router.post('/game/:gameId/battle/pvp', authTickAndGame, validate(validatePvpBattle), wrap(battleController.startPvp))

/* ── Game-scoped clan routes ── */
router.post('/game/:gameId/clan/create', authTickAndGame, validate(validateCreateClan), wrap(clanController.create))
router.get('/game/:gameId/clan/upkeep', authTickAndGame, wrap(clanController.getUpkeep))
router.get('/game/:gameId/clan/search', authTickAndGame, validateQuery(validateSearchClans), wrap(clanController.searchClans))
router.get('/game/:gameId/clan/:id', authTickAndGame, wrap(clanController.getClan))
router.post('/game/:gameId/clan/join', authTickAndGame, wrap(clanController.join))
router.post('/game/:gameId/clan/:id/contribute', authTickAndGame, validate(validateContributeCivilian), wrap(clanController.contribute))
router.post('/game/:gameId/clan/:id/buildings/upgrade', authTickAndGame, validate(validateClanBuildingUpgrade), wrap(clanController.upgradeBuilding))
router.post('/game/:gameId/clan/:id/contribute-resource', authTickAndGame, validate(validateClanContributeResource), wrap(clanController.contributeResource))
router.post('/game/:gameId/clan/:id/upgrade-stat', authTickAndGame, validate(validateClanStatUpgrade), wrap(clanController.upgradeClanStat))
router.get('/game/:gameId/clan/:id/activation', authTickAndGame, wrap(clanController.getActivationStatus))
router.post('/game/:gameId/clan/:id/war', authTickAndGame, validate(validateClanWar), wrap(clanController.startWar))
router.post('/game/:gameId/clan/:id/pve/start', authTickAndGame, validate(validateClanPveStart), wrap(clanController.startPveBattle))
router.post('/game/:gameId/clan/:id/pve/attack', authTickAndGame, validate(validateClanPveAttack), wrap(clanController.attackPveBattle))
router.get('/game/:gameId/clan/:id/pve/status', authTickAndGame, wrap(clanController.pveStatus))
router.post('/game/:gameId/clan/:id/pve/collect', authTickAndGame, wrap(clanController.collectPveLoot))

/* ── Clan Management Routes ── */
router.post('/game/:gameId/clan/:id/leave', authTickAndGame, wrap(clanController.leave))
router.post('/game/:gameId/clan/:id/kick', authTickAndGame, validate(validateKickMember), wrap(clanController.kick))
router.post('/game/:gameId/clan/:id/disband', authTickAndGame, wrap(clanController.disband))
router.post('/game/:gameId/clan/:id/promote', authTickAndGame, validate(validatePromoteMember), wrap(clanController.promote))
router.post('/game/:gameId/clan/:id/demote', authTickAndGame, validate(validateDemoteMember), wrap(clanController.demote))
router.post('/game/:gameId/clan/:id/transfer', authTickAndGame, validate(validateTransferOwnership), wrap(clanController.transfer))
router.get('/game/:gameId/clan/:id/war-history', authTickAndGame, wrap(clanController.warHistory))

/* ── Monster config route (reads from config files, no DB dependency) ── */
router.get('/player-pve/monsters', authMiddleware, wrap(battleController.list))

/* ── PvP targets (auth only, no game scope needed) ── */
router.get('/pvp/targets', authMiddleware, wrap(battleController.getTargets))

router.use(errorHandler)
