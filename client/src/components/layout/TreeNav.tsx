import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useGameStore } from '../../store/gameStore'
import type { NavNode } from '../../config/navigation'

interface TreeNavProps {
  nodes: NavNode[]
}

function isDescendant(node: NavNode, currentPath: string): boolean {
  if (!node.path) return false
  if (node.path === '/') return currentPath === '/'
  return currentPath.startsWith(node.path)
}

function TreeNavItem({ node, depth, currentPath, clanId }: { node: NavNode; depth: number; currentPath: string; clanId: number | null }) {
  const navigate = useNavigate()
  const token = useGameStore(s => s.token)
  const [expanded, setExpanded] = useState(isDescendant(node, currentPath))

  useEffect(() => {
    if (isDescendant(node, currentPath)) {
      setExpanded(true)
    }
  }, [currentPath])

  if (node.requiresAuth && !token) return null
  if (node.requiresGuest && !!token) return null
  if (node.requiresClan && !clanId) return null

  const active = currentPath === node.path

  function visibleChildren(): NavNode[] {
    if (!node.children) return []
    return node.children.filter(child => {
      if (child.requiresAuth && !token) return false
      if (child.requiresGuest && !!token) return false
      if (child.requiresClan && !clanId) return false
      return true
    })
  }

  const shown = visibleChildren()
  const hasVisible = shown.length > 0

  function handleClick() {
    if (node.path) navigate(node.path)
  }

  function handleToggle(e: React.MouseEvent) {
    e.stopPropagation()
    setExpanded(!expanded)
  }

  return (
    <div>
      <div
        className={`tree-nav-link ${active ? 'tree-nav-active' : ''}`}
        style={{ paddingLeft: `${16 + depth * 20}px` }}
        onClick={handleClick}
      >
        {hasVisible ? (
          <span className="tree-nav-toggle" onClick={handleToggle}>
            {expanded ? '▼' : '▶'}
          </span>
        ) : (
          <span className="tree-nav-bullet">•</span>
        )}
        <span className="tree-nav-label">{node.label}</span>
      </div>
      {hasVisible && expanded && (
        <div>
          {shown.map((child, i) => (
            <TreeNavItem key={child.path || i} node={child} depth={depth + 1} currentPath={currentPath} clanId={clanId} />
          ))}
        </div>
      )}
    </div>
  )
}

export function TreeNav({ nodes }: TreeNavProps) {
  const location = useLocation()
  const clanId = useGameStore(s => s.clanId)

  return (
    <nav className="tree-nav">
      {nodes.map((node, i) => (
        <TreeNavItem key={node.path || i} node={node} depth={0} currentPath={location.pathname} clanId={clanId} />
      ))}
    </nav>
  )
}
