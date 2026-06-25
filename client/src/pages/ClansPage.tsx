import { useState } from 'react'
import { Outlet, useLocation, Navigate } from 'react-router-dom'
import { Button } from '../components/common/Button'
import { api } from '../services/api'
import { useGameStore } from '../store/gameStore'
import type { Clan } from 'shared'

export function ClansPage() {
  const storeGameId = useGameStore(s => s.gameId)
  const storeClanId = useGameStore(s => s.clanId)
  const setClanId = useGameStore(s => s.setClanId)
  const location = useLocation()

  const [clanResults, setClanResults] = useState<{ clan: Clan; memberCount: number; activated: boolean }[] | null>(null)
  const [searchName, setSearchName] = useState('')
  const [clanName, setClanName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (!storeGameId) return <p>Please log in first</p>
  const gameId: number = storeGameId
  const clanId: number | null = storeClanId

  const isIndex = location.pathname === '/game/clans'

  async function handleSearch() {
    setError(null)
    setClanResults(null)
    try {
      const results = await api.clan.search(gameId, searchName)
      setClanResults(results)
    } catch (e: any) {
      setError(e.message)
    }
  }

  async function handleJoin(clanId: number) {
    setLoading(true)
    setError(null)
    try {
      await api.clan.join(gameId, clanId)
      setClanId(clanId)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate() {
    setLoading(true)
    setError(null)
    try {
      const clan = await api.clan.create(gameId, clanName)
      setClanId(clan.id)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isIndex) {
    return clanId ? <Outlet /> : <Navigate to="/game/clans" replace />
  }

  return (
    <div className="clans-page">
      <h2>Clans</h2>
      {error && <p className="error">{error}</p>}

      <div>
        <h3>Search</h3>
        <input placeholder="Clan Name" value={searchName} onChange={e => setSearchName(e.target.value)} />
        <Button onClick={handleSearch} disabled={!searchName}>Search</Button>
        {clanResults && clanResults.length === 0 && <p className="empty-message">No clans found.</p>}
        {clanResults && clanResults.map(r => (
          <div key={r.clan.id} className="clan-lookup-card">
            <h4>{r.clan.name}</h4>
            <p>Members: {r.memberCount} | Activated: {r.activated ? 'Yes' : 'No'}</p>
            <Button onClick={() => handleJoin(r.clan.id)} disabled={loading}>Join</Button>
          </div>
        ))}
      </div>

      <div>
        <h3>Create</h3>
        <input placeholder="Clan name" value={clanName} onChange={e => setClanName(e.target.value)} />
        <Button onClick={handleCreate} disabled={loading || !clanName}>Create</Button>
      </div>
    </div>
  )
}
