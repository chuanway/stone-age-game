import { useState } from 'react'
import { api } from '../services/api'
import { useGameStore } from '../store/gameStore'
import type { PlayerPvEBattleResponse, BattleStrategyType } from 'shared'

export function useBattle() {
  const { gameId } = useGameStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function startPve(monsterId: string, rounds: number, strategyType: BattleStrategyType): Promise<PlayerPvEBattleResponse | null> {
    if (!gameId) return null
    setLoading(true)
    setError(null)
    try {
      return await api.playerBattle.playerPve(gameId, monsterId, rounds, strategyType)
    } catch (e: any) {
      setError(e.message)
      return null
    } finally {
      setLoading(false)
    }
  }

  return { loading, error, startPve }
}
