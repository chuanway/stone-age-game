import { PvpTarget } from 'shared'

export function filterVisibleTargets(
  targets: Array<{ id: number; playerGameId: number; playerId: number; civilians: number; soldiers: number }>,
  visibilityThreshold: number
): PvpTarget[] {
  return targets
    .map(t => ({ id: t.playerId, totalPopulation: t.civilians + t.soldiers }))
    .filter(t => t.totalPopulation >= visibilityThreshold)
}
