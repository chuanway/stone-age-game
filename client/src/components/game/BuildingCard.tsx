import { Button } from '../common/Button'
import { RESOURCE_EMOJI, formatResource } from '../../values/resourceValues'

interface BuildingCardProps {
  name: string
  type: string
  level?: number
  produces: string | null
  cost: Record<string, number> | null
  costLabel: string
  buttonLabel: string
  onAction: (type: string) => void
}

export function BuildingCard({ name, type, level, produces, cost, costLabel, buttonLabel, onAction }: BuildingCardProps) {
  return (
    <div className="building-card">
      <h4>{name}{level != null ? ` (Lv.${level})` : ''}</h4>
      {produces ? (
        <div className="building-produces">
          <p>Produces:</p>
          {produces.split(' + ').map((res) => (
            <span key={res} className="produces-item">{RESOURCE_EMOJI[res] ? `${RESOURCE_EMOJI[res]} ${res}` : res}</span>
          ))}
        </div>
      ) : (
        <p>Produces: —</p>
      )}
      {cost && (
        <div className="upgrade-cost">
          <p>{costLabel}:</p>
          {Object.entries(cost).filter(([, amt]) => amt > 0).map(([res, amt]) => (
            <span key={res} className="cost-item">{formatResource(res, amt)}</span>
          ))}
        </div>
      )}
      {cost !== null && <Button onClick={() => onAction(type)}>{buttonLabel}</Button>}
    </div>
  )
}
