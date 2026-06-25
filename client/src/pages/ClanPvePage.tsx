import { useState, useEffect } from 'react'
import { List } from '../components/common/List'
import { ClanPveMonsterCard } from '../components/game/ClanPveMonsterCard'
import { ClanPveBattleCard } from '../components/game/ClanPveBattleCard'
import { api } from '../services/api'
import { useClan } from '../hooks/useClan'
import { useGameStore } from '../store/gameStore'
import type { MonsterConfig } from 'shared'

export function ClanPvePage() {
  const {
    gameId, clanId, loading, error,
    monsterStatus, attackResult, collectResult, defeatedMonsterId,
    loadMonsterStatus, startMonsterFight, attackMonster, collectMonsterLoot,
  } = useClan()

  const playerGame = useGameStore(s => s.playerGame)
  const clanData = useGameStore(s => s.clanData)
  const myMember = clanData?.members.find(m => m.playerGameId === playerGame?.id)
  const clanEnergy = myMember?.clanEnergy ?? 0
  const clanMaxEnergy = myMember?.clanMaxEnergy ?? 100

  const [monsters, setMonsters] = useState<MonsterConfig[]>([])
  const [monsterId, setMonsterId] = useState('wolf')

  useEffect(() => {
    api.monsters.list().then(setMonsters).catch(() => {})
  }, [])

  useEffect(() => {
    if (!gameId || !clanId) return
    loadMonsterStatus()
    const interval = setInterval(loadMonsterStatus, 10000)
    return () => clearInterval(interval)
  }, [gameId, clanId, loadMonsterStatus])

  if (!gameId || !clanId) return null

  const monster = monsterStatus
  const monsterName = monster ? monsters.find(m => m.id === monster.monsterId)?.name ?? monster.monsterId : ''
  const monsterDef = monster ? monsters.find(m => m.id === monster.monsterId) : undefined

  const collectNotification = collectResult?.success && defeatedMonsterId
    ? { monsterId: defeatedMonsterId, loot: collectResult.loot }
    : null

  return (
    <div className="clan-pve-page">
      <h2>Clan PvE</h2>
      {error && <p className="error">{error}</p>}

      {!monster ? (
        <div>
          <p>No active PvE fight. Choose a monster to fight as clan leader:</p>
          <List
            items={monsters}
            emptyMessage="No monsters available."
            renderItem={(monster) => (
              <ClanPveMonsterCard key={monster.id} monster={monster} onStart={(id) => startMonsterFight(id)} disabled={loading} collectNotification={collectNotification} />
            )}
          />
        </div>
      ) : (
        <ClanPveBattleCard
          monster={monster}
          monsterName={monsterName}
          monsterAttack={monsterDef?.attack ?? 0}
          monsterDefense={monsterDef?.defense ?? 0}
          monsterMinArmy={monsterDef?.minArmyPerRound ?? 0}
          attackResult={attackResult}
          collectResult={collectResult}
          loading={loading}
          onAttack={attackMonster}
          onCollect={collectMonsterLoot}
          playerEnergy={clanEnergy}
          playerMaxEnergy={clanMaxEnergy}
        />
      )}
    </div>
  )
}
