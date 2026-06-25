import { useState, useEffect } from 'react'
import { TIMER } from '../config/timer'
import { useGameStore } from '../store/gameStore'
import { startCountdown } from '../utils/countdown'

export function useDisplayCountdown(): number {
  const { serverRemainingMs } = useGameStore()
  const [displayMs, setDisplayMs] = useState(serverRemainingMs)

  useEffect(() => {
    setDisplayMs(serverRemainingMs)
    return startCountdown(serverRemainingMs, setDisplayMs, TIMER.COUNTDOWN_INTERVAL_MS)
  }, [serverRemainingMs])

  return displayMs
}
