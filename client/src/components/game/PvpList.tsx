import { PvPBattleResponse } from 'shared'
import { List } from '../common/List'
import { PvpCard } from './PvpCard'

interface TargetEntry {
  id: number
  totalPopulation: number
}

interface PvpListProps {
  entries: TargetEntry[]
  results: Record<number, PvPBattleResponse>
  onAttack: (targetId: number, army: number) => void
}

export function PvpList({ entries, results, onAttack }: PvpListProps) {
  return (
    <List
      items={entries}
      emptyMessage="No PvP targets available."
      renderItem={(entry) => (
        <PvpCard key={entry.id} {...entry} result={results[entry.id]} onAttack={onAttack} />
      )}
    />
  )
}
