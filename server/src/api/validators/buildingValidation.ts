export function validateCreateBuilding(body: any): string | null {
  if (!body.buildingType || typeof body.buildingType !== 'string') return 'Building type is required'
  return null
}

export function validateUpgradeBuilding(body: any): string | null {
  if (!body.buildingType || typeof body.buildingType !== 'string') return 'Building type is required'
  return null
}

export function validateConvertSoldiers(body: any): string | null {
  if (!body.amount || body.amount < 1) return 'Amount must be at least 1'
  return null
}

export function validateUpgradeStat(body: any): string | null {
  if (!body.stat || (body.stat !== 'attack' && body.stat !== 'defense')) return 'Stat must be "attack" or "defense"'
  return null
}

export function validatePvpBattle(body: any): string | null {
  if (!body.targetId || body.targetId < 1) return 'Target ID is required'
  if (!body.armyToCommit || body.armyToCommit < 1) return 'Army to commit must be at least 1'
  return null
}
