import { useEffect, useState } from 'react'
import { PlayerPveList } from '../components/game/PlayerPveList'
import { useBattle } from '../hooks/useBattle'
import { useGameStore } from '../store/gameStore'
import { api } from '../services/api'
import type { MonsterConfig, PlayerPvEBattleResponse } from 'shared'

export function PlayerPvePage() {
  const [monsters, setMonsters] = useState<MonsterConfig[]>([])
  const [results, setResults] = useState<Record<string, PlayerPvEBattleResponse>>({})
  const [strategyType, setStrategyType] = useState<'VAR' | 'SAR'>('VAR')
  const [monsterError, setMonsterError] = useState<string | null>(null)
  const gameId = useGameStore(s => s.gameId)
  const { loading, error, startPve } = useBattle()

  useEffect(() => {
    api.monsters.list().then(res => { setMonsters(res); setMonsterError(null) }).catch(e => setMonsterError(e.message))
  }, [])

  async function handleFight(monsterId: string, rounds: number) {
    const res = await startPve(monsterId, rounds, strategyType)
    if (res && gameId) {
      setResults(prev => ({ ...prev, [monsterId]: res }))
      const resourceRes = await api.playerGame.getResource(gameId)
      useGameStore.getState().setResource(resourceRes.resource)
    }
  }

  return (
    <div className="player-pve-page">
      <h2>PvE Battle</h2>
      <div>
        <label>Strategy: </label>
        <select value={strategyType} onChange={e => setStrategyType(e.target.value as 'VAR' | 'SAR')}>
          <option value="VAR">VAR (Variable Attack Rate)</option>
          <option value="SAR">SAR (Simple Attack Rate)</option>
        </select>
      </div>
      {error && <p className="error">{error}</p>}
      {monsterError && <p className="error">{monsterError}</p>}
      {loading && <p>Fighting...</p>}
      <PlayerPveList monsters={monsters} results={results} onFight={handleFight} />
    </div>
  )
}
