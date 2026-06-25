import { PlayerPvEBattleResponse } from 'shared'
import { formatResource } from '../../values/resourceValues'

interface PlayerPveReportProps {
  result: PlayerPvEBattleResponse
}

export function PlayerPveReport({ result }: PlayerPveReportProps) {
  const nonZeroLoot = Object.entries(result.loot).filter(([, val]) => val > 0)

  return (
    <div className="player-pve-report">
      <p>Rounds won: {result.roundsWon}/{result.roundsCommitted}</p>
      <p>Army Lost: {result.armyLost}</p>
      {nonZeroLoot.length > 0 ? (
        <>
          <p>Loot:</p>
          {nonZeroLoot.map(([key, val]) => (
            <span key={key} className="loot-item">{formatResource(key, val)}</span>
          ))}
        </>
      ) : (
        <p>Loot: None</p>
      )}
    </div>
  )
}
