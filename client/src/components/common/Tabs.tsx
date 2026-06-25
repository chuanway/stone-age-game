export interface TabItem {
  key: string
  label: string
  visible?: boolean
}

interface TabsProps {
  tabs: TabItem[]
  activeKey: string
  onChange: (key: string) => void
}

export function Tabs({ tabs, activeKey, onChange }: TabsProps) {
  const visible = tabs.filter(t => t.visible !== false)
  return (
    <div className="tabs">
      {visible.map(t => (
        <button
          key={t.key}
          className={`tab ${activeKey === t.key ? 'tab-active' : ''}`}
          onClick={() => onChange(t.key)}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
