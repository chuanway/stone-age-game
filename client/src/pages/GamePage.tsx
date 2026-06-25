import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { ResourceBar } from '../components/common/ResourceBar'
import { useGameStore } from '../store/gameStore'
import { usePlayer } from '../hooks/usePlayer'

export function GamePage() {
  const resource = useGameStore(s => s.resource)
  const productionRates = useGameStore(s => s.productionRates)
  const gameId = useGameStore(s => s.gameId)
  const { refresh } = usePlayer()

  useEffect(() => {
    if (!gameId) return
    refresh()
  }, [gameId])

  return (
    <>
      {resource && (
        <ResourceBar
          food={resource.food}
          wood={resource.wood}
          metal={resource.metal}
          civilians={resource.civilians}
          soldiers={resource.soldiers}
          rates={productionRates}
        />
      )}
      <Outlet />
    </>
  )
}
