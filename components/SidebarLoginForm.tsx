'use client'

import { signIn } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function SidebarLoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn.email({
        email,
        password,
      })

      if (result.error) {
        setError(result.error.message || 'Login failed. Please check your credentials.')
        setLoading(false)
        return
      }

      router.push('/home.php')
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div id="squicklogin">
      {error && (
        <div
          style={{
            color: '#d00',
            fontSize: '11px',
            marginBottom: '5px',
            padding: '3px',
            border: '1px solid #d00',
            backgroundColor: '#fdd',
          }}
        >
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <label htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          name="email"
          className="inputtext"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          required
        />
        <label htmlFor="password">Password</label>
        <input
          type="password"
          id="password"
          name="password"
          className="inputtext"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          required
        />
        <label style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            disabled={loading}
            style={{ marginRight: '4px' }}
          />
          <span style={{ fontSize: '10px' }}>Remember me</span>
        </label>
        <input
          type="submit"
          value="Login"
          className="inputsubmit"
          disabled={loading}
        />
      </form>
    </div>
  )
}
