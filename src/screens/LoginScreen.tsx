import React, { useState } from 'react'
import { Card, Heading, Text, Button } from '../components'
import logoSrc from '../images/logo.png'
import loginPhoto from '../images/login_photo.jpg'
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
      setError('Introduza o email e a palavra‑passe')
      return
    }
    try {
      await login({ email, password })
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 401) {
        setError('Credenciais inválidas. Verifique o email e a palavra‑passe.')
      } else if (status === 400) {
        setError('Pedido inválido. Verifique os dados introduzidos.')
      } else if (typeof status === 'number' && status >= 500) {
        setError('Ocorreu um erro no servidor. Tente novamente mais tarde.')
      } else if (!status) {
        setError('Não foi possível ligar ao servidor. Verifique a sua ligação.')
      } else {
        setError('Falha ao iniciar sessão')
      }
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fff' }} className="auth-grid">
      {/* Coluna esquerda (formulário) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', padding: '48px clamp(40px, 6vw, 80px)' }}>
        <div style={{ width: '100%', maxWidth: 500 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
            <img src={logoSrc} alt="EDM" style={{ height: 56 }} />
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
              <span style={{ fontWeight: 700 }}>EDM</span>
              <span style={{ color: '#6b7280', fontSize: 13 }}>Sistema de analise de dados da DPRP</span>
            </div>
          </div>
          <Card style={{ padding: 32 }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <Heading level={1}>Iniciar sessão</Heading>
              <Text>Utilize as suas credenciais para continuar.</Text>
              {error ? (
                <div style={{ background: '#fee2e2', color: '#991b1b', padding: 10, borderRadius: 8 }}>{error}</div>
              ) : null}
              <div style={{ width: '100%', maxWidth: 420 }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={{ fontSize: 13, color: '#374151' }}>Email</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="utilizador@exemplo.com"
                    required
                    style={{ padding: 16, borderRadius: 10, border: '1px solid #d1d5db', width: '100%' }}
                  />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                  <span style={{ fontSize: 13, color: '#374151' }}>Palavra‑passe</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    style={{ padding: 16, borderRadius: 10, border: '1px solid #d1d5db', width: '100%' }}
                  />
                </label>
                <div style={{ marginTop: 16 }}>
                  <Button type="submit" disabled={loading} fullWidth>
                    {loading ? 'A iniciar sessão…' : 'Iniciar sessão'}
                  </Button>
                </div>
              </div>
            </form>
          </Card>
        </div>
      </div>
      {/* Coluna direita (imagem 65%) */}
      <div
        aria-hidden
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.25), rgba(0,0,0,0.25)), url(${loginPhoto})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          minHeight: '100vh'
        }}
        className="login-bg"
      />
    </div>
  )
}
