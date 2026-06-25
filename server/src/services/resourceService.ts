import { ResourceDelta, BuildingConfig, PlayerResourceResponse, ClanBuildingConfig } from 'shared'
import * as gamePlayerRepo from '../data/repositories/gamePlayerRepo'
import * as playerResourceRepo from '../data/repositories/playerResourceRepo'
import * as buildingRepo from '../data/repositories/buildingRepo'
import * as clanRepo from '../data/repositories/clanRepo'
import * as clanResourceRepo from '../data/repositories/clanResourceRepo'
import * as clanBuildingRepo from '../data/repositories/clanBuildingRepo'
import { calculateProduction, computeTickProgress } from '../domain/economy/resourceTick'
import { calculateClanProduction } from '../domain/clan/clanProduction'
import { calculateClanEnergy, calculateEnergyTickElapsed } from '../domain/clan/clanEnergy'
import { calculateClanCapacity } from '../domain/clan/clanCapacity'
import { loadBuildingsConfig, loadGameConfig } from '../config/configLoader'
import { nowDate, parseDate } from '../utils/date'

export function getResourceData(playerGameId: number): PlayerResourceResponse {
  const resource = playerResourceRepo.findByPlayerGameId(playerGameId)!
  return { resource }
}

function applyClanEnergyRegen(playerGameId: number): void {
  const member = clanRepo.findMemberByPlayerGameId(playerGameId)
  if (!member) return

  const maxEnergy = member.clanMaxEnergy
  const currentEnergy = member.clanEnergy

  const lastEnergyAt = member.clanLastEnergyAt ? parseDate(member.clanLastEnergyAt) : nowDate()
  const now = nowDate()
  const elapsedMs = now.getTime() - lastEnergyAt.getTime()

  const gameConfig = loadGameConfig()
  const tickIntervalMs = gameConfig.resourceTickIntervalMs

  const newEnergy = calculateClanEnergy(currentEnergy, maxEnergy, elapsedMs, tickIntervalMs)
  if (newEnergy === currentEnergy) return

  const tickElapsedMs = calculateEnergyTickElapsed(elapsedMs, tickIntervalMs)
  const nextEnergyAt = new Date(lastEnergyAt.getTime() + tickElapsedMs)

  clanRepo.updateClanEnergy(member.id, newEnergy, nextEnergyAt.toISOString())
}

function applyClanProductionTick(playerGameId: number): void {
  const member = clanRepo.findMemberByPlayerGameId(playerGameId)
  if (!member) return

  const clanRes = clanResourceRepo.findByClanId(member.clanId)
  if (!clanRes) return

  const lastTick = clanRes.lastProductionTickAt ? parseDate(clanRes.lastProductionTickAt) : nowDate()
  const now = nowDate()
  const elapsedMs = now.getTime() - lastTick.getTime()
  if (elapsedMs <= 0) return

  const gameConfig = loadGameConfig()
  const tickIntervalMs = gameConfig.resourceTickIntervalMs
  const { fullIntervals } = computeTickProgress(elapsedMs, tickIntervalMs)
  if (fullIntervals === 0) return

  const clanBuildings = clanBuildingRepo.findClanBuildings(member.clanId)
  const buildingsConfig = loadBuildingsConfig()
  const clanBuildingConfigs = buildingsConfig.clan

  const productionInputs = clanBuildings.map(b => {
    const cfg = clanBuildingConfigs[b.type] as ClanBuildingConfig | undefined
    return {
      type: b.type,
      level: b.level,
      config: {
        productionRatePerLevel: cfg?.productionRatePerLevel,
        populationRequirement: cfg?.populationRequirement,
      },
    }
  })

  const totalProduction = calculateClanProduction(clanRes.civilians, productionInputs)
  const foodProd = totalProduction.food * fullIntervals
  const woodProd = totalProduction.wood * fullIntervals
  const metalProd = totalProduction.metal * fullIntervals

  const playerResource = playerResourceRepo.findByPlayerGameId(playerGameId)
  if (playerResource) {
    playerResourceRepo.update(playerResource.id, {
      food: playerResource.food + foodProd,
      wood: playerResource.wood + woodProd,
      metal: playerResource.metal + metalProd,
    })
  }

  const cap = calculateClanCapacity(clanBuildings, clanBuildingConfigs)

  clanResourceRepo.update(clanRes.id, {
    food: Math.min(cap.food, clanRes.food + foodProd),
    wood: Math.min(cap.wood, clanRes.wood + woodProd),
    metal: Math.min(cap.metal, clanRes.metal + metalProd),
  })

  const tickElapsedMs = fullIntervals * tickIntervalMs
  const nextTickAt = new Date(lastTick.getTime() + tickElapsedMs)
  clanResourceRepo.updateTickAt(clanRes.id, nextTickAt.toISOString())
}

export function applyTick(playerGameId: number): void {
  const pg = gamePlayerRepo.findById(playerGameId)
  if (!pg) return

  const buildings = buildingRepo.findBuildingsByPlayerGameId(playerGameId)
  const resource = playerResourceRepo.findByPlayerGameId(playerGameId)!
  const lastTick = parseDate(pg.lastTickAt)
  const now = nowDate()
  const elapsedMs = now.getTime() - lastTick.getTime()

  if (elapsedMs <= 0) return

  const buildingConfigs = loadBuildingsConfig()
  const gameConfig = loadGameConfig()
  const tickIntervalMs = gameConfig.resourceTickIntervalMs

  const { fullIntervals } = computeTickProgress(elapsedMs, tickIntervalMs)
  if (fullIntervals === 0) return

  const delta = calculateProduction(buildings, resource.civilians, buildingConfigs as unknown as Record<string, BuildingConfig>, fullIntervals)

  const tickElapsedMs = fullIntervals * tickIntervalMs
  const nextTickAt = new Date(lastTick.getTime() + tickElapsedMs)

  playerResourceRepo.update(resource.id, {
    food: resource.food + delta.food,
    wood: resource.wood + delta.wood,
    metal: resource.metal + delta.metal,
    civilians: resource.civilians + delta.civilians,
  })

  gamePlayerRepo.updateLastTickAt(playerGameId, nextTickAt.toISOString())

  applyClanEnergyRegen(playerGameId)
  applyClanProductionTick(playerGameId)
}
