import { useState } from 'react'
import { PvPBattleResponse } from 'shared'
import { Button } from '../common/Button'
import { PvpReport } from './PvpReport'

interface PvpCardProps {
  id: number
  totalPopulation: number
  result?: PvPBattleResponse
  onAttack: (targetId: number, army: number) => void
}

export function PvpCard({ id, totalPopulation, result, onAttack }: PvpCardProps) {
  const [army, setArmy] = useState('10')

  return (
    <div className="pvp-card">
      <h4>Player #{id}</h4>
      <p>Population: {totalPopulation}</p>
      <div className="pve-card-controls">
        <label>Army: <input type="number" value={army} onChange={e => setArmy(e.target.value)} min={1} /></label>
        <Button onClick={() => onAttack(id, parseInt(army, 10) || 10)}>Attack</Button>
      </div>
      {result && <PvpReport result={result} />}
    </div>
  )
}
