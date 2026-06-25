import { dbAll, dbRun } from '../database'

export function insertClanWar(
  attackerClanId: number,
  defenderClanId: number,
  attackerArmy: number,
  defenderArmy: number,
  roundsCommitted: number,
  roundsWon: number,
  roundsLost: number,
  enslaved: number,
  winnerClanId: number
): number {
  const result = dbRun(
    `INSERT INTO clan_wars (attacker_clan_id, defender_clan_id, attacker_army, defender_army,
      rounds_committed, rounds_won, rounds_lost, enslaved, winner_clan_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    [attackerClanId, defenderClanId, attackerArmy, defenderArmy, roundsCommitted, roundsWon, roundsLost, enslaved, winnerClanId]
  )
  return result.lastInsertRowid as number
}

export function insertWarParticipants(warId: number, participantIds: number[]): void {
  for (const pid of participantIds) {
    dbRun(
      'INSERT OR IGNORE INTO clan_war_participants (war_id, player_game_id) VALUES (?, ?)',
      [warId, pid]
    )
  }
}

export function getWarHistory(clanId: number): { id: number; attackerClanId: number; defenderClanId: number; roundsCommitted: number; roundsWon: number; roundsLost: number; enslaved: number; winnerClanId: number; createdAt: string }[] {
  const rows = dbAll(
    `SELECT * FROM clan_wars WHERE attacker_clan_id = ? OR defender_clan_id = ? ORDER BY created_at DESC LIMIT 20`,
    [clanId, clanId]
  )
  return rows.map(r => ({
    id: r.id as number,
    attackerClanId: r.attacker_clan_id as number,
    defenderClanId: r.defender_clan_id as number,
    roundsCommitted: r.rounds_committed as number,
    roundsWon: r.rounds_won as number,
    roundsLost: r.rounds_lost as number,
    enslaved: r.enslaved as number,
    winnerClanId: r.winner_clan_id as number,
    createdAt: r.created_at as string,
  }))
}

export function getWarParticipantsByClan(clanId: number): { playerGameId: number; warsParticipated: number }[] {
  const rows = dbAll(
    `SELECT cwp.player_game_id, COUNT(*) as wars_participated
     FROM clan_war_participants cwp
     JOIN clan_wars cw ON cwp.war_id = cw.id
     WHERE cw.attacker_clan_id = ? OR cw.defender_clan_id = ?
     GROUP BY cwp.player_game_id`,
    [clanId, clanId]
  )
  return rows.map(r => ({
    playerGameId: r.player_game_id as number,
    warsParticipated: r.wars_participated as number,
  }))
}
