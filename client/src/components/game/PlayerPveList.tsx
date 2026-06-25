import { MonsterConfig, PlayerPvEBattleResponse } from 'shared'
import { List } from '../common/List'
import { PlayerPveCard } from './PlayerPveCard'

interface PlayerPveListProps {
  monsters: MonsterConfig[]
  results: Record<string, PlayerPvEBattleResponse>
  onFight: (monsterId: string, rounds: number) => void
}

export function PlayerPveList({ monsters, results, onFight }: PlayerPveListProps) {
  return (
    <List
      items={monsters}
      emptyMessage="No monsters available."
      renderItem={(monster) => (
        <PlayerPveCard key={monster.id} monster={monster} result={results[monster.id]} onFight={onFight} />
      )}
    />
  )
}
