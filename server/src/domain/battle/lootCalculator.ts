import { LootTable, ResourceDelta } from 'shared'

export function calculateLoot(
  roundsWon: number,
  lootTable: LootTable
): ResourceDelta {
  const delta: ResourceDelta = { food: 0, wood: 0, metal: 0, civilians: 0, soldiers: 0 }

  for (const [resource, range] of Object.entries(lootTable)) {
    if (!range) continue
    const min = range.min * roundsWon
    const max = range.max * roundsWon
    delta[resource as keyof ResourceDelta] = Math.floor(Math.random() * (max - min + 1)) + min
  }

  return delta
}
