export function validatePveBattle(body: any): string | null {
  if (!body.monsterId || typeof body.monsterId !== 'string') return 'Monster selection is required'
  if (!body.rounds || body.rounds < 1) return 'Rounds must be at least 1'
  if (!body.strategyType || !['VAR', 'SAR'].includes(body.strategyType)) return 'Invalid battle strategy'
  return null
}
