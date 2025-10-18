import React, { useEffect, useMemo, useState } from 'react'
import { Button, Card, Grid, Heading, Text } from '../components'
import { useAuth } from '../contexts/AuthContext'
import { InspeccoesApi } from '../services'

export default function ClientesInspeccoesDashboardScreen() {
  const { getApiConfig, getAuthorizationHeaderValue, logout } = useAuth()
  const api = useMemo(() => new InspeccoesApi(getApiConfig()), [getApiConfig])
  const auth = useMemo(() => getAuthorizationHeaderValue(), [getAuthorizationHeaderValue])

  const [groupBy, setGroupBy] = useState<'regiao' | 'pt'>('regiao')
  const [tendencia, setTendencia] = useState('')
  const [minScore, setMinScore] = useState<string>('')
  const [maxScore, setMaxScore] = useState<string>('')
  const [zeroCompras, setZeroCompras] = useState(false)

  const [items, setItems] = useState<Array<{ id?: string; label?: string; count?: number }>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isUnauthorizedBody = (data: any) => { try { const raw = data?.code ?? data?.error?.code ?? data?.status ?? data?.error?.status ?? data?.error_code; if (raw == null) return false; const num = Number(raw); if (!Number.isNaN(num) && num === 401) return true; const code = String(raw).toUpperCase(); return code === 'UNAUTHORIZED' || code === 'UNAUTHENTICATED' } catch { return false } }

  useEffect(() => {
    (async () => {
      setLoading(true); setError(null)
      try {
        const { data } = await api.privateInspeccoesContagensGet(
          auth,
          groupBy,
          tendencia || undefined,
          minScore ? Number(minScore) : undefined,
          maxScore ? Number(maxScore) : undefined,
          zeroCompras || undefined
        )
        if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
        setItems(((data as any)?.items) ?? [])
      } catch (err: any) {
        const status = err?.response?.status
        if (status === 401 || isUnauthorizedBody(err?.response?.data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
        setError(!status ? 'Sem ligação ao servidor.' : 'Falha ao carregar contagens de inspeções.')
      } finally { setLoading(false) }
    })()
  }, [api, auth, groupBy, tendencia, minScore, maxScore, zeroCompras])

  function limpar() {
    setGroupBy('regiao'); setTendencia(''); setMinScore(''); setMaxScore(''); setZeroCompras(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Heading level={2}>Dashboard de Clientes · Contagens</Heading>

      <Card title="Filtros">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <select value={groupBy} onChange={(e) => setGroupBy(e.target.value as any)} style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #d1d5db' }}>
            <option value="regiao">Por Região</option>
            <option value="pt">Por PT</option>
          </select>
          <select value={tendencia} onChange={(e) => setTendencia(e.target.value)} style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #d1d5db' }}>
            <option value="">Tendência</option>
            <option value="CRESCENTE">Crescente</option>
            <option value="MUITO_CRESCENTE">Muito crescente</option>
            <option value="NORMAL">Normal</option>
            <option value="DECRESCENTE">Decrescente</option>
            <option value="MUITO_DECRESCENTE">Muito decrescente</option>
            <option value="SEM_COMPRAS">Sem compras</option>
          </select>
          <input value={minScore} onChange={(e) => setMinScore(e.target.value)} placeholder="Score mín (0-1)" style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #d1d5db', width: 160 }} />
          <input value={maxScore} onChange={(e) => setMaxScore(e.target.value)} placeholder="Score máx (0-1)" style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #d1d5db', width: 160 }} />
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={zeroCompras} onChange={(e) => setZeroCompras(e.target.checked)} />
            <span style={{ color: '#374151' }}>Sem compras nos últimos 6 meses</span>
          </label>
          <div style={{ marginLeft: 'auto' }}>
            <Button variant="secondary" onClick={limpar}>Limpar</Button>
          </div>
        </div>
        {error ? <div style={{ background: '#fee2e2', color: '#991b1b', padding: 8, borderRadius: 8, marginTop: 10 }}>{error}</div> : null}
      </Card>

      <Card>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#6b7280' }}>
                <th style={{ padding: '10px 8px', borderBottom: '1px solid #e5e7eb' }}>{groupBy === 'regiao' ? 'Região' : 'PT'}</th>
                <th style={{ padding: '10px 8px', borderBottom: '1px solid #e5e7eb' }}>Clientes</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={2} style={{ padding: 16, color: '#6b7280' }}>A carregar…</td></tr>
              ) : (items || []).length === 0 ? (
                <tr><td colSpan={2} style={{ padding: 16, color: '#6b7280' }}>Sem dados para mostrar.</td></tr>
              ) : (
                items.map((it, i) => (
                  <tr key={i}>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6' }}>{it.label || it.id || '-'}</td>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6' }}>{Number(it.count || 0)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

