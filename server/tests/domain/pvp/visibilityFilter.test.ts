import { describe, it, expect } from 'vitest'
import { filterVisibleTargets } from '../../../src/domain/pvp/visibilityFilter'

describe('visibilityFilter', () => {
  describe('filterVisibleTargets', () => {
    const targets = [
      { id: 1, playerGameId: 1, playerId: 1, civilians: 600, soldiers: 300 },
      { id: 2, playerGameId: 2, playerId: 2, civilians: 200, soldiers: 100 },
      { id: 3, playerGameId: 3, playerId: 3, civilians: 0, soldiers: 0 },
    ]

    it('filters targets above visibility threshold', () => {
      const visible = filterVisibleTargets(targets, 500)
      expect(visible).toHaveLength(1)
      expect(visible[0].id).toBe(1)
    })

    it('returns empty array when no targets meet threshold', () => {
      const visible = filterVisibleTargets(targets, 10000)
      expect(visible).toHaveLength(0)
    })

    it('handles empty target array', () => {
      const visible = filterVisibleTargets([], 500)
      expect(visible).toHaveLength(0)
    })
  })
})
