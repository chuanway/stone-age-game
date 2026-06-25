import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/common/Button'
import { Tabs, TabItem } from '../components/common/Tabs'
import { ClanBuildingCard } from '../components/game/ClanBuildingCard'
import { ClanMemberCard } from '../components/game/ClanMemberCard'
import { useClan } from '../hooks/useClan'
import { useGameStore } from '../store/gameStore'
import { api } from '../services/api'

type MyClanTab = 'buildings' | 'armoury' | 'members' | 'history'

export function MyClanPage() {
  const navigate = useNavigate()
  const {
    clanData, activationStatus, loading, error, gameId, clanId,
    refreshClan, clanStatMsg, contribute, upgradeStat, upgradeBuilding, contributeResource,
    kickMember, promoteMember, demoteMember, transferOwnership, disbandClan, leaveClan,
  } = useClan()

  const viewerPlayerGameId = useGameStore(s => s.playerGame?.id ?? null)

  const [activeTab, setActiveTab] = useState<MyClanTab>('buildings')
  const [contributeAmount, setContributeAmount] = useState('10')
  const [clanStatAmount, setClanStatAmount] = useState('100')
  const [upkeepStatus, setUpkeepStatus] = useState<{ met: boolean; message: string } | null>(null)
  const [warHistory, setWarHistory] = useState<import('shared').ClanWarRecord[] | null>(null)
  const [warClanNames, setWarClanNames] = useState<Record<string, string>>({})

  async function handleCheckUpkeep() {
    if (!gameId) return
    try {
      const res = await api.clan.upkeep(gameId)
      setUpkeepStatus(res)
    } catch (e: any) {
      setUpkeepStatus({ met: false, message: e.message })
    }
  }

  useEffect(() => {
    if (!gameId || !clanId) {
      navigate('/game/clans', { replace: true })
      return
    }
    refreshClan()
  }, [gameId, clanId])

  useEffect(() => {
    if (activeTab !== 'history' || !gameId || !clanId) return
    api.clan.warHistory(gameId, clanId).then(res => {
      setWarHistory(res.wars)
      setWarClanNames(res.clanNames)
    }).catch(() => {})
  }, [activeTab, gameId, clanId])

  if (!gameId || !clanId) return null
  if (!clanData) return <p>Loading clan...</p>

  const nextStatCost = (level: number) => Math.floor(500 * Math.pow(1.5, level - 1))

  const clanTabs: TabItem[] = [
    { key: 'buildings', label: 'Buildings' },
    { key: 'armoury', label: 'Armoury' },
    { key: 'members', label: 'Members' },
    { key: 'history', label: 'History' },
  ]

  return (
    <div className="my-clan-page">
      <div className="my-clan-header">
        <h2>{clanData.clan.name}</h2>
        <div className="my-clan-actions">
          <Button onClick={() => leaveClan()} disabled={loading}>Leave Clan</Button>
          <Button onClick={() => disbandClan()} disabled={loading}>Disband Clan</Button>
        </div>
      </div>
      {error && <p className="error">{error}</p>}
      <p>Activated: {activationStatus === null ? 'Unknown' : activationStatus ? 'Yes' : 'No (need 10,000 civilians)'}</p>
      <div>
        <Button onClick={handleCheckUpkeep}>Check Upkeep</Button>
        {upkeepStatus && <p className={upkeepStatus.met ? 'msg' : 'error'}>{upkeepStatus.message}</p>}
      </div>

      <Tabs tabs={clanTabs} activeKey={activeTab} onChange={setActiveTab} />

      {activeTab === 'buildings' && (
        <div className="tab-content">
          <div className="list">
            {clanData.buildings.length > 0 ? (
              clanData.buildings.map(b => (
                <ClanBuildingCard key={b.type} building={b} 
                  onContributeResource={(res, amt) => contributeResource(res, amt)}
                  onUpgrade={(type, res, amt) => upgradeBuilding(type, res, amt)} 
                  isLoading={loading} />
              ))
            ) : (
              <p className="empty-message">No clan buildings yet.</p>
            )}
          </div>

          <div>
            <h3>Contribute Civilians</h3>
            <input type="number" value={contributeAmount} onChange={e => setContributeAmount(e.target.value)} min={1} />
            <Button onClick={() => contribute(parseInt(contributeAmount, 10) || 10)} disabled={loading}>Donate civilians</Button>
          </div>
        </div>
      )}

      {activeTab === 'armoury' && (
        <div className="tab-content">
          <h3>Clan Armoury</h3>
          <p>Attack: Lv.{clanData.clan.clanAttackLevel} (Progress: {clanData.clan.clanAttackProgress} / {nextStatCost(clanData.clan.clanAttackLevel)})</p>
          <p>Defense: Lv.{clanData.clan.clanDefenseLevel} (Progress: {clanData.clan.clanDefenseProgress} / {nextStatCost(clanData.clan.clanDefenseLevel)})</p>
          <label>
            Contribute Metal: <input type="number" value={clanStatAmount} onChange={e => setClanStatAmount(e.target.value)} min={1} />
          </label>
          <Button onClick={() => upgradeStat('attack', parseInt(clanStatAmount, 10) || 100)} disabled={loading}>Contribute to Attack</Button>
          <Button onClick={() => upgradeStat('defense', parseInt(clanStatAmount, 10) || 100)} disabled={loading}>Contribute to Defense</Button>
          {clanStatMsg && <p className="msg">{clanStatMsg}</p>}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="tab-content">
          <h3>War History</h3>
          {warHistory && warHistory.length > 0 ? (
            <div className="war-history-list">
              {warHistory.map(w => {
                const isAttacker = w.attackerClanId === clanId
                const opponentName = warClanNames[String(isAttacker ? w.defenderClanId : w.attackerClanId)] ?? 'Unknown'
                const won = w.winnerClanId === clanId
                return (
                  <div key={w.id} className={`war-history-entry ${won ? 'victory' : 'defeat'}`}>
                    <p><strong>{isAttacker ? 'Attacked' : 'Defended against'}</strong> {opponentName}</p>
                    <p>Rounds: {w.roundsWon}/{w.roundsCommitted} | Enslaved: {w.enslaved}</p>
                    <p className={won ? 'msg' : 'error'}>{won ? 'Victory' : 'Defeat'}</p>
                    <p className="date">{new Date(w.createdAt).toLocaleDateString()}</p>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="empty-message">No war history yet.</p>
          )}
        </div>
      )}

      {activeTab === 'members' && (
        <div className="tab-content">
          <h3>Members</h3>
          {clanData.members.length > 0 ? (
            <div className="clan-member-list">
              {clanData.members.map(m => (
                <ClanMemberCard
                  key={m.id}
                  member={m}
                  viewerRole={clanData.viewerRole}
                  viewerPlayerGameId={viewerPlayerGameId}
                  loading={loading}
                  onPromote={promoteMember}
                  onDemote={demoteMember}
                  onKick={kickMember}
                  onTransfer={transferOwnership}
                />
              ))}
            </div>
          ) : (
            <p className="empty-message">No members in this clan.</p>
          )}
        </div>
      )}
    </div>
  )
}