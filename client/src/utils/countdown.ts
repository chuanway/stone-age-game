import { now } from './date'

export function startCountdown(
  serverRemainingMs: number,
  onTick: (remainingMs: number) => void,
  intervalMs: number
): () => void {
  if (serverRemainingMs <= 0) return () => {}

  const baseTime = now()
  const id = setInterval(() => {
    const elapsed = now() - baseTime
    onTick(Math.max(0, serverRemainingMs - elapsed))
  }, intervalMs)

  return () => clearInterval(id)
}
