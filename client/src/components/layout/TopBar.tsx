import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../../store/gameStore'
import { useAuth } from '../../hooks/useAuth'
import { TickTimer } from '../game/TickTimer'
import { SyncNotification } from '../game/SyncNotification'

export function TopBar() {
  const token = useGameStore(s => s.token)
  const player = useGameStore(s => s.player)
  const { logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <header className="top-bar">
      <h1 className="top-bar-title">Stone Age Game</h1>
      {token && (
        <div className="top-bar-right">
          <SyncNotification />
          <TickTimer />
          {player && <span className="top-bar-username">{player.username}</span>}
          <button className="btn-logout" onClick={handleLogout}>Logout</button>
        </div>
      )}
    </header>
  )
}
