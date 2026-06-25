import { create } from 'zustand'
import { Player, ResourceDelta, PlayerBuilding, PlayerBuildableBuilding, ClanResponse } from 'shared'

interface GameState {
  token: string | null
  gameId: number | null
  player: Player | null
  playerGame: import('shared').PlayerGame | null
  resource: import('shared').PlayerResource | null
  buildings: PlayerBuilding[]
  buildable: PlayerBuildableBuilding[]
  tickIntervalMs: number
  serverRemainingMs: number
  productionRates: ResourceDelta
  clanId: number | null
  clanData: ClanResponse | null
  activationStatus: boolean | null
  setToken: (token: string | null) => void
  setGameId: (gameId: number | null) => void
  setPlayer: (player: Player | null) => void
  setPlayerGame: (playerGame: import('shared').PlayerGame | null) => void
  setResource: (resource: import('shared').PlayerResource | null) => void
  setBuildings: (buildings: PlayerBuilding[]) => void
  setBuildable: (buildable: PlayerBuildableBuilding[]) => void
  setTickData: (tickIntervalMs: number, serverRemainingMs: number) => void
  setProductionRates: (rates: ResourceDelta) => void
  setClanId: (clanId: number | null) => void
  setClanData: (clanData: ClanResponse | null) => void
  setActivationStatus: (status: boolean | null) => void
  syncFailed: boolean
  setSyncFailed: (failed: boolean) => void
  syncRetryCount: number
  setSyncRetryCount: (count: number) => void
}

function decodeGameIdFromToken(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return (payload.gameId as number) ?? null
  } catch {
    return null
  }
}

const savedToken = localStorage.getItem('token')

export const useGameStore = create<GameState>((set) => ({
  token: savedToken,
  gameId: savedToken ? decodeGameIdFromToken(savedToken) : null,
  player: null,
  playerGame: null,
  resource: null,
  buildings: [],
  buildable: [],
  tickIntervalMs: 0,
  serverRemainingMs: 0,
  productionRates: { food: 0, wood: 0, metal: 0, civilians: 0, soldiers: 0 },
  clanId: null,
  clanData: null,
  activationStatus: null,
  syncFailed: false,
  syncRetryCount: 0,
  setToken: (token) => {
    localStorage.setItem('token', token || '')
    set({ token, gameId: token ? decodeGameIdFromToken(token) : null, clanId: null })
  },
  setGameId: (gameId) => set({ gameId }),
  setPlayer: (player) => set({ player }),
  setPlayerGame: (playerGame) => set({ playerGame }),
  setResource: (resource) => set({ resource }),
  setBuildings: (buildings) => set({ buildings }),
  setBuildable: (buildable) => set({ buildable }),
  setTickData: (tickIntervalMs, serverRemainingMs) => set({ tickIntervalMs, serverRemainingMs }),
  setProductionRates: (productionRates) => set({ productionRates }),
  setClanId: (clanId) => {
    set({ clanId })
  },
  setClanData: (clanData) => set({ clanData }),
  setActivationStatus: (activationStatus) => set({ activationStatus }),
  setSyncFailed: (syncFailed) => set({ syncFailed }),
  setSyncRetryCount: (syncRetryCount) => set({ syncRetryCount }),
}))
