import { BuildingConfig, ResourceDelta, PlayerBuilding } from 'shared'

export function calculateProductionRates(
  buildings: PlayerBuilding[],
  civilians: number,
  buildingConfigs: Record<string, BuildingConfig>
): ResourceDelta {
  const rates: ResourceDelta = { food: 0, wood: 0, metal: 0, civilians: 0, soldiers: 0 }

  for (const building of buildings) {
    const config = buildingConfigs[building.type]
    if (!config || !config.produces) continue

    const threshold = config.operationalThreshold
    if (threshold !== null && civilians < threshold) continue

    const resource = config.produces as keyof ResourceDelta
    if (!(resource in rates)) continue

    const rate = (config.productionRatePerLevel ?? 0) * building.level
    rates[resource] += rate
  }

  return rates
}
