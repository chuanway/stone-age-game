import { BaseEntity } from './base'

export interface Clan extends BaseEntity {
  ownerId: number
  gameId: number
  name: string
  clanAttackLevel: number
  clanDefenseLevel: number
  clanAttackProgress: number
  clanDefenseProgress: number
  lastAttackAt: string | null
  lastDefendedAt: string | null
}

export interface ClanArmouryStats {
  attackLevel: number
  defenseLevel: number
  attackUpdateProgress: number
  defenseUpdateProgress: number
}

export interface ClanMember extends BaseEntity {
  clanId: number
  playerGameId: number
  role: 'leader' | 'officer' | 'member'
  contributedCivilians: number
  clanEnergy: number
  clanMaxEnergy: number
  clanLastEnergyAt: string | null
}

export interface ClanMemberDetail extends ClanMember {
  username: string
  pveBattlesAttended: number
  pveDamageDealt: number
  pveSoldiersSpent: number
  warsParticipated: number
}

export interface ClanContributionRule {
  requiredCivilians: number
  deadlineDays: number
}

export interface ClanWarRecord {
  id: number
  attackerClanId: number
  defenderClanId: number
  roundsCommitted: number
  roundsWon: number
  roundsLost: number
  enslaved: number
  winnerClanId: number
  createdAt: string
}

/* ── Clan Config ── */

export interface ClanConfig {
  activationCap: number
  contributionRule: ClanContributionRule
}
