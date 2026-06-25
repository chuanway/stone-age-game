export interface PopulationRequirement {
  base: number
  multiplier: number
}

export function getPopulationRequirement(
  requirement: PopulationRequirement,
  level: number
): number {
  return Math.round(requirement.base * Math.pow(requirement.multiplier, level - 1))
}

export interface ClanBuildingProductionInput {
  type: string
  level: number
  config: {
    productionRatePerLevel?: number
    populationRequirement?: PopulationRequirement
  }
}

export function calculateClanProduction(
  clanCivilians: number,
  buildings: ClanBuildingProductionInput[]
): { food: number; wood: number; metal: number } {
  const result = { food: 0, wood: 0, metal: 0 }

  for (const building of buildings) {
    const req = building.config.populationRequirement
    if (req) {
      const required = getPopulationRequirement(req, building.level)
      if (clanCivilians < required) continue
    }

    const rate = building.config.productionRatePerLevel ?? 0
    const production = rate * building.level
    const type = building.type

    if (type === 'farm') result.food += production
    else if (type === 'lumberjackHut') result.wood += production
    else if (type === 'mine') result.metal += production
  }

  return result
}
