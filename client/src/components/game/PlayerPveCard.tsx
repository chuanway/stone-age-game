import { useState } from 'react'
import { MonsterConfig, PlayerPvEBattleResponse } from 'shared'
import { Button } from '../common/Button'
import { PlayerPveReport } from './PlayerPveReport'
import { RESOURCE_EMOJI } from '../../values/resourceValues'

interface PlayerPveCardProps {
  monster: MonsterConfig
  result?: PlayerPvEBattleResponse
  onFight: (monsterId: string, rounds: number) => void
}

export function PlayerPveCard({ monster, result, onFight }: PlayerPveCardProps) {
  const [rounds, setRounds] = useState('1')
  const lootEntries = Object.entries(monster.loot).filter(([, range]) => range.min > 0 || range.max > 0)
  const army = parseInt(rounds, 10) * monster.minArmyPerRound

  return (
    <div className="player-pve-card">
      <h4>{monster.name}</h4>
      {lootEntries.length > 0 && (
        <div className="loot-rewards">
          <p>Loot Rewards:</p>
          {lootEntries.map(([key, range]) => (
            <span key={key} className="produces-item">{RESOURCE_EMOJI[key] ?? ''} {key}: {range.min}-{range.max}</span>
          ))}
        </div>
      )}
      <p>ATK: {monster.attack} DEF: {monster.defense} | Min army: {monster.minArmyPerRound}/round</p>
      <div className="pve-card-controls">
        <label>Rounds: <input type="number" value={rounds} onChange={e => setRounds(e.target.value)} min={1} /></label>
        <span>Army: {army}</span>
        <Button onClick={() => onFight(monster.id, parseInt(rounds, 10) || 1)}>Fight</Button>
      </div>
      {result && <PlayerPveReport result={result} />}
    </div>
  )
}
