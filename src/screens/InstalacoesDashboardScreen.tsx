import React, { useEffect, useMemo, useState } from 'react'
import { Card, Heading } from '../components'
import { useAuth } from '../contexts/AuthContext'
import { InspeccoesApi, ASCApi, RegiaoApi, type ModelASC, type ModelRegiao } from '../services'

type CountItem = { id?: string; label?: string; count?: number }

export default function InstalacoesDashboardScreen() {
  const { getApiConfig, getAuthorizationHeaderValue, logout } = useAuth()
  const api = useMemo(() => new InspeccoesApi(getApiConfig()), [getApiConfig])
  const auth = useMemo(() => getAuthorizationHeaderValue(), [getAuthorizationHeaderValue])

  const [items, setItems] = useState<CountItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [regioes, setRegioes] = useState<ModelRegiao[]>([])
  const [ascs, setAscs] = useState<ModelASC[]>([])
  const [regiaoId, setRegiaoId] = useState('')
  const [ascId, setAscId] = useState('')
  const [tendencia, setTendencia] = useState('')
  const [ascCounts, setAscCounts] = useState<CountItem[]>([])

  const isUnauthorizedBody = (data: any) => {
    try {
      const raw = data?.code ?? data?.error?.code ?? data?.status ?? data?.error?.status ?? data?.error_code
      if (raw == null) return false
      const num = Number(raw)
      if (!Number.isNaN(num) && num === 401) return true
      const code = String(raw).toUpperCase()
      return code === 'UNAUTHORIZED' || code === 'UNAUTHENTICATED'
    } catch { return false }
  }

  useEffect(() => {
    (async () => {
      setLoading(true); setError(null)
      try {
        const { data } = await api.privateInspeccoesContagensGet(auth, 'regiao', tendencia || undefined)
        if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
        const raw = ((data as any)?.items) ?? []
        const mapped: CountItem[] = raw.map((it: any) => ({ id: it?.group_id, label: it?.group_name, count: it?.total }))
        setItems(mapped)
      } catch (err: any) {
        const status = err?.response?.status
        if (status === 401 || isUnauthorizedBody(err?.response?.data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
        setError(!status ? 'Sem ligação ao servidor.' : 'Falha ao carregar contagens de inspeções.')
      } finally { setLoading(false) }
    })()
  }, [api, auth, tendencia])

  // Carregar filtros (Regiões e ASCs)
  const regiaoApi = useMemo(() => new RegiaoApi(getApiConfig()), [getApiConfig])
  const ascApi = useMemo(() => new ASCApi(getApiConfig()), [getApiConfig])
  useEffect(() => { (async () => { try { const { data } = await regiaoApi.privateRegioesGet(auth, 1, 200, 'name', 'asc'); if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return } setRegioes(((data as any)?.items) ?? []) } catch {} })() }, [regiaoApi, auth])
  useEffect(() => { (async () => { try { const { data } = await ascApi.privateAscsGet(auth, 1, 200, 'name', 'asc', undefined, regiaoId || undefined); if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return } setAscs(((data as any)?.items) ?? []) } catch {} })() }, [ascApi, auth, regiaoId])
  // Carregar contagens por ASC apenas quando houver Região selecionada
  useEffect(() => {
    (async () => {
      if (!regiaoId) { setAscCounts([]); return }
      try {
        const { data } = await api.privateInspeccoesContagensGet(auth, 'asc' as any, tendencia || undefined)
        if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
        const raw = ((data as any)?.items) ?? []
        const mapped: CountItem[] = raw.map((it: any) => ({ id: it?.group_id, label: it?.group_name, count: it?.total }))
        setAscCounts(mapped)
      } catch {}
    })()
  }, [api, auth, tendencia, regiaoId])

  // Aplicar filtros localmente (agrupado por Região)
  const ascRegiaoId = useMemo(() => (ascs.find(a => a.id === ascId)?.regiao_id) || '', [ascs, ascId])
  const filtered = useMemo(() => {
    const rId = regiaoId || ascRegiaoId || ''
    if (!rId) return items
    return (items || []).filter((it) => (it.id === rId || it.label === (regioes.find(r => r.id === rId)?.name)))
  }, [items, regiaoId, ascRegiaoId, regioes])

  const donutData = (filtered || []).map((it) => ({ label: it.label || it.id || '—', value: Number(it.count || 0) }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Heading level={2}>Dashboard</Heading>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 13, color: '#374151' }}>Região</span>
          <select value={regiaoId} onChange={(e) => { setRegiaoId(e.target.value); setAscId('') }} style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db', minWidth: 200 }}>
            <option value="">Todas</option>
            {(regioes || []).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 13, color: '#374151' }}>ASC</span>
          <select value={ascId} onChange={(e) => setAscId(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db', minWidth: 200 }}>
            <option value="">Todas</option>
            {(ascs || []).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 13, color: '#374151' }}>Tendência de crescimento</span>
          <select value={tendencia} onChange={(e) => setTendencia(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db', minWidth: 220 }}>
            <option value="">Todas</option>
            <option value="CRESCENTE">Crescente</option>
            <option value="MUITO_CRESCENTE">Muito crescente</option>
            <option value="NORMAL">Normal</option>
            <option value="DECRESCENTE">Decrescente</option>
            <option value="MUITO_DECRESCENTE">Muito decrescente</option>
            <option value="SEM_COMPRAS">Sem compras</option>
          </select>
        </label>
      </div>

      {!regiaoId && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) 1fr', gap: 16, alignItems: 'stretch' }}>
          <Card title="Inspeções — Contagens">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: '#6b7280' }}>
                    <th style={{ padding: '10px 8px', borderBottom: '1px solid #e5e7eb' }}>Região</th>
                    <th style={{ padding: '10px 8px', borderBottom: '1px solid #e5e7eb' }}>Inspeções</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={2} style={{ padding: 16, color: '#6b7280' }}>A carregar…</td></tr>
                  ) : (filtered || []).length === 0 ? (
                    <tr><td colSpan={2} style={{ padding: 16, color: '#6b7280' }}>Sem dados para mostrar.</td></tr>
                  ) : (
                    filtered.map((it, i) => (
                      <tr key={i}>
                        <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6' }}>{it.label || it.id || '-'}</td>
                        <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6' }}>{Number(it.count || 0)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {error ? <div style={{ background: '#fee2e2', color: '#991b1b', padding: 8, borderRadius: 8, marginTop: 10 }}>{error}</div> : null}
          </Card>

          <Card title="Inspeções — Distribuição">
            <div style={{ maxWidth: 320 }}>
              <DonutChart data={donutData} />
            </div>
          </Card>
        </div>
      )}

      {regiaoId && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) 1fr', gap: 16, alignItems: 'stretch' }}>
          <Card title="Inspeções — ASCs da região">
            <div style={{ overflowY: 'auto', maxHeight: 260 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: '#6b7280' }}>
                    <th style={{ padding: '10px 8px', borderBottom: '1px solid #e5e7eb' }}>ASC</th>
                    <th style={{ padding: '10px 8px', borderBottom: '1px solid #e5e7eb' }}>Inspeções</th>
                  </tr>
                </thead>
                <tbody>
                  {(ascs || []).length === 0 ? (
                    <tr><td colSpan={2} style={{ padding: 16, color: '#6b7280' }}>Sem ASCs para mostrar.</td></tr>
                  ) : (
                    (ascs || []).map((a, i) => {
                      const c = (ascCounts.find(x => x.id === a.id)?.count) ?? 0
                      return (
                      <tr key={i}>
                        <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6' }}>{a.name || a.id || '—'}</td>
                        <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6' }}>{Number(c)}</td>
                      </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="Inspeções — Distribuição por ASC">
            <div style={{ maxWidth: 420 }}>
              <DonutChart
                data={(ascs || []).map((a) => ({ label: a.name || a.id || '—', value: Number((ascCounts.find(x => x.id === a.id)?.count) ?? 0) }))}
                legendMaxHeight={220}
              />
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

function DonutChart({ data, legendMaxHeight }: { data: Array<{ label: string; value: number }>; legendMaxHeight?: number }) {
  const total = data.reduce((s, d) => s + (Number.isFinite(d.value) ? d.value : 0), 0)
  const R = 60
  const W = 200
  const H = 200
  const CX = W / 2
  const CY = H / 2
  const C = 2 * Math.PI * R
  const colors = ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#f97316', '#84cc16']
  let acc = 0
  const segments = total > 0 ? data.map((d, i) => {
    const val = Math.max(0, Number(d.value) || 0)
    const frac = val / total
    const len = frac * C
    const seg = { offset: acc, length: len, color: colors[i % colors.length], label: d.label, value: val }
    acc += len
    return seg
  }) : []
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" role="img" aria-label="Donut chart">
        <circle cx={CX} cy={CY} r={R} fill="#fff" stroke="#e5e7eb" strokeWidth={16} />
        {segments.map((s, i) => (
          <circle key={i}
                  cx={CX}
                  cy={CY}
                  r={R}
                  fill="transparent"
                  stroke={s.color}
                  strokeWidth={16}
                  strokeDasharray={`${s.length} ${C - s.length}`}
                  strokeDashoffset={-s.offset}
                  style={{ transition: 'stroke-dasharray 0.3s' }}
          />
        ))}
        <circle cx={CX} cy={CY} r={R - 18} fill="#fff" />
        <text x={CX} y={CY} textAnchor="middle" dominantBaseline="middle" fontSize={14} fill="#374151" fontWeight={700}>
          {total}
        </text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, maxHeight: legendMaxHeight, overflowY: legendMaxHeight ? 'auto' : undefined }}>
        {data.slice(0, 6).map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: colors[i % colors.length], display: 'inline-block' }} />
            <span style={{ color: '#374151' }}>{d.label}</span>
            <span style={{ marginLeft: 'auto', color: '#111827', fontWeight: 700 }}>{d.value}</span>
          </div>
        ))}
        {data.length === 0 && <div style={{ color: '#6b7280' }}>Sem dados</div>}
      </div>
    </div>
  )
}
