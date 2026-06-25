import { Navigate, Outlet } from 'react-router-dom'
import { useGameStore } from '../../store/gameStore'

export function PageShell() {
  const token = useGameStore(s => s.token)

  if (!token) return <Navigate to="/" replace />

  return <Outlet />
}
