import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, useRef } from 'react'
import { AuthenticationApi, Configuration, type AuthLoggedUser, type AuthLoginRequest } from '../services'
import axios from 'axios'

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
  logout: (reason?: string) => void
  getApiConfig: () => Configuration
  getAuthorizationHeaderValue: () => string
  logoutNotice: string | null
  clearLogoutNotice: () => void
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
  const didSetupInterceptors = useRef(false)
  const [logoutNotice, setLogoutNotice] = useState<string | null>(null)

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

  const getAuthorizationHeaderValue = useCallback(() => {
    return state.accessToken ? `Bearer ${state.accessToken}` : ''
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
      setLogoutNotice(null)
      // Redireciona para o dashboard se estiver no /login
      if (window.location.pathname === '/login') {
        window.history.replaceState({}, '', '/dashboard')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback((reason?: string) => {
    setState({ accessToken: null, refreshToken: null, user: null })
    clearStorage()
    setLogoutNotice(reason ?? null)
    if (window.location.pathname !== '/login') {
      window.history.replaceState({}, '', '/login')
    }
  }, [])

  const clearLogoutNotice = useCallback(() => setLogoutNotice(null), [])

  // Globally intercept 401 responses to force logout (sessão expirada)
  useEffect(() => {
    if (didSetupInterceptors.current) return
    didSetupInterceptors.current = true
    const isUnauthorizedBody = (data: any) => {
      try {
        const raw = data?.code ?? data?.error?.code ?? data?.status ?? data?.error?.status ?? data?.error_code
        if (raw === undefined || raw === null) return false
        const num = Number(raw)
        if (!Number.isNaN(num) && num === 401) return true
        const code = String(raw).toUpperCase()
        return code === 'UNAUTHORIZED' || code === 'UNAUTHENTICATED'
      } catch {
        return false
      }
    }

    const id = axios.interceptors.response.use(
      (response) => {
        // Alguns endpoints podem responder 200 com { code: 'UNAUTHORIZED' }
        if (isUnauthorizedBody(response?.data)) {
          logout('Sessão expirada. Inicie sessão novamente.')
          return Promise.reject(new Error('UNAUTHORIZED'))
        }
        return response
      },
      (error) => {
        const status = error?.response?.status
        const data = error?.response?.data
        if (status === 401 || isUnauthorizedBody(data)) {
          // Limpa sessão e deixa o App renderizar o LoginScreen
          logout('Sessão expirada. Inicie sessão novamente.')
        }
        return Promise.reject(error)
      }
    )
    return () => {
      axios.interceptors.response.eject(id)
    }
  }, [logout])

  const value = useMemo<AuthContextType>(
    () => ({
      isAuthenticated: Boolean(state.accessToken),
      user: state.user,
      loading,
      login,
      logout,
      getApiConfig,
      getAuthorizationHeaderValue,
      logoutNotice,
      clearLogoutNotice
    }),
    [state.accessToken, state.user, loading, login, logout, getApiConfig, getAuthorizationHeaderValue, logoutNotice, clearLogoutNotice]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
