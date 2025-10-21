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
  getAuthorizationHeaderValueAsync: () => Promise<string>
  refreshTokenIfNeeded: () => Promise<void>
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
  const accessTokenRef = useRef<string | null>(null)
  const refreshTokenRef = useRef<string | null>(null)
  const lastRefreshAtRef = useRef<number>(0)
  const refreshInFlightRef = useRef<Promise<void> | null>(null)

  useEffect(() => {
    // keep storage in sync when state changes
    if (state.accessToken && state.user) {
      saveToStorage(state)
    }
    accessTokenRef.current = state.accessToken
    refreshTokenRef.current = state.refreshToken
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

  const logout = useCallback((reason?: string) => {
    setState({ accessToken: null, refreshToken: null, user: null })
    clearStorage()
    setLogoutNotice(reason ?? null)
    if (window.location.pathname !== '/login') {
      window.history.replaceState({}, '', '/login')
    }
  }, [])

  // Shared refresh logic (10 min cache)
  const refreshTokenIfNeeded = useCallback(async () => {
    const CACHE_MS = 10 * 60 * 1000
    try {
      const now = Date.now()
      const last = lastRefreshAtRef.current || 0
      if (now - last < CACHE_MS) return
      if (!refreshTokenRef.current) return
      if (refreshInFlightRef.current) { await refreshInFlightRef.current; return }
      const basePath = (import.meta as any).env?.VITE_API_BASE_URL || '/api'
      const authApi = new AuthenticationApi(new Configuration({ basePath }))
      const p = authApi.publicAuthRefreshPost({ refresh_token: refreshTokenRef.current }, { headers: { 'x-skip-auth-refresh': '1' } })
        .then(({ data }) => {
          const newAccess = data.access_token ?? null
          const newRefresh = data.refresh_token ?? refreshTokenRef.current
          if (!newAccess) throw new Error('Missing access token')
          const next: AuthState = { accessToken: newAccess, refreshToken: newRefresh ?? null, user: state.user }
          setState(next)
          saveToStorage(next)
          accessTokenRef.current = newAccess
          refreshTokenRef.current = newRefresh ?? null
          lastRefreshAtRef.current = Date.now()
        })
        .catch((err) => {
          logout('Sessão expirada. Inicie sessão novamente.')
          throw err
        })
        .finally(() => { refreshInFlightRef.current = null })
      refreshInFlightRef.current = p
      await p
    } catch {}
  }, [logout, state.user])

  const getAuthorizationHeaderValueAsync = useCallback(async () => {
    await refreshTokenIfNeeded()
    const token = accessTokenRef.current || state.accessToken
    return token ? `Bearer ${token}` : ''
  }, [refreshTokenIfNeeded, state.accessToken])

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
      accessTokenRef.current = accessToken
      refreshTokenRef.current = refreshToken
      lastRefreshAtRef.current = Date.now()
      // Redireciona para o dashboard se estiver no /login
      if (window.location.pathname === '/login') {
        window.history.replaceState({}, '', '/dashboard')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const clearLogoutNotice = useCallback(() => setLogoutNotice(null), [])

  // Globally ensure token freshness + intercept 401 to force logout
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

    const reqId = axios.interceptors.request.use(
      async (config) => {
        const skip = (config.headers as any)?.['x-skip-auth-refresh']
        if (!skip) {
          await refreshTokenIfNeeded()
        }
        const token = accessTokenRef.current
        if (token) {
          config.headers = { ...(config.headers || {}), Authorization: `Bearer ${token}` }
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    const resId = axios.interceptors.response.use(
      (response) => {
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
          logout('Sessão expirada. Inicie sessão novamente.')
        }
        return Promise.reject(error)
      }
    )

    return () => {
      axios.interceptors.request.eject(reqId)
      axios.interceptors.response.eject(resId)
    }
  }, [logout, state.user, refreshTokenIfNeeded])

  const value = useMemo<AuthContextType>(
    () => ({
      isAuthenticated: Boolean(state.accessToken),
      user: state.user,
      loading,
      login,
      logout,
      getApiConfig,
      getAuthorizationHeaderValue,
      getAuthorizationHeaderValueAsync,
      refreshTokenIfNeeded,
      logoutNotice,
      clearLogoutNotice
    }),
    [state.accessToken, state.user, loading, login, logout, getApiConfig, getAuthorizationHeaderValue, getAuthorizationHeaderValueAsync, refreshTokenIfNeeded, logoutNotice, clearLogoutNotice]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
