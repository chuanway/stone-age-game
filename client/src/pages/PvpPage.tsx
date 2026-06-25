import { useEffect, useState } from 'react'
import { PvpList } from '../components/game/PvpList'
import { api } from '../services/api'
import { useGameStore } from '../store/gameStore'
import type { PvpTarget, PvPBattleResponse } from 'shared'

export function PvpPage() {
  const gameId = useGameStore(s => s.gameId)
  const [targets, setTargets] = useState<PvpTarget[]>([])
  const [results, setResults] = useState<Record<number, PvPBattleResponse>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.playerBattle.pvpTargets().then(res => setTargets(res.targets)).catch(e => setError(e.message))
  }, [])

  async function handleAttack(targetId: number, army: number) {
    if (!gameId) return
    setLoading(true)
    setError(null)
    try {
      const res = await api.playerBattle.pvp(gameId, targetId, army)
      setResults(prev => ({ ...prev, [targetId]: res }))
      const resourceRes = await api.playerGame.getResource(gameId)
      useGameStore.getState().setResource(resourceRes.resource)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="pvp-page">
      <h2>PvP</h2>
      {error && <p className="error">{error}</p>}
      {loading && <p>Attacking...</p>}
      <PvpList entries={targets} results={results} onAttack={handleAttack} />
    </div>
  )
}
