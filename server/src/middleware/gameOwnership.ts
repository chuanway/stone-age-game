import { Request, Response, NextFunction } from 'express'
import * as gamePlayerRepo from '../data/repositories/gamePlayerRepo'
import jwt from 'jsonwebtoken'
import { env } from '../config/env'

export function gameOwnershipMiddleware(req: Request, res: Response, next: NextFunction): void {
  const playerId = (req as any).playerId
  const gameId = parseInt(req.params.gameId as string, 10)

  if (!gameId || isNaN(gameId)) {
    res.status(400).json({ error: 'Invalid game ID' })
    return
  }

  const playerGame = gamePlayerRepo.findByPlayerAndGame(playerId, gameId)
  if (!playerGame) {
    res.status(404).json({ error: 'Game not found' })
    return
  }

  (req as any).playerGameId = playerGame.id
  next()
}

export function resolvePlayerGameId(req: Request, res: Response, next: NextFunction): void {
  const playerId = (req as any).playerId
  if (!playerId) {
    next()
    return
  }

  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) {
    next()
    return
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret) as any
    const gameId = decoded.gameId as number
    if (gameId) {
      const playerGame = gamePlayerRepo.findByPlayerAndGame(playerId, gameId)
      if (playerGame) {
        (req as any).playerGameId = playerGame.id
      }
    }
  } catch {
    // ignore
  }
  next()
}
