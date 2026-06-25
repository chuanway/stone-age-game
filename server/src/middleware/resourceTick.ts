import { Request, Response, NextFunction } from 'express'
import * as resourceService from '../services/resourceService'

export function resourceTickMiddleware(req: Request, res: Response, next: NextFunction): void {
  const playerGameId = (req as any).playerGameId
  if (playerGameId) {
    try {
      resourceService.applyTick(playerGameId)
    } catch (err) {
      console.error('resourceTick error:', err)
    }
  }
  next()
}
