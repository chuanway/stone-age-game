import { useState } from 'react'
import { Button } from '../components/common/Button'
import { useClan } from '../hooks/useClan'
import { api } from '../services/api'
import { formatResource } from '../values/resourceValues'
import type { Clan } from 'shared'

export function ClanWarPage() {
  const { gameId, clanId, loading, error, warResult, declareWar } = useClan()
  const [warTargetId, setWarTargetId] = useState('')
  const [warArmy, setWarArmy] = useState('50')
  const [searchName, setSearchName] = useState('')
  const [searchResults, setSearchResults] = useState<{ clan: Clan; memberCount: number; activated: boolean }[] | null>(null)
  const [searchError, setSearchError] = useState<string | null>(null)

  if (!gameId || !clanId) return null

  async function handleSearch() {
    setSearchError(null)
    setSearchResults(null)
    try {
      const results = await api.clan.search(gameId, searchName)
      setSearchResults(results.filter(r => r.clan.id !== clanId))
    } catch (e: any) {
      setSearchError(e.message)
    }
  }

  return (
    <div className="clan-war-page">
      <h2>Clan War</h2>
      {error && <p className="error">{error}</p>}

      <div className="clan-war-card">
        <h4>Search Target Clan</h4>
        <div className="clan-war-search">
          <input placeholder="Clan Name" value={searchName} onChange={e => setSearchName(e.target.value)} />
          <Button onClick={handleSearch} disabled={!searchName}>Search</Button>
        </div>
        {searchError && <p className="error">{searchError}</p>}
        {searchResults && searchResults.length === 0 && <p className="empty-message">No clans found.</p>}
        {searchResults && searchResults.map(r => (
          <div key={r.clan.id} className="clan-lookup-card">
            <h4>{r.clan.name}</h4>
            <p>Members: {r.memberCount} | Activated: {r.activated ? 'Yes' : 'No'}</p>
            <Button onClick={() => {
              setWarTargetId(String(r.clan.id))
              setSearchResults(null)
              setSearchName('')
            }}>Select</Button>
          </div>
        ))}
      </div>

      <div className="clan-war-card">
        <h4>Declare War</h4>
        {warTargetId && <p>Target Clan ID: {warTargetId}</p>}
        <div className="pve-card-controls">
          <label>Target Clan ID: <input placeholder="Clan ID" value={warTargetId} onChange={e => setWarTargetId(e.target.value)} /></label>
          <label>Army: <input type="number" value={warArmy} onChange={e => setWarArmy(e.target.value)} min={1} /></label>
          <Button onClick={() => declareWar(parseInt(warTargetId, 10), parseInt(warArmy, 10) || 50)} disabled={loading || !warTargetId}>Declare War</Button>
        </div>

        {warResult && (
          <div className="war-result">
            <p>Rounds won: {warResult.result?.roundsWon}/{warResult.result?.roundsCommitted}</p>
            <p>Rounds lost: {warResult.result?.roundsLost}</p>
            <p>Army Lost: {warResult.result?.armyLost}</p>
            <p>Enslaved: {warResult.enslavement?.enslaved} from clan {warResult.enslavement?.loserClanId}</p>
            {warResult.result?.loot && Object.entries(warResult.result.loot).filter(([, v]) => (v as number) > 0).map(([key, val]) => (
              <p key={key}>{formatResource(key, val as number)}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}