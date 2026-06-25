import { env } from '../config/env'

export const MS_IN_MINUTE = 60000
export const MS_IN_HOUR = 3600000
export const MS_IN_DAY = 86400000

function offsetMs(): number {
  const sign = env.localTimezoneOffset[0] === '-' ? -1 : 1
  const [h, m] = env.localTimezoneOffset.slice(1).split(':').map(Number)
  return sign * (h * MS_IN_HOUR + m * MS_IN_MINUTE)
}

export function nowISO(): string {
  return new Date().toISOString()
}

export function nowLocal(): string {
  const now = new Date()
  const local = new Date(now.getTime() + offsetMs())
  const iso = local.toISOString().replace('Z', '')
  return `${iso}${env.localTimezoneOffset}`
}

export function nowDate(): Date {
  return new Date()
}

export function parseDate(str: string): Date {
  const normalized = str.includes('T') ? str : str.replace(' ', 'T') + '.000Z'
  return new Date(normalized)
}
