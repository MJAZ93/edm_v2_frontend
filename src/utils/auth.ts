import { useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'

export function isUnauthorizedBody(data: any): boolean {
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

export function useUnauthorizedHandlers() {
  const { logout } = useAuth()
  const ensureAuthorizedResponse = useCallback((data: any) => {
    if (isUnauthorizedBody(data)) {
      logout('Sessão expirada. Inicie sessão novamente.')
      throw new Error('UNAUTHORIZED')
    }
  }, [logout])
  const ensureAuthorizedError = useCallback((err: any) => {
    const status = err?.response?.status
    if (status === 401 || isUnauthorizedBody(err?.response?.data)) {
      logout('Sessão expirada. Inicie sessão novamente.')
      throw err
    }
  }, [logout])
  return { ensureAuthorizedResponse, ensureAuthorizedError }
}
