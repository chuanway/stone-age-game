import { useResourceTick } from '../../hooks/useResourceTick'
import { useDisplayCountdown } from '../../hooks/useDisplayCountdown'
import { formatTime } from '../../utils/date'

export function TickTimer() {
  const displayMs = useDisplayCountdown()
  useResourceTick()

  return <span className="tick-timer">Next tick in: {formatTime(displayMs)}</span>
}
