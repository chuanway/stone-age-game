import { computeTickProgress } from '../economy/resourceTick'

export function calculateClanEnergy(
  currentEnergy: number,
  maxEnergy: number,
  elapsedMs: number,
  tickIntervalMs: number
): number {
  if (currentEnergy >= maxEnergy) return currentEnergy
  if (elapsedMs <= 0) return currentEnergy

  const regenPerTick = 1
  const { fullIntervals } = computeTickProgress(elapsedMs, tickIntervalMs)
  if (fullIntervals === 0) return currentEnergy

  const gained = fullIntervals * regenPerTick
  return Math.min(maxEnergy, currentEnergy + gained)
}

export function calculateEnergyTickElapsed(
  elapsedMs: number,
  tickIntervalMs: number
): number {
  const { fullIntervals } = computeTickProgress(elapsedMs, tickIntervalMs)
  return fullIntervals * tickIntervalMs
}
