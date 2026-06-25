import { useEffect } from 'react'
import { api } from '../services/api'
import { now } from '../utils/date'
import { TIMER } from '../config/timer'
import { useGameStore } from '../store/gameStore'

export function useResourceTick() {
  const { serverRemainingMs, gameId, setTickData, setResource, setSyncFailed, setSyncRetryCount } = useGameStore()
  const resetSyncState = (isSyncFail?: boolean) => {
    setSyncFailed(isSyncFail)
    setSyncRetryCount(0)
  }

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>
    let cancelled = false
    let fetching = false
    let retryCount = 0

    async function fetchTick() {
      if (!gameId || cancelled || fetching) return
      fetching = true
      try {
        const startTime = now()
        const pgRes = await api.playerGame.get(gameId)
        if (cancelled) return

        // Roundtrip takes twice the amount of time
        const latency = now() - startTime
        const trueRemainingMs = pgRes.serverRemainingMs - Math.floor(latency / 2)

        if (trueRemainingMs > 0 && trueRemainingMs <= TIMER.EARLY_FETCH_THRESHOLD_MS) {
          // In the case of early (until a threhold) client side tick, set the next tick according to the gap
          setTickData(pgRes.tickIntervalMs, pgRes.serverRemainingMs)
          resetSyncState(false)
          timeoutId = setTimeout(fetchTick, Math.max(trueRemainingMs, TIMER.MIN_SCHEDULE_DELAY_MS))
        } else {
          // Update resources if client side is equal to, or already past server side tick
          const resourceRes = await api.playerGame.getResource(gameId)
          if (cancelled) return
          setResource(resourceRes.resource)
          setTickData(pgRes.tickIntervalMs, pgRes.serverRemainingMs)
          resetSyncState(false)
        }
      } catch (error) {
        console.error("Failed to sync tick:", error)
        if (!cancelled && retryCount++ < TIMER.MAX_RETRY_COUNT) {
          setSyncRetryCount(retryCount)
          timeoutId = setTimeout(fetchTick, TIMER.RETRY_DELAY_MS)
        } else if (!cancelled) {
          retryCount = 0
          resetSyncState(true)
        }
      } finally {
        fetching = false
      }
    }

    if (serverRemainingMs <= 0) {
      fetchTick()
    } else {
      timeoutId = setTimeout(fetchTick, serverRemainingMs)
    }

    return () => {
      cancelled = true
      clearTimeout(timeoutId)
    }
  }, [serverRemainingMs, gameId, setTickData, setResource])
}
