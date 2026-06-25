import { dbRun } from '../database'

export function insertBattle(
  playerGameId: number,
  monsterId: string,
  roundsCommitted: number,
  roundsWon: number,
  armyCommitted: number,
  armySurvived: number,
  loot: Record<string, number>
): void {
  dbRun(
    `INSERT INTO player_pve_battles
     (player_game_id, monster_id, rounds_committed, rounds_won, army_committed, army_survived,
      food_loot, wood_loot, metal_loot, pop_loot)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      playerGameId, monsterId, roundsCommitted, roundsWon, armyCommitted, armySurvived,
      loot.food || 0, loot.wood || 0, loot.metal || 0, loot.civilians || 0
    ]
  )
}
