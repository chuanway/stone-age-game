import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { MonsterConfig, PlayerGame, PlayerResource } from 'shared'

const monster = vi.hoisted(() => ({
  id: 'wolf', name: 'Wolf',
  minArmyPerRound: 3, attack: 2, defense: 2,
  loot: { food: { min: 40, max: 60 }, wood: { min: 20, max: 40 } },
}))

const battleConfig = vi.hoisted(() => ({
  activeStrategy: 'VAR',
  battleStrategy: {
    calculationType: {
      VAR: { cap: 1.0, baseChance: 0.2, varChance: 0.6, maxChance: 0.8, minChance: 0.2 },
      SAR: { victoryThreshold: 0 },
    },
    pvpPopulationBracket: {
      populationThreshold: 0.1,
      varChanceMultiplier: { smallCity: 0.4, mediumCity: 0.6, largeCity: 0.6 },
    },
  },
  clanPvp: {} as any,
  clanPve: {} as any,
  playerPvp: {} as any,
}))

vi.mock('../../src/config/configLoader', () => ({
  loadMonstersConfig: vi.fn(() => ({ monsters: [monster] })),
  loadBattleConfig: vi.fn(() => battleConfig),
}))

vi.mock('../../src/data/repositories/playerResourceRepo', () => ({
  findByPlayerGameId: vi.fn(),
  update: vi.fn(),
}))

vi.mock('../../src/data/repositories/gamePlayerRepo', () => ({
  findById: vi.fn(),
}))

vi.mock('../../src/data/repositories/playerPveBattleRepo', () => ({
  insertBattle: vi.fn(),
}))

describe('battleService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('startPveBattle returns battle result with loot', async () => {
    const { findByPlayerGameId } = await import('../../src/data/repositories/playerResourceRepo')
    const { findById } = await import('../../src/data/repositories/gamePlayerRepo')

    const mockResource: PlayerResource = {
      id: 1, playerGameId: 1,
      food: 100, wood: 50, metal: 20, civilians: 30, soldiers: 50,
      createdAt: '', updatedAt: '',
    }
    const mockPg: PlayerGame = {
      id: 1, playerId: 1, gameId: 1,
      attackStat: 10, defenseStat: 5, lastTickAt: '',
      createdAt: '', updatedAt: '',
    }

    vi.mocked(findByPlayerGameId).mockReturnValue(mockResource)
    vi.mocked(findById).mockReturnValue(mockPg)

    const { startPveBattle } = await import('../../src/services/battleService')

    const result = startPveBattle(1, 'wolf', 12, 'VAR')

    expect(result.roundsCommitted).toBe(12)
    expect(result.roundsWon + result.roundsLost).toBe(12)
    expect(result.loot).toBeDefined()
    expect(typeof result.loot.food).toBe('number')
  })
})
