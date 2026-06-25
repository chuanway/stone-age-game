export interface EnslavementResult {
  enslaved: number
  actualDeduction: number
}

export function calculateEnslavement(
  targetCivilians: number,
  enslavementMin: number,
  enslavementMax: number,
  hardCap: number
): EnslavementResult {
  const roll = enslavementMin + Math.random() * (enslavementMax - enslavementMin)
  let deduction = Math.floor(targetCivilians * roll)

  const maxDeductible = Math.max(0, targetCivilians - hardCap)
  deduction = Math.min(deduction, maxDeductible)

  return { enslaved: deduction, actualDeduction: deduction }
}

export function calculateWarEnslavement(
  winnerCivilians: number,
  loserCivilians: number,
  enslavementMin: number,
  enslavementMax: number,
  hardCap: number
): EnslavementResult {
  const roll = enslavementMin + Math.random() * (enslavementMax - enslavementMin)
  const base = Math.min(winnerCivilians, loserCivilians)
  let deduction = Math.floor(base * roll)

  const maxDeductible = Math.max(0, loserCivilians - hardCap)
  deduction = Math.min(deduction, maxDeductible)

  return { enslaved: deduction, actualDeduction: deduction }
}
