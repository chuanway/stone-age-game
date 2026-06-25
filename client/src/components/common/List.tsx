import { ReactNode } from 'react'

interface ListProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => ReactNode
  emptyMessage?: string
}

export function List<T>({ items, renderItem, emptyMessage }: ListProps<T>) {
  if (items.length === 0 && emptyMessage) {
    return <p className="empty-message">{emptyMessage}</p>
  }
  return <div className="list">{items.map((item, i) => renderItem(item, i))}</div>
}
