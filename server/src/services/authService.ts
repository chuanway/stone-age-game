import { AuthResponse, ErrorResponse, BuildingType } from 'shared'
import * as playerRepo from '../data/repositories/playerRepo'
import * as clanRepo from '../data/repositories/clanRepo'
import * as gameRepo from '../data/repositories/gameRepo'
import * as gamePlayerRepo from '../data/repositories/gamePlayerRepo'
import * as playerResourceRepo from '../data/repositories/playerResourceRepo'
import * as buildingRepo from '../data/repositories/buildingRepo'
import { loadBuildingsConfig, loadGameConfig } from '../config/configLoader'
import { saveDb } from '../data/database'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { env } from '../config/env'

export function register(username: string, password: string): AuthResponse | ErrorResponse {
  const existing = playerRepo.findPlayerByUsername(username)
  if (existing) return { error: 'Username already exists' }

  const passwordHash = bcrypt.hashSync(password, 10)
  const player = playerRepo.createPlayer(username, passwordHash)
  const game = gameRepo.findActive() ?? gameRepo.create()
  const playerGame = gamePlayerRepo.create(player.id, game.id)
  const resource = playerResourceRepo.create(playerGame.id)

  const gameConfig = loadGameConfig()
  playerResourceRepo.update(resource.id, gameConfig.startingResources)

  const buildingsConfig = loadBuildingsConfig()
  for (const [buildingType, level] of Object.entries(buildingsConfig.startingBuildings)) {
    buildingRepo.createBuilding(playerGame.id, buildingType as BuildingType, level as number)
  }

  saveDb()
  const token = jwt.sign({ playerId: player.id, gameId: game.id }, env.jwtSecret, { expiresIn: '7d' })
  const member = clanRepo.findMemberByPlayerGameId(playerGame.id)
  return { token, player, clanId: member?.clanId ?? null }
}

export function login(username: string, password: string): AuthResponse | null {
  const passwordHash = playerRepo.findPasswordHashByUsername(username)
  if (!passwordHash || !bcrypt.compareSync(password, passwordHash)) return null
  const player = playerRepo.findPlayerByUsername(username)!
  const game = gameRepo.findByPlayerId(player.id)
  if (!game) return null
  const token = jwt.sign({ playerId: player.id, gameId: game.id }, env.jwtSecret, { expiresIn: '7d' })
  const playerGame = gamePlayerRepo.findByPlayerAndGame(player.id, game.id)
  const member = playerGame ? clanRepo.findMemberByPlayerGameId(playerGame.id) : null
  return { token, player, clanId: member?.clanId ?? null }
}
