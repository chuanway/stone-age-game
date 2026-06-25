const BASE = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token')
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, { ...options, headers })
  if (!res.ok) {
    let message = 'Request failed'
    try {
      const body = await res.json()
      message = body.error || message
    } catch {
      message = await res.text().catch(() => message)
    }
    throw new Error(message)
  }
  return res.json()
}

function gamePath(gameId: number, sub: string): string {
  return `/game/${gameId}/player-game${sub}`
}

function gameBuildPath(gameId: number, sub: string): string {
  return `/game/${gameId}/buildings${sub}`
}

function gameBattlePath(gameId: number, sub: string): string {
  return `/game/${gameId}/battle${sub}`
}

function gameClanPath(gameId: number, sub: string): string {
  return `/game/${gameId}/clan${sub}`
}

export const api = {
  auth: {
    register: (username: string, password: string) =>
      request<import('shared').AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify({ username, password }) }),
    login: (username: string, password: string) =>
      request<import('shared').AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  },
  playerGame: {
    get: (gameId: number) =>
      request<import('shared').PlayerGameResponse>(gamePath(gameId, '')),
    getPlayer: (gameId: number) =>
      request<import('shared').PlayerProfileResponse>(gamePath(gameId, '/player')),
    getResource: (gameId: number) =>
      request<import('shared').PlayerResourceResponse>(gamePath(gameId, '/resource')),
    getBuildings: (gameId: number) =>
      request<import('shared').PlayerBuildingsResponse>(gamePath(gameId, '/buildings')),
  },
  buildings: {
    create: (gameId: number, buildingType: import('shared').BuildingType) =>
      request<import('shared').PlayerBuildingCreateResponse>(gameBuildPath(gameId, '/create'), { method: 'POST', body: JSON.stringify({ buildingType }) }),
    upgrade: (gameId: number, buildingType: import('shared').BuildingType) =>
      request<import('shared').PlayerBuildingUpgradeResponse>(gameBuildPath(gameId, '/upgrade'), { method: 'POST', body: JSON.stringify({ buildingType }) }),
    convert: (gameId: number, amount: number) =>
      request<import('shared').PlayerConvertSoldiersResponse>(gameBuildPath(gameId, '/convert'), { method: 'POST', body: JSON.stringify({ amount }) }),
    upgradeStat: (gameId: number, stat: import('shared').StatType) =>
      request<import('shared').PlayerStatUpgradeResponse>(gameBuildPath(gameId, '/upgrade-stat'), { method: 'POST', body: JSON.stringify({ stat }) }),
  },
  playerBattle: {
    playerPve: (gameId: number, monsterId: string, rounds: number, strategyType: import('shared').BattleStrategyType) =>
      request<import('shared').PlayerPvEBattleResponse>(gameBattlePath(gameId, '/player-pve'), { method: 'POST', body: JSON.stringify({ monsterId, rounds, strategyType }) }),
    pvp: (gameId: number, targetId: number, armyToCommit: number) =>
      request<import('shared').PvPBattleResponse>(gameBattlePath(gameId, '/pvp'), { method: 'POST', body: JSON.stringify({ targetId, armyToCommit }) }),
    pvpTargets: () => request<import('shared').PvpTargetsResponse>('/pvp/targets'),
  },
  clan: {
    create: (gameId: number, name: string) =>
      request<import('shared').Clan>(gameClanPath(gameId, '/create'), { method: 'POST', body: JSON.stringify({ name }) }),
    get: (gameId: number, id: number) => request<import('shared').ClanResponse>(gameClanPath(gameId, `/${id}`)),
    search: (gameId: number, name: string) => request<{ clan: import('shared').Clan; memberCount: number; activated: boolean }[]>(gameClanPath(gameId, `/search?name=${encodeURIComponent(name)}`)),
    join: (gameId: number, clanId: number) =>
      request<import('shared').JoinClanResponse>(gameClanPath(gameId, '/join'), { method: 'POST', body: JSON.stringify({ clanId }) }),
    contribute: (gameId: number, clanId: number, amount: number) =>
      request<import('shared').ContributeResponse>(gameClanPath(gameId, `/${clanId}/contribute`), { method: 'POST', body: JSON.stringify({ amount }) }),
    upgradeBuilding: (gameId: number, clanId: number, buildingType: import('shared').BuildingType, resourceType: import('shared').ResourceType, amount: number) =>
      request<import('shared').ClanBuildingUpgradeResponse>(gameClanPath(gameId, `/${clanId}/buildings/upgrade`), { method: 'POST', body: JSON.stringify({ buildingType, resourceType, amount }) }),
    contributeResource: (gameId: number, clanId: number, resourceType: import('shared').ResourceType, amount: number) =>
      request<import('shared').ClanContributeResourceResponse>(gameClanPath(gameId, `/${clanId}/contribute-resource`), { method: 'POST', body: JSON.stringify({ resourceType, amount }) }),
    upgradeStat: (gameId: number, clanId: number, statType: import('shared').StatType, amount: number) =>
      request<import('shared').ClanStatUpgradeResponse>(gameClanPath(gameId, `/${clanId}/upgrade-stat`), { method: 'POST', body: JSON.stringify({ statType, amount }) }),
    activation: (gameId: number, clanId: number) =>
      request<import('shared').ClanActivationResponse>(gameClanPath(gameId, `/${clanId}/activation`)),
    upkeep: (gameId: number) => request<import('shared').ClanUpkeepResponse>(gameClanPath(gameId, '/upkeep')),
    war: (gameId: number, clanId: number, targetClanId: number, armyToCommit: number) =>
      request<import('shared').ClanWarResponse>(gameClanPath(gameId, `/${clanId}/war`), { method: 'POST', body: JSON.stringify({ targetClanId, armyToCommit }) }),
    pveStart: (gameId: number, clanId: number, monsterId: string) =>
      request<import('shared').ClanPveMonster>(gameClanPath(gameId, `/${clanId}/pve/start`), { method: 'POST', body: JSON.stringify({ monsterId }) }),
    pveAttack: (gameId: number, clanId: number, soldierCount: number) =>
      request<import('shared').ClanPveAttackResponse>(gameClanPath(gameId, `/${clanId}/pve/attack`), { method: 'POST', body: JSON.stringify({ soldierCount }) }),
    pveStatus: (gameId: number, clanId: number) =>
      request<import('shared').ClanPveStatusResponse>(gameClanPath(gameId, `/${clanId}/pve/status`)),
    pveCollect: (gameId: number, clanId: number) =>
      request<import('shared').ClanPveCollectLootResponse>(gameClanPath(gameId, `/${clanId}/pve/collect`), { method: 'POST' }),
    leave: (gameId: number, clanId: number) =>
      request<import('shared').ApiResponse>(gameClanPath(gameId, `/${clanId}/leave`), { method: 'POST' }),
    kick: (gameId: number, clanId: number, targetPlayerGameId: number) =>
      request<import('shared').ApiResponse>(gameClanPath(gameId, `/${clanId}/kick`), { method: 'POST', body: JSON.stringify({ targetPlayerGameId }) }),
    disband: (gameId: number, clanId: number) =>
      request<import('shared').ApiResponse>(gameClanPath(gameId, `/${clanId}/disband`), { method: 'POST' }),
    promote: (gameId: number, clanId: number, targetPlayerGameId: number) =>
      request<import('shared').ApiResponse>(gameClanPath(gameId, `/${clanId}/promote`), { method: 'POST', body: JSON.stringify({ targetPlayerGameId }) }),
    demote: (gameId: number, clanId: number, targetPlayerGameId: number) =>
      request<import('shared').ApiResponse>(gameClanPath(gameId, `/${clanId}/demote`), { method: 'POST', body: JSON.stringify({ targetPlayerGameId }) }),
    transfer: (gameId: number, clanId: number, targetPlayerGameId: number) =>
      request<import('shared').ApiResponse>(gameClanPath(gameId, `/${clanId}/transfer`), { method: 'POST', body: JSON.stringify({ targetPlayerGameId }) }),
    warHistory: (gameId: number, clanId: number) =>
      request<import('shared').ClanWarHistoryResponse>(gameClanPath(gameId, `/${clanId}/war-history`)),
  },
  monsters: {
    list: () => request<import('shared').MonsterConfig[]>('/player-pve/monsters'),
  },
}
