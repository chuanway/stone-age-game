import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { BuildingList } from '../components/game/BuildingList'
import { Tabs, TabItem } from '../components/common/Tabs'
import { usePlayer } from '../hooks/usePlayer'
import { useGameStore } from '../store/gameStore'
import { api } from '../services/api'
import { Button } from '../components/common/Button'
import { formatResource } from '../values/resourceValues'

type CityTab = 'buildings' | 'barracks' | 'armoury'

export function CityPage() {
  const { player, buildings, loading, refresh } = usePlayer()
  const resource = useGameStore(s => s.resource)
  const playerGame = useGameStore(s => s.playerGame)
  const buildable = useGameStore(s => s.buildable)
  const gameId = useGameStore(s => s.gameId)
  const location = useLocation()
  const [activeTab, setActiveTab] = useState<CityTab>('buildings')
  const [convertAmount, setConvertAmount] = useState('5')
  const [convertMsg, setConvertMsg] = useState<string | null>(null)
  const [armouryMsg, setArmouryMsg] = useState<string | null>(null)

  useEffect(() => {
    refresh()
  }, [])

  async function handleUpgrade(type: string) {
    if (!gameId) return
    await api.buildings.upgrade(gameId, type)
    refresh()
  }

  async function handleBuild(type: string) {
    if (!gameId) return
    await api.buildings.create(gameId, type)
    refresh()
  }

  async function handleConvert() {
    if (!gameId) return
    setConvertMsg(null)
    try {
      const res = await api.buildings.convert(gameId, parseInt(convertAmount, 10) || 5)
      if (res.success) {
        setConvertMsg(`Converted ${convertAmount} civilians to soldiers`)
        refresh()
      }
    } catch (e: any) {
      setConvertMsg(e.message)
    }
  }

  async function handleUpgradeStat(stat: 'attack' | 'defense') {
    if (!gameId) return
    setArmouryMsg(null)
    try {
      const res = await api.buildings.upgradeStat(gameId, stat)
      if (res.success) {
        setArmouryMsg(`${stat} upgraded!`)
        refresh()
      }
    } catch (e: any) {
      setArmouryMsg(e.message)
    }
  }

  const hasBarracks = buildings.some(b => b.type === 'barracks')
  const hasArmoury = buildings.some(b => b.type === 'armoury')
  const isIndex = location.pathname === '/game/city'

  const tabs: TabItem[] = [
    { key: 'buildings', label: 'Buildings', visible: true },
    { key: 'barracks', label: 'Barracks', visible: hasBarracks },
    { key: 'armoury', label: 'Armoury', visible: hasArmoury },
  ]

  return (
    <div className="city-page">
      <h2>City</h2>

      {isIndex ? (
        <>
          {loading && !player ? <p>Loading...</p> : (
            <>
              <Tabs tabs={tabs} activeKey={activeTab} onChange={setActiveTab} />

              {activeTab === 'buildings' && (
                <div className="tab-content">
                  <BuildingList buildings={buildings} buildable={buildable} onUpgrade={handleUpgrade} onBuild={handleBuild} />
                </div>
              )}

              {activeTab === 'barracks' && (
                <div className="tab-content">
                  <h3>Barracks</h3>
                  <div className="barracks-section">
                    <label>
                      Convert <input type="number" value={convertAmount} onChange={e => setConvertAmount(e.target.value)} min={1} max={resource?.civilians ?? 0} /> civilians to soldiers
                    </label>
                    <Button onClick={handleConvert}>Convert to Soldiers</Button>
                    {convertMsg && <p className="msg">{convertMsg}</p>}
                  </div>
                </div>
              )}

              {activeTab === 'armoury' && playerGame && (
                <div className="tab-content">
                  <h3>Armoury</h3>
                  <div className="armoury-section">
                    <p>Attack: {playerGame.attackStat} | Defense: {playerGame.defenseStat}</p>
                    <div className="armoury-upgrades">
                      <Button onClick={() => handleUpgradeStat('attack')}>+1 Attack ({formatResource('metal', Math.floor(50 * Math.pow(1.5, playerGame.attackStat - 1)))})</Button>
                      <Button onClick={() => handleUpgradeStat('defense')}>+1 Defense ({formatResource('metal', Math.floor(50 * Math.pow(1.5, playerGame.defenseStat - 1)))})</Button>
                    </div>
                    {armouryMsg && <p className="msg">{armouryMsg}</p>}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      ) : (
        <Outlet />
      )}
    </div>
  )
}
