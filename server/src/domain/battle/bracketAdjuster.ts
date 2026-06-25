import { PvPBracketConfig } from 'shared'
import { roundToTwoDecimals } from '../../utils/numbers'

export function classifyBracket(
  attackerPopulation: number,
  defenderPopulation: number,
  pvpPopulationBracketInfo: any
): PvPBracketConfig {
  const pvpBracketThreshold = pvpPopulationBracketInfo.populationThreshold

  const attackerToDefenderPopulationRatio = roundToTwoDecimals(attackerPopulation / defenderPopulation)
  const populationRatioDifference = roundToTwoDecimals(1 - attackerToDefenderPopulationRatio)

  const varChanceMultiplierList = pvpPopulationBracketInfo.varChanceMultiplier;

  if (populationRatioDifference < -pvpBracketThreshold) {
    return {
      bracket: "smallCity",
      varChanceMultiplier: varChanceMultiplierList.smallCity,
    }
  }
  if (populationRatioDifference > pvpBracketThreshold) {
    return {
      bracket: "largeCity",
      varChanceMultiplier: varChanceMultiplierList.largeCity,
    }
  }
  return {
    bracket: "mediumCity",
    varChanceMultiplier: varChanceMultiplierList.mediumCity,
  }
}
