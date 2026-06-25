import { ReactNode } from 'react'

interface ListItemProps {
  children: ReactNode
  onClick?: () => void
}

export function ListItem({ children, onClick }: ListItemProps) {
  return (
    <div className="list-item" onClick={onClick} role={onClick ? 'button' : undefined}>
      {children}
    </div>
  )
}
