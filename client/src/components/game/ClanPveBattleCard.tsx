import { useState } from 'react'
import type { ClanPveAttackResponse, ClanPveCollectLootResponse, ClanPveMonster } from 'shared'
import { Button } from '../common/Button'
import { formatResource } from '../../values/resourceValues'

interface ClanPveBattleCardProps {
  monster: ClanPveMonster
  monsterName: string
  monsterAttack: number
  monsterDefense: number
  monsterMinArmy: number
  attackResult: ClanPveAttackResponse | null
  collectResult: ClanPveCollectLootResponse | null
  loading: boolean
  onAttack: (soldierCount: number) => void
  onCollect: () => void
  playerEnergy?: number
  playerMaxEnergy?: number
}

export function ClanPveBattleCard({
  monster,
  monsterName,
  monsterAttack,
  monsterDefense,
  monsterMinArmy,
  attackResult,
  collectResult,
  loading,
  onAttack,
  onCollect,
  playerEnergy = 0,
  playerMaxEnergy = 100,
}: ClanPveBattleCardProps) {
  const [soldierCount, setSoldierCount] = useState('50')
  const hpPercent = Math.round((monster.currentHp / monster.totalHp) * 100)
  const lootPreview = monster.lootPerMember ? Object.entries(monster.lootPerMember).filter(([, v]) => v > 0) : []
  const energy = playerEnergy
  const maxEnergy = playerMaxEnergy
  const energyPercent = Math.round((energy / maxEnergy) * 100)

  return (
    <div className="clan-pve-battle-card">
      <h4>{monsterName}</h4>

      {lootPreview.length > 0 && (
        <div className="loot-rewards">
          <p>Loot Rewards:</p>
          {lootPreview.map(([key, val]) => (
            <span key={key} className="produces-item">{formatResource(key, val)}</span>
          ))}
        </div>
      )}

      <div className="clan-pve-hp-bar">
        <div className="clan-pve-hp-fill" style={{ width: `${hpPercent}%` }} />
        <span>{monster.currentHp} / {monster.totalHp} HP ({hpPercent}%)</span>
      </div>
      <p>Participants: {monster.participants}</p>
      <div className="clan-pve-energy-bar">
        <div className="clan-pve-energy-fill" style={{ width: `${energyPercent}%` }} />
        <span>Energy: {energy} / {maxEnergy}</span>
      </div>
      <p>ATK: {monsterAttack} DEF: {monsterDefense} | Min army: {monsterMinArmy}/round</p>

      {monster.state === 'defeated' ? (
        <div>
          <p>Monster defeated! Collect your loot:</p>
          <div className="player-pve-report">
            {lootPreview.map(([key, val]) => (
              <span key={key} className="loot-item">{formatResource(key, val)}</span>
            ))}
          </div>
          <Button onClick={onCollect} disabled={loading}>Collect Loot</Button>
          {collectResult && (
            <div className="player-pve-report">
              {collectResult.success && collectResult.loot ? (
                <>
                  <p>Loot collected!</p>
                  {Object.entries(collectResult.loot).filter(([, v]) => v > 0).map(([key, val]) => (
                    <span key={key} className="loot-item">{formatResource(key, val)}</span>
                  ))}
                </>
              ) : (
                <p className="error">{collectResult.error ?? 'Failed to collect loot'}</p>
              )}
            </div>
          )}
        </div>
      ) : (
        <div>
          <div className="pve-card-controls">
            <label>Soldiers: <input type="number" value={soldierCount} onChange={e => setSoldierCount(e.target.value)} min={1} /></label>
            <Button onClick={() => onAttack(parseInt(soldierCount, 10) || 1)} disabled={loading}>Attack</Button>
          </div>

          {attackResult && (
            <div className="player-pve-report">
              <p>Damage dealt: {attackResult.damageDealt}</p>
              <p>Remaining HP: {attackResult.remainingHp}</p>
              {attackResult.monsterDefeated && <p>Monster defeated!</p>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
