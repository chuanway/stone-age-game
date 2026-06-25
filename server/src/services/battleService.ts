import { MonsterConfig, BattleTotalResult, BattleStrategyType, VARConfig, SARConfig, BattleUnit, BattleConfig, PvPBracketConfig, PlayerPvEBattleResponse, PvPBattleResponse, ErrorResponse, PvpTargetsResponse } from 'shared'
import * as playerResourceRepo from '../data/repositories/playerResourceRepo'
import * as gamePlayerRepo from '../data/repositories/gamePlayerRepo'
import * as playerRepo from '../data/repositories/playerRepo'
import * as playerPveBattleRepo from '../data/repositories/playerPveBattleRepo'
import { loadMonstersConfig, loadBattleConfig } from '../config/configLoader'
import { createStrategy } from '../domain/battle/strategyFactory'
import { resolveMultiRound } from '../domain/battle/roundResolver'
import { classifyBracket } from '../domain/battle/bracketAdjuster'
import { calculateEnslavement } from '../domain/clan/enslavementCalc'
import { filterVisibleTargets } from '../domain/pvp/visibilityFilter'

export function startPveBattle(
  playerGameId: number,
  monsterId: string,
  rounds: number,
  strategyType: BattleStrategyType,
): PlayerPvEBattleResponse | { error: string } {
  const monstersConfig = loadMonstersConfig()
  const monster = monstersConfig.monsters.find(m => m.id === monsterId)
  if (!monster) return { error: 'Unknown monster' }

  const battleConfig = loadBattleConfig()
  const strategyConfig = battleConfig.battleStrategy.calculationType[strategyType] as VARConfig | SARConfig
  if (!strategyConfig) return { error: 'Unknown strategy type' }

  const resource = playerResourceRepo.findByPlayerGameId(playerGameId)!
  const pg = gamePlayerRepo.findById(playerGameId)!
  const army = rounds * monster.minArmyPerRound

  const defender: BattleUnit = {
    armySize: monster.minArmyPerRound,
    attackStat: monster.attack,
    defenseStat: monster.defense,
  }

  const attacker: BattleUnit = {
    armySize: army,
    attackStat: pg.attackStat,
    defenseStat: pg.defenseStat,
  }

  const strategy = createStrategy(strategyType, strategyConfig)
  const result = resolveMultiRound(strategy, attacker, defender, rounds, monster.minArmyPerRound, monster.loot)

  playerResourceRepo.update(resource.id, {
    food: resource.food + (result.loot.food ?? 0),
    wood: resource.wood + (result.loot.wood ?? 0),
    metal: resource.metal + (result.loot.metal ?? 0),
    soldiers: Math.max(0, resource.soldiers - army),
  })

  playerPveBattleRepo.insertBattle(
    playerGameId, monster.id, rounds, result.roundsWon,
    army, result.survivors, result.loot
  )

  return { ...result, monsterName: monster.name, monsterId: monster.id }
}

export function startPvPBattle(
  playerGameId: number,
  targetId: number,
  gameId: number,
  armyToCommit: number,
): PvPBattleResponse | ErrorResponse {
  const battleConfig = loadBattleConfig()

  const resource = playerResourceRepo.findByPlayerGameId(playerGameId)!
  const pg = gamePlayerRepo.findById(playerGameId)!
  const target = playerRepo.findPlayerById(targetId)

  if (!target) return { error: 'Target not found' }
  if (resource.soldiers < armyToCommit) return { error: 'Not enough soldiers' }

  const targetPg = gamePlayerRepo.findByPlayerAndGame(targetId, gameId)
  if (!targetPg) return { error: 'Target not found' }
  const targetResource = playerResourceRepo.findByPlayerGameId(targetPg.id)
  if (!targetResource) return { error: 'Target not found' }

  const playerPop = resource.civilians + resource.soldiers
  const targetPop = targetResource.civilians + targetResource.soldiers

  const pvpPopulationBracketInfo = battleConfig.battleStrategy.pvpPopulationBracket;
  const bracket = classifyBracket(playerPop, targetPop, pvpPopulationBracketInfo)

  const strategyType = battleConfig.activeStrategy
  const baseConfig = battleConfig.battleStrategy.calculationType[strategyType] as VARConfig | SARConfig
  const strategyConfig = { ...baseConfig, varChance: bracket.varChanceMultiplier } as VARConfig | SARConfig
  const strategy = createStrategy(strategyType, strategyConfig)

  const defender: BattleUnit = {
    armySize: targetResource.soldiers,
    attackStat: pg.defenseStat,
    defenseStat: pg.defenseStat,
  }

  const attacker: BattleUnit = {
    armySize: armyToCommit,
    attackStat: pg.attackStat,
    defenseStat: pg.defenseStat,
  }

  const roundResult = strategy.resolveBattleRound(attacker, defender)
  const attackerWon = !!roundResult.success

  const playerPvp = battleConfig.playerPvp
  let civiliansEnslaved = 0

  if (attackerWon) {
    const result = calculateEnslavement(
      targetResource.civilians,
      playerPvp.enslavementMin,
      playerPvp.enslavementMax,
      playerPvp.minimumPopulationProtection,
    )
    civiliansEnslaved = result.enslaved
    playerResourceRepo.update(resource.id, {
      civilians: resource.civilians + result.enslaved,
    })
    playerResourceRepo.update(targetResource.id, {
      civilians: Math.max(0, targetResource.civilians - result.actualDeduction),
    })
  } else {
    const lowerPop = Math.min(resource.civilians, targetResource.civilians)
    const result = calculateEnslavement(
      lowerPop,
      playerPvp.enslavementMin,
      playerPvp.enslavementMax,
      playerPvp.minimumPopulationProtection,
    )
    civiliansEnslaved = result.enslaved
    if (resource.civilians < targetResource.civilians) {
      playerResourceRepo.update(resource.id, {
        civilians: Math.max(playerPvp.minimumPopulationProtection, resource.civilians - result.actualDeduction),
      })
      playerResourceRepo.update(targetResource.id, {
        civilians: targetResource.civilians + result.enslaved,
      })
    } else {
      playerResourceRepo.update(targetResource.id, {
        civilians: Math.max(playerPvp.minimumPopulationProtection, targetResource.civilians - result.actualDeduction),
      })
      playerResourceRepo.update(resource.id, {
        civilians: resource.civilians + result.enslaved,
      })
    }
  }

  playerResourceRepo.update(resource.id, { soldiers: Math.max(0, resource.soldiers - armyToCommit) })

  return {
    success: attackerWon,
    bracket: bracket.bracket,
    targetName: target.username,
    civiliansEnslaved,
    armyLost: armyToCommit,
  }
}

export function getMonsters(): MonsterConfig[] {
  return loadMonstersConfig().monsters
}

export function getTargets(): PvpTargetsResponse {
  const battleConfig = loadBattleConfig()
  const visibilityThreshold = battleConfig.playerPvp.pvpVisibilityThreshold
  const allPlayers = playerResourceRepo.findAll()
  const targets = filterVisibleTargets(allPlayers, visibilityThreshold)
  return { targets }
}
