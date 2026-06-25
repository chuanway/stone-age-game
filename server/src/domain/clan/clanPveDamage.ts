export function calculateClanPveDamage(soldierCount: number, attackLevel: number): number {
  const variance = 0.9 + Math.random() * 0.2
  return Math.floor(soldierCount * (attackLevel || 1) * variance)
}
