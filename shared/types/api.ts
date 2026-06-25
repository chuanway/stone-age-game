import { Player, PlayerGame, PlayerResource } from './player'
import { PlayerBuilding, PlayerBuildableBuilding, ClanBuilding } from './building'
import { Clan, ClanMember, ClanMemberDetail, ClanWarRecord } from './clan'
import { ClanPveMonster } from './monster'
import { BattleTotalResult, BattleStrategyType, PvpTarget } from './battle'
import { ResourceDelta, ApiResponse, ErrorResponse, ResourceType, StatType } from './base'
import { BuildingType } from './building'
import { MonsterConfig } from './monster'

/* ── Auth ── */
export interface RegisterRequest {
  username: string
  password: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface AuthResponse {
  token: string
  player: Player
  clanId?: number | null
}

/* ── Player ── */
export interface PlayerProfileResponse {
  player: Player
}

export interface PlayerGameResponse {
  playerGame: PlayerGame
  tickIntervalMs: number
  serverRemainingMs: number
  clanId?: number | null
}

export interface PlayerResourceResponse {
  resource: PlayerResource
}

export interface PlayerBuildingsResponse {
  buildings: PlayerBuilding[]
  buildable: PlayerBuildableBuilding[]
  productionRates: ResourceDelta
}

/* ── Player PvE Battle ── */
export interface PlayerPvEBattleRequest {
  monsterId: MonsterConfig['id']
  rounds: number
  strategyType: BattleStrategyType
}

export interface PlayerPvEBattleResponse extends BattleTotalResult {
  monsterName: MonsterConfig['name']
  monsterId: MonsterConfig['id']
}

/* ── PvP Battle ── */
export interface PvPBattleRequest {
  targetId: number
  armyToCommit: number
}

export interface PvPBattleResponse {
  success: boolean
  bracket: string
  targetName?: string
  civiliansEnslaved: number
  armyLost: number
}

/* ── PvP Targets ── */
export interface PvpTargetsResponse {
  targets: PvpTarget[]
}

/* ── Player Buildings ── */
export interface PlayerBuildingCreateRequest {
  buildingType: BuildingType
}

export interface PlayerBuildingUpgradeRequest {
  buildingType: BuildingType
}

export interface PlayerBuildingUpgradeResponse extends ApiResponse {}

export interface PlayerBuildingCreateResponse extends ApiResponse {}

export interface PlayerConvertSoldiersRequest {
  amount: number
}

export interface PlayerConvertSoldiersResponse extends ApiResponse {}

export interface PlayerStatUpgradeRequest {
  stat: StatType
}

export interface PlayerStatUpgradeResponse extends ApiResponse {}

/* ── Clan ── */
export interface CreateClanRequest {
  name: string
}

export interface ClanResponse {
  clan: Clan
  members: ClanMemberDetail[]
  buildings: ClanBuilding[]
  viewerRole?: ClanMember['role']
}

export interface JoinClanRequest {
  clanId: number
}

export interface JoinClanResponse extends ApiResponse {}

export interface ClanContributeCivilianRequest {
  amount: number
}

export interface ClanContributeCivilianResponse extends ApiResponse {}

export interface ClanBuildingUpgradeRequest {
  buildingType: BuildingType
  resourceType: ResourceType
  amount: number
}

export interface ClanBuildingUpgradeResponse extends ApiResponse {}

export interface ClanContributeResourceRequest {
  resourceType: ResourceType
  amount: number
}

export interface ClanContributeResourceResponse extends ApiResponse {}

export interface ClanStatUpgradeRequest {
  statType: StatType
  amount: number
}

export interface ClanStatUpgradeResponse extends ApiResponse {}

export interface ClanWarActivationResponse {
  activated: boolean
}

export interface ClanCivilianUpkeepResponse {
  met: boolean
  message: string
}

export interface ClanWarRequest {
  targetClanId: number
  armyToCommit: number
}

export interface ClanWarResponse {
  result: BattleTotalResult
  warId: number
  enslavement: { enslaved: number; winnerClanId: number; loserClanId: number }
}

export interface ClanWarHistoryResponse {
  wars: ClanWarRecord[]
  clanNames: Record<string, string>
}

/* ── Clan PvE ── */
export interface ClanPveStartRequest {
  monsterId: MonsterConfig['id']
}

export interface ClanPveAttackRequest {
  soldierCount: number
}

export interface ClanPveStatusResponse {
  active: boolean
  monster?: ClanPveMonster
}

export interface ClanPveAttackResponse {
  damageDealt: number
  remainingHp: number
  monsterDefeated: boolean
}

export interface ClanPveCollectLootResponse extends ApiResponse {
  loot: Record<string, number> | null
}
