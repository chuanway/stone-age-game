import type { MonsterConfig } from 'shared'
import { Button } from '../common/Button'
import { formatResource, RESOURCE_EMOJI } from '../../values/resourceValues'

interface ClanPveMonsterCardProps {
  monster: MonsterConfig
  onStart: (monsterId: string) => void
  disabled?: boolean
  collectNotification?: { monsterId: string; loot: Record<string, number> | null } | null
}

export function ClanPveMonsterCard({ monster, onStart, disabled, collectNotification }: ClanPveMonsterCardProps) {
  const showCollect = collectNotification && collectNotification.monsterId === monster.id
  const lootEntries = Object.entries(monster.loot).filter(([, range]) => range.min > 0 || range.max > 0)
  const collectLootEntries = showCollect && collectNotification.loot
    ? Object.entries(collectNotification.loot).filter(([, v]) => v > 0)
    : []

  return (
    <div className="clan-pve-card">
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
      <Button onClick={() => onStart(monster.id)} disabled={disabled}>Start PvE Fight</Button>

      {showCollect && collectLootEntries.length > 0 && (
        <div className="clan-pve-collect-note">
          <p>Loot Collected!</p>
          {collectLootEntries.map(([key, val]) => (
            <span key={key} className="collect-note-item">{formatResource(key, val)}</span>
          ))}
        </div>
      )}
    </div>
  )
}
