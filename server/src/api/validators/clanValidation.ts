export function validateCreateClan(body: any): string | null {
  if (!body.name || typeof body.name !== 'string') return 'Clan name is required'
  if (body.name.length < 2) return 'Clan name must be at least 2 characters'
  return null
}

export function validateContributeCivilian(body: any): string | null {
  if (!body.amount || body.amount < 1) return 'Amount must be at least 1'
  return null
}

export function validateClanBuildingUpgrade(body: any): string | null {
  if (!body.buildingType) return 'Building type is required'
  if (!body.resourceType) return 'Resource type is required'
  if (!body.amount) return 'Amount is required'
  return null
}

export function validateClanContributeResource(body: any): string | null {
  if (!body.resourceType) return 'Resource type is required'
  if (!body.amount) return 'Amount is required'
  return null
}

export function validateClanStatUpgrade(body: any): string | null {
  if (!body.statType || (body.statType !== 'attack' && body.statType !== 'defense')) return 'Stat type must be "attack" or "defense"'
  if (!body.amount || body.amount < 1) return 'Amount must be at least 1'
  return null
}

export function validateClanWar(body: any): string | null {
  if (!body.targetClanId) return 'Target clan ID is required'
  if (!body.armyToCommit || body.armyToCommit < 1) return 'Army to commit must be at least 1'
  return null
}

export function validateClanPveStart(body: any): string | null {
  if (!body.monsterId) return 'Monster ID is required'
  return null
}

export function validateClanPveAttack(body: any): string | null {
  if (!body.soldierCount || body.soldierCount < 1) return 'Soldier count must be at least 1'
  return null
}

export function validateKickMember(body: any): string | null {
  if (!body.targetPlayerGameId) return 'Target player ID is required'
  return null
}

export function validatePromoteMember(body: any): string | null {
  if (!body.targetPlayerGameId) return 'Target player ID is required'
  return null
}

export function validateDemoteMember(body: any): string | null {
  if (!body.targetPlayerGameId) return 'Target player ID is required'
  return null
}

export function validateTransferOwnership(body: any): string | null {
  if (!body.targetPlayerGameId) return 'Target player ID is required'
  return null
}

export function validateSearchClans(query: any): string | null {
  if (!query.name || typeof query.name !== 'string' || !query.name.trim()) return 'Clan name is required'
  return null
}
