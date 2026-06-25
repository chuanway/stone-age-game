import { describe, it, expect, vi } from 'vitest'
import { calculateEnslavement, calculateWarEnslavement } from '../../../src/domain/clan/enslavementCalc'

describe('enslavementCalc', () => {
  describe('calculateEnslavement', () => {
    it('deducts within percentage range', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5)
      const result = calculateEnslavement(1000, 0.2, 0.5, 100)
      expect(result.enslaved).toBe(350)
      expect(result.actualDeduction).toBe(350)
      vi.restoreAllMocks()
    })

    it('respects hard cap protection', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5)
      const result = calculateEnslavement(150, 0.2, 0.5, 100)
      expect(result.enslaved).toBe(50)
      expect(result.actualDeduction).toBe(50)
      vi.restoreAllMocks()
    })

    it('returns zero when already at or below hard cap', () => {
      const result = calculateEnslavement(50, 0.2, 0.5, 100)
      expect(result.enslaved).toBe(0)
      expect(result.actualDeduction).toBe(0)
    })
  })

  describe('calculateWarEnslavement', () => {
    it('uses minimum of winner and loser population', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5)
      const result = calculateWarEnslavement(500, 200, 0.2, 0.5, 100)
      expect(result.enslaved).toBe(70)
      vi.restoreAllMocks()
    })

    it('respects hard cap in war context', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5)
      const result = calculateWarEnslavement(500, 120, 0.2, 0.5, 100)
      expect(result.enslaved).toBe(20)
      vi.restoreAllMocks()
    })

    it('returns zero when loser is at hard cap', () => {
      const result = calculateWarEnslavement(500, 100, 0.2, 0.5, 100)
      expect(result.enslaved).toBe(0)
    })
  })
})
