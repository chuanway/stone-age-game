import * as authService from '../../services/authService'
import { RegisterRequest, LoginRequest } from 'shared'
import { ControllerHandler } from '../utils/controller'

export const register: ControllerHandler = (req) => {
  const { username, password } = req.body as RegisterRequest
  const result = authService.register(username, password)
  if ('error' in result) return { status: 409, body: { error: result.error } }
  return { status: 201, body: result }
}

export const login: ControllerHandler = (req) => {
  const { username, password } = req.body as LoginRequest
  const result = authService.login(username, password)
  if (!result) return { status: 401, body: { error: 'Invalid credentials' } }
  return { status: 200, body: result }
}
