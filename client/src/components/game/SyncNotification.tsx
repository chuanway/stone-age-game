import { useGameStore } from '../../store/gameStore'

export function SyncNotification() {
  const syncFailed = useGameStore(s => s.syncFailed)
  const syncRetryCount = useGameStore(s => s.syncRetryCount)

  if (syncFailed) {
    return (
      <span className="tick-error" onClick={() => location.reload()} title="Click to refresh page">
        ⚠ Connection lost
      </span>
    )
  }

  if (syncRetryCount > 0) {
    return (
      <span className="tick-retrying">
        Retries: {syncRetryCount}/5
      </span>
    )
  }

  return null
}
