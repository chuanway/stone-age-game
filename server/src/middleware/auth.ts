import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env'

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided' })
    return
  }

  try {
    const token = header.slice(7)
    const decoded = jwt.verify(token, env.jwtSecret) as { playerId: number }
    ;(req as any).playerId = decoded.playerId
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}
