import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, useRef } from 'react'
import { AuthenticationApi, Configuration, type AuthLoggedUser, type AuthLoginRequest } from '../services'
import axios from 'axios'

type AuthState = {
  accessToken: string | null
  refreshToken: string | null
  user: AuthLoggedUser | null
  accessTokenExpiresAt: number | null
  autoRefreshCount: number
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
const ACCESS_EXPIRES_AT_KEY = 'auth.access_token_expires_at'
const AUTO_REFRESH_COUNT_KEY = 'auth.auto_refresh_count'
const REFRESH_INTERVAL_MS = 5 * 60 * 1000
const REFRESH_GRACE_MS = 60 * 1000
const MAX_AUTO_REFRESHES = 3

function getAccessTokenExpiresAt(expiresIn?: number): number | null {
  if (typeof expiresIn !== 'number' || Number.isNaN(expiresIn) || expiresIn <= 0) {
    return null
  }
  return Date.now() + (expiresIn * 1000)
}

function loadFromStorage(): AuthState {
  const accessToken = localStorage.getItem(ACCESS_KEY)
  const refreshToken = localStorage.getItem(REFRESH_KEY)
  const userRaw = localStorage.getItem(USER_KEY)
  const accessTokenExpiresAtRaw = localStorage.getItem(ACCESS_EXPIRES_AT_KEY)
  const autoRefreshCountRaw = localStorage.getItem(AUTO_REFRESH_COUNT_KEY)
  const accessTokenExpiresAt = accessTokenExpiresAtRaw ? Number(accessTokenExpiresAtRaw) : null
  const autoRefreshCount = autoRefreshCountRaw ? Number(autoRefreshCountRaw) : 0
  return {
    accessToken,
    refreshToken,
    user: userRaw ? (JSON.parse(userRaw) as AuthLoggedUser) : null,
    accessTokenExpiresAt: accessTokenExpiresAt && !Number.isNaN(accessTokenExpiresAt) ? accessTokenExpiresAt : null,
    autoRefreshCount: !Number.isNaN(autoRefreshCount) && autoRefreshCount > 0 ? autoRefreshCount : 0
  }
}

function saveToStorage(state: AuthState) {
  if (state.accessToken) localStorage.setItem(ACCESS_KEY, state.accessToken)
  if (state.refreshToken) localStorage.setItem(REFRESH_KEY, state.refreshToken)
  if (state.user) localStorage.setItem(USER_KEY, JSON.stringify(state.user))
  if (state.accessTokenExpiresAt) localStorage.setItem(ACCESS_EXPIRES_AT_KEY, String(state.accessTokenExpiresAt))
  localStorage.setItem(AUTO_REFRESH_COUNT_KEY, String(state.autoRefreshCount))
}

function clearStorage() {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem(ACCESS_EXPIRES_AT_KEY)
  localStorage.removeItem(AUTO_REFRESH_COUNT_KEY)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(() => loadFromStorage())
  const [loading, setLoading] = useState(false)
  const didSetupInterceptors = useRef(false)
  const [logoutNotice, setLogoutNotice] = useState<string | null>(null)
  const accessTokenRef = useRef<string | null>(null)
  const refreshTokenRef = useRef<string | null>(null)
  const accessTokenExpiresAtRef = useRef<number | null>(null)
  const autoRefreshCountRef = useRef<number>(0)
  const refreshInFlightRef = useRef<Promise<void> | null>(null)

  useEffect(() => {
    // keep storage in sync when state changes
    if (state.accessToken && state.user) {
      saveToStorage(state)
    }
    accessTokenRef.current = state.accessToken
    refreshTokenRef.current = state.refreshToken
    accessTokenExpiresAtRef.current = state.accessTokenExpiresAt
    autoRefreshCountRef.current = state.autoRefreshCount
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
    setState({ accessToken: null, refreshToken: null, user: null, accessTokenExpiresAt: null, autoRefreshCount: 0 })
    clearStorage()
    setLogoutNotice(reason ?? null)
    if (window.location.pathname !== '/login') {
      window.history.replaceState({}, '', '/login')
    }
  }, [])

  const resetAutoRefreshCount = useCallback(() => {
    if (autoRefreshCountRef.current === 0) return
    autoRefreshCountRef.current = 0
    setState((current) => {
      if (current.autoRefreshCount === 0) return current
      const next = { ...current, autoRefreshCount: 0 }
      saveToStorage(next)
      return next
    })
  }, [])

  const refreshTokenIfNeeded = useCallback(async (force = false) => {
    try {
      if (!refreshTokenRef.current) return
      if (refreshInFlightRef.current) { await refreshInFlightRef.current; return }
      const expiresAt = accessTokenExpiresAtRef.current
      if (!force && expiresAt && (expiresAt - Date.now()) > REFRESH_GRACE_MS) return
      if (!force && autoRefreshCountRef.current >= MAX_AUTO_REFRESHES) return
      const basePath = (import.meta as any).env?.VITE_API_BASE_URL || '/api'
      const authApi = new AuthenticationApi(new Configuration({ basePath }))
      const p = authApi.publicAuthRefreshPost({ refresh_token: refreshTokenRef.current }, { headers: { 'x-skip-auth-refresh': '1' } })
        .then(({ data }) => {
          const newAccess = data.access_token ?? null
          const newRefresh = data.refresh_token ?? refreshTokenRef.current
          const newAccessTokenExpiresAt = getAccessTokenExpiresAt(data.expires_in)
          if (!newAccess) throw new Error('Missing access token')
          const nextAutoRefreshCount = force ? autoRefreshCountRef.current : autoRefreshCountRef.current + 1
          const next: AuthState = {
            accessToken: newAccess,
            refreshToken: newRefresh ?? null,
            user: state.user,
            accessTokenExpiresAt: newAccessTokenExpiresAt,
            autoRefreshCount: nextAutoRefreshCount
          }
          setState(next)
          saveToStorage(next)
          accessTokenRef.current = newAccess
          refreshTokenRef.current = newRefresh ?? null
          accessTokenExpiresAtRef.current = newAccessTokenExpiresAt
          autoRefreshCountRef.current = nextAutoRefreshCount
        })
        .catch((err) => {
          const status = err?.response?.status
          if (status === 401) {
            logout('Sessão expirada. Inicie sessão novamente.')
          }
          throw err
        })
        .finally(() => { refreshInFlightRef.current = null })
      refreshInFlightRef.current = p
      await p
    } catch {}
  }, [logout, state.user])

  const getAuthorizationHeaderValueAsync = useCallback(async () => {
    await refreshTokenIfNeeded(true)
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
      const accessTokenExpiresAt = getAccessTokenExpiresAt(data.expires_in)
      if (!accessToken || !user) {
        throw new Error('Invalid login response')
      }
      const next: AuthState = { accessToken, refreshToken, user, accessTokenExpiresAt, autoRefreshCount: 0 }
      setState(next)
      saveToStorage(next)
      setLogoutNotice(null)
      accessTokenRef.current = accessToken
      refreshTokenRef.current = refreshToken
      accessTokenExpiresAtRef.current = accessTokenExpiresAt
      autoRefreshCountRef.current = 0
      // Redireciona para o dashboard se estiver no /login
      if (window.location.pathname === '/login') {
        window.history.replaceState({}, '', '/dashboard')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const clearLogoutNotice = useCallback(() => setLogoutNotice(null), [])

  useEffect(() => {
    if (!state.refreshToken) return

    const refreshNow = () => {
      void refreshTokenIfNeeded(false)
    }

    refreshNow()
    const intervalId = window.setInterval(refreshNow, REFRESH_INTERVAL_MS)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [state.refreshToken, refreshTokenIfNeeded])

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
          resetAutoRefreshCount()
        }
        if (!skip) {
          await refreshTokenIfNeeded()
        }
        const token = accessTokenRef.current
        if (token) {
          if (typeof (config.headers as any)?.set === 'function') {
            ;(config.headers as any).set('Authorization', `Bearer ${token}`)
          } else {
            ;(config as any).headers = { ...(config.headers || {}), Authorization: `Bearer ${token}` }
          }
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
      async (error) => {
        const status = error?.response?.status
        const data = error?.response?.data
        const originalRequest = error?.config as any
        const isRefreshRequest = originalRequest?.headers?.['x-skip-auth-refresh']

        if (!isRefreshRequest && (status === 401 || isUnauthorizedBody(data)) && !originalRequest?._retry && refreshTokenRef.current) {
          originalRequest._retry = true
          try {
            await refreshTokenIfNeeded()
            const token = accessTokenRef.current
            if (token) {
              if (typeof originalRequest.headers?.set === 'function') {
                originalRequest.headers.set('Authorization', `Bearer ${token}`)
              } else {
                originalRequest.headers = { ...(originalRequest.headers || {}), Authorization: `Bearer ${token}` }
              }
            }
            return axios.request(originalRequest)
          } catch {
            // deixa o fluxo cair para logout abaixo quando a sessão estiver realmente inválida
          }
        }

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
  }, [logout, state.user, refreshTokenIfNeeded, resetAutoRefreshCount])

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
