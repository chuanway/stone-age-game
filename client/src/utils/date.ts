export function now(): number {
  return Date.now()
}

export function formatTime(ms: number): string {
  if (ms <= 0) return 'now'
  const s = Math.ceil(ms / 1000)
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}m ${sec}s`
}
