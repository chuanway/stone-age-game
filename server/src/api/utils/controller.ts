import { Request, Response, NextFunction } from 'express'

export type ControllerResult<T = any> = {
  status: number
  body: T
}

export type ControllerHandler<T = any> = (
  req: Request
) => ControllerResult<T> | Promise<ControllerResult<T>>

export function wrap(handler: ControllerHandler) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(handler(req)).then(({ status, body }) => {
      res.status(status).json(body)
    }).catch(next)
  }
}
