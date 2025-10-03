import React from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import LoginScreen from './screens/LoginScreen'
import DashboardScreen from './screens/DashboardScreen'
import { Button, Container } from './components'

function Shell() {
  const { isAuthenticated, user, logout } = useAuth()
  if (!isAuthenticated) return <LoginScreen />
  return (
    <Container>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1>Gestão de Vandalizações EDM</h1>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ color: '#374151' }}>{user?.name || user?.email}</span>
          <Button variant="secondary" onClick={logout}>Terminar sessão</Button>
        </div>
      </div>
      <DashboardScreen />
    </Container>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  )
}
