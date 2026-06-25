import { ReactNode } from 'react'

interface ButtonProps {
  onClick?: () => void
  disabled?: boolean
  variant?: 'primary' | 'danger' | 'ghost'
  children: ReactNode
}

export function Button({ onClick, disabled, variant = 'primary', children }: ButtonProps) {
  return (
    <button className={`btn btn-${variant}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  )
}
