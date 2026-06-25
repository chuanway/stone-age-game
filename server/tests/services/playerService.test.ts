import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Player } from 'shared'

vi.mock('../../src/data/repositories/playerRepo', () => ({
  findPlayerById: vi.fn(),
}))

const basePlayer: Player = {
  id: 1,
  username: 'testuser',
  createdAt: '',
  updatedAt: '',
}

describe('playerService.getProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns player when found', async () => {
    const { findPlayerById } = await import('../../src/data/repositories/playerRepo')
    vi.mocked(findPlayerById).mockReturnValue(basePlayer)

    const { getProfile } = await import('../../src/services/playerService')
    const result = getProfile(1)

    expect(result.player).toBeDefined()
    expect(result.player.id).toBe(1)
    expect(result.player.username).toBe('testuser')
  })

  it('returns player with undefined fields when player not found', async () => {
    const { findPlayerById } = await import('../../src/data/repositories/playerRepo')
    vi.mocked(findPlayerById).mockReturnValue(undefined)

    const { getProfile } = await import('../../src/services/playerService')
    const result = getProfile(999)

    expect(result.player).toBeUndefined()
  })
})
