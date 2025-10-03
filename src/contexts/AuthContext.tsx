import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { AuthenticationApi, Configuration, type AuthLoggedUser, type AuthLoginRequest } from '../services'

type AuthState = {
  accessToken: string | null
  refreshToken: string | null
  user: AuthLoggedUser | null
}

export type AuthContextType = {
  isAuthenticated: boolean
  user: AuthLoggedUser | null
  loading: boolean
  login: (payload: AuthLoginRequest) => Promise<void>
  logout: () => void
  getApiConfig: () => Configuration
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

const ACCESS_KEY = 'auth.access_token'
const REFRESH_KEY = 'auth.refresh_token'
const USER_KEY = 'auth.user'

function loadFromStorage(): AuthState {
  const accessToken = localStorage.getItem(ACCESS_KEY)
  const refreshToken = localStorage.getItem(REFRESH_KEY)
  const userRaw = localStorage.getItem(USER_KEY)
  return {
    accessToken,
    refreshToken,
    user: userRaw ? (JSON.parse(userRaw) as AuthLoggedUser) : null
  }
}

function saveToStorage(state: AuthState) {
  if (state.accessToken) localStorage.setItem(ACCESS_KEY, state.accessToken)
  if (state.refreshToken) localStorage.setItem(REFRESH_KEY, state.refreshToken)
  if (state.user) localStorage.setItem(USER_KEY, JSON.stringify(state.user))
}

function clearStorage() {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
  localStorage.removeItem(USER_KEY)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(() => loadFromStorage())
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // keep storage in sync when state changes
    if (state.accessToken && state.user) {
      saveToStorage(state)
    }
  }, [state])

  const getApiConfig = useCallback(() => {
    const basePath = (import.meta as any).env?.VITE_API_BASE_URL || '/api'
    return new Configuration({
      basePath,
      // generated client expects Authorization header via apiKey for BearerAuth
      apiKey: () => (state.accessToken ? `Bearer ${state.accessToken}` : '')
    })
  }, [state.accessToken])

  const login = useCallback(async (payload: AuthLoginRequest) => {
    setLoading(true)
    try {
      const api = new AuthenticationApi(new Configuration({ basePath: (import.meta as any).env?.VITE_API_BASE_URL || '/api' }))
      const { data } = await api.publicAuthLoginPost(payload)
      const accessToken = data.access_token ?? null
      const refreshToken = data.refresh_token ?? null
      const user = (data.user as AuthLoggedUser) ?? null
      if (!accessToken || !user) {
        throw new Error('Invalid login response')
      }
      const next: AuthState = { accessToken, refreshToken, user }
      setState(next)
      saveToStorage(next)
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    setState({ accessToken: null, refreshToken: null, user: null })
    clearStorage()
  }, [])

  const value = useMemo<AuthContextType>(
    () => ({
      isAuthenticated: Boolean(state.accessToken),
      user: state.user,
      loading,
      login,
      logout,
      getApiConfig
    }),
    [state.accessToken, state.user, loading, login, logout, getApiConfig]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
