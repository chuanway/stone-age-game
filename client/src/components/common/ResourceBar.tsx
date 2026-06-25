import { RESOURCE_EMOJI } from '../../values/resourceValues'

interface ResourceBarProps {
  food: number
  wood: number
  metal: number
  civilians: number
  soldiers: number
  rates?: {
    food: number
    wood: number
    metal: number
    civilians: number
    soldiers: number
  }
}

function RateBadge({ rate }: { rate: number }) {
  if (rate <= 0) return null
  return <span className="resource-rate">(+{rate}/tick)</span>
}

export function ResourceBar({ food, wood, metal, civilians, soldiers, rates }: ResourceBarProps) {
  return (
    <div className="resource-bar">
      <span>{RESOURCE_EMOJI.food} Food: {food} <RateBadge rate={rates?.food ?? 0} /></span>
      <span>{RESOURCE_EMOJI.wood} Wood: {wood} <RateBadge rate={rates?.wood ?? 0} /></span>
      <span>{RESOURCE_EMOJI.metal} Metal: {metal} <RateBadge rate={rates?.metal ?? 0} /></span>
      <span>{RESOURCE_EMOJI.civilians} Civilians: {civilians} <RateBadge rate={rates?.civilians ?? 0} /></span>
      <span>{RESOURCE_EMOJI.soldiers} Soldiers: {soldiers} <RateBadge rate={rates?.soldiers ?? 0} /></span>
    </div>
  )
}
