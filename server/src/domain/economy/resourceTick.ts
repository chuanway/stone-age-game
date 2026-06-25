import { ResourceDelta, PlayerBuilding, BuildingConfig } from 'shared'

export function computeTickProgress(
  elapsedMs: number,
  tickIntervalMs: number
): { fullIntervals: number; remainderMs: number } {
  const fullIntervals = Math.floor(elapsedMs / tickIntervalMs)
  const remainderMs = elapsedMs % tickIntervalMs
  return { fullIntervals, remainderMs }
}

export function calculateProduction(
  buildings: PlayerBuilding[],
  civilians: number,
  buildingConfigs: Record<string, BuildingConfig>,
  intervals: number
): ResourceDelta {
  const delta: ResourceDelta = { food: 0, wood: 0, metal: 0, civilians: 0, soldiers: 0 }

  for (const building of buildings) {
    const config = buildingConfigs[building.type]
    if (!config || !config.produces) continue

    const threshold = config.operationalThreshold
    if (threshold !== null && civilians < threshold) continue

    const rate = (config.productionRatePerLevel ?? 0) * building.level
    const resource = config.produces as keyof ResourceDelta
    delta[resource] += rate * intervals
  }

  return delta
}
