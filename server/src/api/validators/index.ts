import { Request, Response, NextFunction } from 'express'

export function validate(fn: (body: any) => string | null) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const error = fn(req.body)
    if (error) {
      res.status(400).json({ error })
      return
    }
    next()
  }
}

export function validateQuery(fn: (query: any) => string | null) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const error = fn(req.query)
    if (error) {
      res.status(400).json({ error })
      return
    }
    next()
  }
}

export * from './authValidation'
export * from './battleValidation'
export * from './clanValidation'
export * from './buildingValidation'
