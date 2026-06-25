import { PlayerBuilding, PlayerBuildableBuilding } from 'shared'
import { BuildingCard } from './BuildingCard'

interface BuildingListProps {
  buildings: PlayerBuilding[]
  buildable: PlayerBuildableBuilding[]
  onUpgrade: (type: import('shared').BuildingType) => void
  onBuild: (type: import('shared').BuildingType) => void
}

export function BuildingList({ buildings, buildable, onUpgrade, onBuild }: BuildingListProps) {
  const owned = new Map(buildings.map(b => [b.type, b]))

  const allEntries: { type: string; name: string; level?: number; produces: string | null; cost: Record<string, number> | null; costLabel: string; buttonLabel: string; onAction: (type: string) => void }[] = []

  for (const b of buildings) {
    allEntries.push({
      type: b.type,
      name: b.name,
      level: b.level,
      produces: b.produces,
      cost: b.nextUpgradeCost,
      costLabel: 'Upgrade cost',
      buttonLabel: 'Upgrade',
      onAction: onUpgrade,
    })
  }

  for (const b of buildable) {
    allEntries.push({
      type: b.type,
      name: b.name,
      produces: b.produces,
      cost: b.cost,
      costLabel: 'Build cost',
      buttonLabel: 'Build',
      onAction: onBuild,
    })
  }

  return allEntries.length > 0 ? (
    <div className="list">
      {allEntries.map((entry) => (
        <BuildingCard key={entry.type} {...entry} />
      ))}
    </div>
  ) : (
    <p className="empty-message">No buildings available.</p>
  )
}
