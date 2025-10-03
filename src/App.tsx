import React, { useEffect } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import LoginScreen from './screens/LoginScreen'
import DashboardScreen from './screens/DashboardScreen'
import { Button, Container } from './components'

function Shell() {
  const { isAuthenticated, user, logout } = useAuth()
  useEffect(() => {
    if (!isAuthenticated && window.location.pathname !== '/login') {
      window.history.replaceState({}, '', '/login')
    }
  }, [isAuthenticated])
  if (!isAuthenticated) return <LoginScreen />
  return (
    <div>
      <DashboardScreen />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  )
}
