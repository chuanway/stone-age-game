export interface LootRange {
  min: number
  max: number
}

export interface LootTable {
  food?: LootRange
  wood?: LootRange
  metal?: LootRange
  civilians?: LootRange
}

/* ── Monster Config ── */

export interface MonsterConfig {
  id: string
  name: string
  minArmyPerRound: number
  attack: number
  defense: number
  loot: LootTable
}

export interface MonstersConfig {
  monsters: MonsterConfig[]
}

/* ── Clan PvE Monster Instance ── */

export interface ClanPveMonster {
  id: number
  monsterId: string
  monsterName?: string
  totalHp: number
  currentHp: number
  state: string
  lootPerMember: Record<string, number>
  participants: number
  collected: number[]
}
