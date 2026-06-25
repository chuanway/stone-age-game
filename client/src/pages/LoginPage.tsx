import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/common/Button'
import { useAuth } from '../hooks/useAuth'

export function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{ username?: string; password?: string }>({})
  const { login, loading, error } = useAuth()
  const navigate = useNavigate()

  function validate(): boolean {
    const errors: { username?: string; password?: string } = {}
    if (!username.trim()) errors.username = 'Username is required'
    if (!password) errors.password = 'Password is required'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit() {
    if (!validate()) return
    const ok = await login(username, password)
    if (ok) navigate('/game/city')
  }

  return (
    <div className="auth-page">
      <h1>Login</h1>
      {error && <p className="error">{error}</p>}
      <div className="field">
        <input
          placeholder="Username"
          value={username}
          onChange={e => { setUsername(e.target.value); setFieldErrors(prev => ({ ...prev, username: undefined })) }}
          className={fieldErrors.username ? 'input-error' : ''}
        />
        {fieldErrors.username && <p className="field-error">{fieldErrors.username}</p>}
      </div>
      <div className="field">
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => { setPassword(e.target.value); setFieldErrors(prev => ({ ...prev, password: undefined })) }}
          className={fieldErrors.password ? 'input-error' : ''}
        />
        {fieldErrors.password && <p className="field-error">{fieldErrors.password}</p>}
      </div>
      <Button onClick={handleSubmit} disabled={loading}>{loading ? 'Logging in...' : 'Login'}</Button>
      <Link to="/register">Register</Link>
    </div>
  )
}
