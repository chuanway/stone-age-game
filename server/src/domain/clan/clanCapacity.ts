export interface ClanBuildingCapacityInput {
  type: string
  level: number
}

export interface ClanBuildingCapacityConfig {
  baseCapacity?: number
  capacityUpgradePerLevel?: number
}

export function calculateClanCapacity(
  buildings: ClanBuildingCapacityInput[],
  configs: Record<string, ClanBuildingCapacityConfig>
): { food: number; wood: number; metal: number } {
  const getLevel = (type: string) => buildings.find(b => b.type === type)?.level ?? 1
  const calcCap = (type: string) => {
    const cfg = configs[type]
    const base = cfg?.baseCapacity ?? 0
    const perLvl = cfg?.capacityUpgradePerLevel ?? 0
    return base + perLvl * getLevel(type)
  }
  return {
    food: calcCap('farm'),
    wood: calcCap('lumberjackHut'),
    metal: calcCap('mine'),
  }
}
