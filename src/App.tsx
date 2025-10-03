import React from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import LoginScreen from './screens/LoginScreen'
import DashboardScreen from './screens/DashboardScreen'
import { Button, Container } from './components'

function Shell() {
  const { isAuthenticated, user, logout } = useAuth()
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
