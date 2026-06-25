import { describe, it, expect } from 'vitest'
import { classifyBracket } from '../../../src/domain/battle/bracketAdjuster'

describe('classifyBracket', () => {
  const pvpInfo = {
    populationThreshold: 0.1,
    varChanceMultiplier: { smallCity: 0.4, mediumCity: 0.6, largeCity: 0.6 },
  }

  it('returns smallCity when defender has much less population', () => {
    const result = classifyBracket(1000, 800, pvpInfo)
    expect(result.bracket).toBe('smallCity')
    expect(result.varChanceMultiplier).toBe(0.4)
  })

  it('returns mediumCity when populations are similar', () => {
    const result = classifyBracket(1000, 1000, pvpInfo)
    expect(result.bracket).toBe('mediumCity')
    expect(result.varChanceMultiplier).toBe(0.6)
  })

  it('returns mediumCity within 10% range', () => {
    const result = classifyBracket(1000, 1050, pvpInfo)
    expect(result.bracket).toBe('mediumCity')
  })

  it('returns largeCity when defender has much more population', () => {
    const result = classifyBracket(1000, 1200, pvpInfo)
    expect(result.bracket).toBe('largeCity')
  })
})
