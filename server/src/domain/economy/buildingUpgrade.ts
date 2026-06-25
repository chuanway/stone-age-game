import { BuildingConfig } from 'shared'
import { computeCost } from './costCalculator'

export function getUpgradeCost(config: BuildingConfig, currentLevel: number): Record<string, number> {
  const costs: Record<string, number> = {}
  for (const [resource, costDef] of Object.entries(config.upgradeCosts)) {
    costs[resource] = computeCost(costDef.base, costDef.multiplier, currentLevel)
  }
  return costs
}

export function canAffordUpgrade(
  resources: Record<string, number>,
  cost: Record<string, number>
): boolean {
  for (const [resource, amount] of Object.entries(cost)) {
    if ((resources[resource] ?? 0) < amount) return false
  }
  return true
}

export function deductCost(
  resources: Record<string, number>,
  cost: Record<string, number>
): Record<string, number> {
  const result = { ...resources }
  for (const [resource, amount] of Object.entries(cost)) {
    result[resource] = (result[resource] ?? 0) - amount
  }
  return result
}
