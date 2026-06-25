export function validateRegister(body: any): string | null {
  if (!body.username || typeof body.username !== 'string') return 'Username is required'
  if (!body.password || typeof body.password !== 'string') return 'Password is required'
  if (body.password.length < 6) return 'Password must be at least 6 characters'
  return null
}

export function validateLogin(body: any): string | null {
  if (!body.username || !body.password) return 'Username and password are required'
  return null
}
