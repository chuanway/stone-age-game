import { useState } from 'react'
import { api } from '../services/api'
import { useGameStore } from '../store/gameStore'

export function usePlayer() {
  const [loading, setLoading] = useState(false)
  const { player, buildings, gameId, setPlayer, setPlayerGame, setResource, setBuildings, setBuildable, setTickData, setProductionRates, setClanId } = useGameStore()

  async function refresh(): Promise<void> {
    if (!gameId) return
    setLoading(true)
    try {
      const [pgRes, playerRes, resourceRes, buildingsRes] = await Promise.all([
        api.playerGame.get(gameId),
        api.playerGame.getPlayer(gameId),
        api.playerGame.getResource(gameId),
        api.playerGame.getBuildings(gameId),
      ])
      setPlayerGame(pgRes.playerGame)
      setTickData(pgRes.tickIntervalMs, pgRes.serverRemainingMs)
      setPlayer(playerRes.player)
      setResource(resourceRes.resource)
      setBuildings(buildingsRes.buildings)
      setBuildable(buildingsRes.buildable)
      setProductionRates(buildingsRes.productionRates)
      if (pgRes.clanId !== undefined) setClanId(pgRes.clanId)
    } finally {
      setLoading(false)
    }
  }

  return { player, buildings, loading, refresh }
}
