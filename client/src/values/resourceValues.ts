export const RESOURCE_EMOJI: Record<string, string> = {
  food: '🍗',
  wood: '🌲',
  metal: '⛏️',
  civilians: '👥',
  soldiers: '⚔️',
}

export function formatResource(key: string, value: number): string {
  const emoji = RESOURCE_EMOJI[key] ?? ''
  return `${emoji} ${key}: ${value}`
}
