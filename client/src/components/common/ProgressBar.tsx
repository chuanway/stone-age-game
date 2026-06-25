interface ProgressBarProps {
  current: number
  max: number
  label?: string
}

export function ProgressBar({ current, max, label }: ProgressBarProps) {
  const pct = Math.min((current / max) * 100, 100)
  return (
    <div className="progress-bar">
      {label && <span className="progress-label">{label}</span>}
      <div className="progress-fill" style={{ width: `${pct}%` }} />
      <span className="progress-text">{current}/{max}</span>
    </div>
  )
}
