import React, { useState } from 'react'
import { Container, Card, Heading, Text, Button } from '../components'
import { useAuth } from '../contexts/AuthContext'

export default function LoginScreen() {
  const { login, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!email || !password) {
      setError('Please enter email and password')
      return
    }
    try {
      await login({ email, password })
    } catch (err: any) {
      setError(err?.message || 'Failed to login')
    }
  }

  return (
    <Container>
      <div style={{ display: 'flex', minHeight: '60vh', alignItems: 'center', justifyContent: 'center' }}>
        <Card>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 320 }}>
            <Heading>Sign in</Heading>
            <Text>Use your account credentials to continue.</Text>
            {error ? (
              <div style={{ background: '#fee2e2', color: '#991b1b', padding: 8, borderRadius: 6 }}>{error}</div>
            ) : null}
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 12, color: '#374151' }}>Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                style={{ padding: 8, borderRadius: 6, border: '1px solid #d1d5db' }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 12, color: '#374151' }}>Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{ padding: 8, borderRadius: 6, border: '1px solid #d1d5db' }}
              />
            </label>
            <Button type="submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </Card>
      </div>
    </Container>
  )
}
