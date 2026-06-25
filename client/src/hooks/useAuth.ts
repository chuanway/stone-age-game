import { useState } from 'react'
import { api } from '../services/api'
import { useGameStore } from '../store/gameStore'

export function useAuth() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { token, setToken, setPlayer, setClanId } = useGameStore()

  async function login(username: string, password: string): Promise<boolean> {
    setLoading(true)
    setError(null)
    try {
      const res = await api.auth.login(username, password)
      localStorage.setItem('token', res.token)
      setToken(res.token)
      setPlayer(res.player)
      setClanId(res.clanId ?? null)
      return true
    } catch (e: any) {
      setError(e.message)
      return false
    } finally {
      setLoading(false)
    }
  }

  async function register(username: string, password: string): Promise<boolean> {
    setLoading(true)
    setError(null)
    try {
      const res = await api.auth.register(username, password)
      localStorage.setItem('token', res.token)
      setToken(res.token)
      setPlayer(res.player)
      setClanId(res.clanId ?? null)
      return true
    } catch (e: any) {
      setError(e.message)
      return false
    } finally {
      setLoading(false)
    }
  }

  function logout(): void {
    localStorage.removeItem('token')
    setToken(null)
    setPlayer(null)
    setClanId(null)
  }

  return { token, loading, error, login, register, logout }
}
