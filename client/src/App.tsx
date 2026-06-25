import { Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { PageShell } from './components/layout/PageShell'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { HomePage } from './pages/HomePage'
import { CityPage } from './pages/CityPage'
import { PlayerPvePage } from './pages/PlayerPvePage'
import { PvpPage } from './pages/PvpPage'
import { ClansPage } from './pages/ClansPage'
import { MyClanPage } from './pages/MyClanPage'
import { ClanPvePage } from './pages/ClanPvePage'
import { ClanWarPage } from './pages/ClanWarPage'
import { ProfilePage } from './pages/ProfilePage'
import { GamePage } from './pages/GamePage'

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
        </Route>

        <Route element={<PageShell />}>
          <Route path="/profile" element={<ProfilePage />} />

          <Route path="/game" element={<GamePage />}>
            <Route index element={<Navigate to="/game/city" replace />} />

            <Route path="city" element={<CityPage />}>
              <Route path="pve" element={<PlayerPvePage />} />
              <Route path="pvp" element={<PvpPage />} />
            </Route>

            <Route path="clans" element={<ClansPage />}>
              <Route path="my" element={<MyClanPage />} />
              <Route path="pve" element={<ClanPvePage />} />
              <Route path="war" element={<ClanWarPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/game/city" replace />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
