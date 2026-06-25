export function computeCost(base: number, multiplier: number, level: number): number {
  return Math.floor(base * Math.pow(multiplier, level))
}
