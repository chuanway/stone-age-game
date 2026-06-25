import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { ResourceBar } from '../components/common/ResourceBar'
import { useAuth } from '../hooks/useAuth'
import { api } from '../services/api'
import { Button } from '../components/common/Button'

export function ProfilePage() {
  const player = useGameStore(s => s.player)
  const resource = useGameStore(s => s.resource)
  const gameId = useGameStore(s => s.gameId)
  const token = useGameStore(s => s.token)
  const setPlayer = useGameStore(s => s.setPlayer)
  const setResource = useGameStore(s => s.setResource)
  const navigate = useNavigate()
  const { logout } = useAuth()

  useEffect(() => {
    if (!token) {
      navigate('/')
      return
    }
    if (gameId) {
      api.playerGame.getPlayer(gameId).then(({ player }) => setPlayer(player)).catch(() => {})
      api.playerGame.getResource(gameId).then(({ resource }) => setResource(resource)).catch(() => {})
    }
  }, [])

  if (!player) return <p>Loading...</p>

  return (
    <div className="profile-page">
      <h2>Profile</h2>
      <div className="profile-info">
        <p><strong>Username:</strong> {player.username}</p>
        <p><strong>Player ID:</strong> {player.id}</p>
      </div>

      {resource && (
        <>
          <h3>Resources</h3>
          <ResourceBar
            food={resource.food}
            wood={resource.wood}
            metal={resource.metal}
            civilians={resource.civilians}
            soldiers={resource.soldiers}
          />
        </>
      )}

      <div className="profile-actions">
        <Button onClick={() => { logout(); navigate('/') }}>Logout</Button>
      </div>
    </div>
  )
}