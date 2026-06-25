import { Link, Outlet, useLocation } from 'react-router-dom'
import { Button } from '../components/common/Button'
import { useGameStore } from '../store/gameStore'

export function HomePage() {
  const token = useGameStore(s => s.token)
  const location = useLocation()
  const isIndex = location.pathname === '/'

  if (!isIndex) return <Outlet />

  return (
    <div className="home-page">
      <div className="home-hero">
        <h1>Stone Age Game</h1>
        <p className="home-tagline">A text-based MMO strategy game set in the Stone Age</p>
        <div className="home-actions">
          <Link to={token ? '/game/city' : '/login'}><Button>Login</Button></Link>
          <Link to={token ? '/game/city' : '/register'}><Button>Register</Button></Link>
        </div>
      </div>
      <div className="home-features">
        <div className="feature-card">
          <h3>Build & Upgrade</h3>
          <p>Construct and upgrade buildings to generate Food, Wood, Metal, and Population.</p>
        </div>
        <div className="feature-card">
          <h3>Battle Monsters</h3>
          <p>Fight PvE monsters using round-based battle with VAR or SAR strategy systems.</p>
        </div>
        <div className="feature-card">
          <h3>PvP Battle</h3>
          <p>Attack other players using dynamic city bracket PvP with anti-griefing protection.</p>
        </div>
        <div className="feature-card">
          <h3>Join a Clan</h3>
          <p>Create or join a clan, contribute civilians, upgrade shared buildings, and wage clan wars.</p>
        </div>
      </div>
    </div>
  )
}
