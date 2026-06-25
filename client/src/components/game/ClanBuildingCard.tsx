import { useState } from 'react'
import { ClanBuilding } from 'shared'
import { Button } from '../common/Button'
import { ProgressBar } from '../common/ProgressBar'
import { RESOURCE_EMOJI } from '../../values/resourceValues'

interface ClanBuildingCardProps {
  building: ClanBuilding
  onContributeResource: (resource: import('shared').ResourceType, amount: number) => void
  onUpgrade: (buildingType: import('shared').BuildingType, resource: import('shared').ResourceType, amount: number) => void
  isLoading: boolean
}

const RESOURCE_FIELDS: Record<string, 'contributedFood' | 'contributedWood' | 'contributedMetal'> = {
  food: 'contributedFood',
  wood: 'contributedWood',
  metal: 'contributedMetal',
}

function formatBuildingName(type: string): string {
  const names: Record<string, string> = {
    farm: 'Farm',
    lumberjackHut: 'Lumberjack Hut',
    mine: 'Mine',
  }
  return names[type] || type
}

export function ClanBuildingCard({ building, onContributeResource, onUpgrade, isLoading }: ClanBuildingCardProps) {
  const [amounts, setAmounts] = useState<Record<string, string>>({})

  const costs = building.nextUpgradeCost ?? {}
  const hasCosts = Object.keys(costs).length > 0

  if (!hasCosts) {
    return (
      <div className="building-card">
        <h4>{formatBuildingName(building.type)} (Lv.{building.level})</h4>
        <p>No upgrade costs available.</p>
      </div>
    )
  }

  return (
    <div className="building-card">
      <h4>{formatBuildingName(building.type)} (Lv.{building.level})</h4>
      {Object.entries(costs).map(([resource, maxCost]) => {
        const contributedField = RESOURCE_FIELDS[resource]
        const current = contributedField ? building[contributedField] : 0
        const amount = amounts[resource] ?? '10'

        return (
          <div key={resource} className="clan-building-resource">
            <div className="clan-building-progress">
              <ProgressBar current={current} max={maxCost} label={`${RESOURCE_EMOJI[resource] ?? ''} ${resource}`} />
            </div>
            <div className="clan-building-actions">
              <input type="number" value={amount} onChange={e => setAmounts(p => ({ ...p, [resource]: e.target.value }))} min={1} />
              <span>{RESOURCE_EMOJI[resource] ?? ''} {resource}</span>
              <Button onClick={() => onContributeResource(resource, parseInt(amount, 10) || 10)} disabled={isLoading}>Contribute</Button>
              <Button onClick={() => onUpgrade(building.type, resource, parseInt(amount, 10) || 10)} disabled={isLoading}>Upgrade</Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}