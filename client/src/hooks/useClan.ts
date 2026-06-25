import { useState, useCallback, useRef } from 'react'
import { api } from '../services/api'
import { useGameStore } from '../store/gameStore'
import type { ClanPveAttackResponse, ClanPveCollectLootResponse, ClanWarResponse, ClanPveStatusResponse } from 'shared'

export function useClan() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const storeClanData = useGameStore(s => s.clanData)
  const storeActivationStatus = useGameStore(s => s.activationStatus)
  const setStoreClanData = useGameStore(s => s.setClanData)
  const setStoreActivationStatus = useGameStore(s => s.setActivationStatus)

  const [monsterStatus, setMonsterStatus] = useState<ClanPveStatusResponse['monster'] | null>(null)
  const [attackResult, setAttackResult] = useState<ClanPveAttackResponse | null>(null)
  const [collectResult, setCollectResult] = useState<ClanPveCollectLootResponse | null>(null)

  const [warResult, setWarResult] = useState<ClanWarResponse | null>(null)

  const [clanStatMsg, setClanStatMsg] = useState<string | null>(null)

  const [defeatedMonsterId, setDefeatedMonsterId] = useState<string | null>(null)

  const prevMonsterIdRef = useRef<number | null>(null)

  const storeGameId = useGameStore(s => s.gameId)
  const storeClanId = useGameStore(s => s.clanId)

  const gameId: number | null = storeGameId
  const clanId: number | null = storeClanId

  async function refreshClan(id?: number) {
    const cid = id ?? clanId
    if (!gameId || !cid) return
    setLoading(true)
    setError(null)
    try {
      const [clan, activation] = await Promise.all([
        api.clan.get(gameId, cid),
        api.clan.activation(gameId, cid),
      ])
      setStoreClanData(clan)
      setStoreActivationStatus(activation.activated)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function refreshResources() {
    if (!gameId) return
    const resourceRes = await api.playerGame.getResource(gameId)
    useGameStore.getState().setResource(resourceRes.resource)
  }

  const loadMonsterStatus = useCallback(async () => {
    if (!gameId || !clanId) return
    try {
      const status = await api.clan.pveStatus(gameId, clanId)
      const newMonster = status.monster ?? null
      if (newMonster && prevMonsterIdRef.current !== null && newMonster.id !== prevMonsterIdRef.current) {
        setAttackResult(null)
        setCollectResult(null)
      }
      if (!newMonster && prevMonsterIdRef.current !== null) {
        setAttackResult(null)
        setCollectResult(null)
      }
      prevMonsterIdRef.current = newMonster?.id ?? null
      setMonsterStatus(newMonster)
    } catch {
      // ignore polling errors
    }
  }, [gameId, clanId])

  async function startMonsterFight(monsterId: string) {
    if (!gameId || !clanId) return
    setLoading(true)
    setError(null)
    setDefeatedMonsterId(null)
    try {
      const res = await api.clan.pveStart(gameId, clanId, monsterId)
      setMonsterStatus(res)
      setAttackResult(null)
      setCollectResult(null)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function attackMonster(soldierCount: number) {
    if (!gameId || !clanId) return
    setLoading(true)
    setError(null)
    setAttackResult(null)
    setCollectResult(null)
    try {
      const res = await api.clan.pveAttack(gameId, clanId, soldierCount)
      setAttackResult(res)
      if (res.monsterDefeated && monsterStatus?.monsterId) {
        setDefeatedMonsterId(monsterStatus.monsterId)
      }
      await refreshResources()
      loadMonsterStatus()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function collectMonsterLoot() {
    if (!gameId || !clanId) return
    setLoading(true)
    setError(null)
    setCollectResult(null)
    try {
      const res = await api.clan.pveCollect(gameId, clanId)
      setCollectResult(res)
      if (res.success) {
        await refreshResources()
        await loadMonsterStatus()
      }
    } catch (e: any) {
      setCollectResult({ success: false, error: e.message, loot: null })
    } finally {
      setLoading(false)
    }
  }

  async function declareWar(targetClanId: number, army: number) {
    if (!gameId || !clanId) return
    setLoading(true)
    setError(null)
    setWarResult(null)
    try {
      const res = await api.clan.war(gameId, clanId, targetClanId, army)
      setWarResult(res)
      await refreshResources()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function contribute(amount: number) {
    if (!gameId || !storeClanData) return
    setLoading(true)
    setError(null)
    try {
      await api.clan.contribute(gameId, storeClanData.clan.id, amount)
      await refreshResources()
      refreshClan(storeClanData.clan.id)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function upgradeStat(statType: import('shared').StatType, amount: number) {
    if (!gameId || !storeClanData) return
    setClanStatMsg(null)
    try {
      await api.clan.upgradeStat(gameId, storeClanData.clan.id, statType, amount)
      await refreshResources()
      refreshClan(storeClanData.clan.id)
      setClanStatMsg(`Contributed to clan ${statType} upgrade`)
    } catch (e: any) {
      setClanStatMsg(e.message)
    }
  }

  async function leaveClan() {
    if (!gameId || !clanId) return
    setLoading(true)
    setError(null)
    try {
      await api.clan.leave(gameId, clanId)
      useGameStore.getState().setClanId(null)
      useGameStore.getState().setClanData(null)
      useGameStore.getState().setActivationStatus(null)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function kickMember(targetPlayerGameId: number) {
    if (!gameId || !clanId) return
    setLoading(true)
    setError(null)
    try {
      await api.clan.kick(gameId, clanId, targetPlayerGameId)
      if (storeClanData) refreshClan()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function disbandClan() {
    if (!gameId || !clanId) return
    setLoading(true)
    setError(null)
    try {
      await api.clan.disband(gameId, clanId)
      useGameStore.getState().setClanId(null)
      useGameStore.getState().setClanData(null)
      useGameStore.getState().setActivationStatus(null)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function promoteMember(targetPlayerGameId: number) {
    if (!gameId || !clanId) return
    setLoading(true)
    setError(null)
    try {
      await api.clan.promote(gameId, clanId, targetPlayerGameId)
      if (storeClanData) refreshClan()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function demoteMember(targetPlayerGameId: number) {
    if (!gameId || !clanId) return
    setLoading(true)
    setError(null)
    try {
      await api.clan.demote(gameId, clanId, targetPlayerGameId)
      if (storeClanData) refreshClan()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function transferOwnership(targetPlayerGameId: number) {
    if (!gameId || !clanId) return
    setLoading(true)
    setError(null)
    try {
      await api.clan.transfer(gameId, clanId, targetPlayerGameId)
      if (storeClanData) refreshClan()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function upgradeBuilding(buildingType: import('shared').BuildingType, resource: import('shared').ResourceType, amount: number) {
    if (!gameId || !storeClanData) return
    setLoading(true)
    setError(null)
    try {
      await api.clan.upgradeBuilding(gameId, storeClanData.clan.id, buildingType, resource, amount)
      await refreshResources()
      refreshClan(storeClanData.clan.id)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function contributeResource(resource: import('shared').ResourceType, amount: number) {
    if (!gameId || !storeClanData) return
    setLoading(true)
    setError(null)
    try {
      await api.clan.contributeResource(gameId, storeClanData.clan.id, resource, amount)
      await refreshResources()
      refreshClan(storeClanData.clan.id)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return {
    clanData: storeClanData,
    activationStatus: storeActivationStatus,
    loading, setLoading,
    error, setError,
    gameId,
    clanId,
    refreshClan,
    refreshResources,
    monsterStatus,
    attackResult,
    collectResult,
    defeatedMonsterId,
    loadMonsterStatus,
    startMonsterFight,
    attackMonster,
    collectMonsterLoot,
    warResult,
    declareWar,
    clanStatMsg, setClanStatMsg,
    contribute,
    upgradeStat,
    upgradeBuilding,
    contributeResource,
    leaveClan,
    kickMember,
    disbandClan,
    promoteMember,
    demoteMember,
    transferOwnership,
  }
}
