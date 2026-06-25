import { PlayerProfileResponse } from 'shared'
import * as playerRepo from '../data/repositories/playerRepo'

export function getProfile(playerId: number): PlayerProfileResponse {
  const player = playerRepo.findPlayerById(playerId)
  return { player: player! }
}
