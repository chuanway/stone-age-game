import { PvPBattleResponse } from 'shared'

interface PvpReportProps {
  result: PvPBattleResponse
}

export function PvpReport({ result }: PvpReportProps) {
  return (
    <div className="pvp-report">
      <p>Bracket: {result.bracket}</p>
      <p>Opponent: {result.targetName ?? 'Unknown'}</p>
      <p>Outcome: {result.success ? 'Victory' : 'Defeat'}</p>
      <p>Civilians enslaved: {result.civiliansEnslaved}</p>
      <p>Army lost: {result.armyLost}</p>
    </div>
  )
}
