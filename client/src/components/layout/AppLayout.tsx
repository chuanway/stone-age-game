import { Outlet } from 'react-router-dom'
import { TreeNav } from './TreeNav'
import { TopBar } from './TopBar'
import { navTree } from '../../config/navigation'

export function AppLayout() {
  return (
    <div className="app-layout">
      <aside className="sidebar">
        <TreeNav nodes={navTree} />
      </aside>
      <div className="app-layout-body">
        <TopBar />
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
