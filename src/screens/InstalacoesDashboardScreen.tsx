import React, { useEffect, useMemo, useState } from 'react'
import { Card } from '../components'
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
  const [deficitItems, setDeficitItems] = useState<Array<{ group_id?: string; deficit?: number }>>([])
  const [deficitLoading, setDeficitLoading] = useState(false)
  const [deficitError, setDeficitError] = useState<string | null>(null)
  // Temporal
  const [months, setMonths] = useState<number>(6)
  const [minScore, setMinScore] = useState<string>('')
  const [maxScore, setMaxScore] = useState<string>('')
  const [zeroCompras, setZeroCompras] = useState(false)
  const [temporalItems, setTemporalItems] = useState<Array<{ mes?: string; total?: number; deficit?: number }>>([])
  const [temporalLoading, setTemporalLoading] = useState(false)
  const [temporalError, setTemporalError] = useState<string | null>(null)
  // Tendência (group_by=tendencia)
  const [tendCounts, setTendCounts] = useState<CountItem[]>([])
  const [tendLoading, setTendLoading] = useState(false)
  const [tendError, setTendError] = useState<string | null>(null)

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

  // Carregar défice por região (mantém-se visível; filtragem aplicada na apresentação)
  useEffect(() => {
    (async () => {
      setDeficitLoading(true); setDeficitError(null)
      try {
        const { data } = await api.privateInspeccoesDeficitGet(auth, 'regiao', tendencia || undefined)
        if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
        setDeficitItems((((data as any)?.items) ?? []))
      } catch (err: any) {
        const status = err?.response?.status
        if (status === 401 || isUnauthorizedBody(err?.response?.data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
        setDeficitError(!status ? 'Sem ligação ao servidor.' : 'Falha ao carregar défices.')
      } finally { setDeficitLoading(false) }
    })()
  }, [api, auth, tendencia])

  const deficitWithLabels = useMemo(() => {
    const byId = new Map((regioes || []).map(r => [r.id, r.name]))
    return (deficitItems || []).map(it => ({ id: it.group_id || '', label: byId.get(it.group_id || '') || (it.group_id || '—'), value: Number(it.deficit || 0) }))
  }, [deficitItems, regioes])
  const deficitDonut = (deficitWithLabels || []).map(d => ({ label: d.label, value: Math.max(0, Number(d.value) || 0) }))
  const selectedRegiaoId = regiaoId || ascRegiaoId || ''
  const deficitFiltered = useMemo(() => {
    if (!selectedRegiaoId) return deficitWithLabels
    return (deficitWithLabels || []).filter(it => it.id === selectedRegiaoId)
  }, [deficitWithLabels, selectedRegiaoId])

  // Carregar dados temporais
  useEffect(() => {
    (async () => {
      setTemporalLoading(true); setTemporalError(null)
      try {
        const { data } = await api.privateInspeccoesTemporalGet(
          auth,
          months || 6,
          tendencia || undefined,
          minScore ? Number(minScore) : undefined,
          maxScore ? Number(maxScore) : undefined,
          zeroCompras || undefined
        )
        if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
        setTemporalItems(((data as any)?.items) ?? [])
      } catch (err: any) {
        const status = err?.response?.status
        if (status === 401 || isUnauthorizedBody(err?.response?.data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
        setTemporalError(!status ? 'Sem ligação ao servidor.' : 'Falha ao carregar análise temporal.')
      } finally { setTemporalLoading(false) }
    })()
  }, [api, auth, months, tendencia, minScore, maxScore, zeroCompras])

  // Carregar contagens por tendência (distribuição)
  useEffect(() => {
    (async () => {
      setTendLoading(true); setTendError(null)
      try {
        const { data } = await api.privateInspeccoesContagensGet(auth, 'tendencia' as any)
        if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
        const raw = ((data as any)?.items) ?? []
        const mapped: CountItem[] = raw.map((it: any) => ({ id: it?.group_id, label: labelTendencia(it?.group_name || it?.group_id), count: it?.total }))
        setTendCounts(mapped)
      } catch (err: any) {
        const status = err?.response?.status
        if (status === 401 || isUnauthorizedBody(err?.response?.data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
        setTendError(!status ? 'Sem ligação ao servidor.' : 'Falha ao carregar contagens por tendência.')
      } finally { setTendLoading(false) }
    })()
  }, [api, auth])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

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
        <Card title={`Inspeções — Contagens${tendencia ? ` · Tendência: ${tendencia.replace(/_/g,' ').toLowerCase()}` : ''}`}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr minmax(220px, 360px)', gap: 16, alignItems: 'stretch' }}>
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
            <div style={{ maxWidth: 360 }}>
              <DonutChart data={donutData} />
            </div>
          </div>
          {error ? <div style={{ background: '#fee2e2', color: '#991b1b', padding: 8, borderRadius: 8, marginTop: 10 }}>{error}</div> : null}
        </Card>
      )}

      <Card title="Défice total">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr minmax(220px, 360px)', gap: 16, alignItems: 'stretch' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#6b7280' }}>
                  <th style={{ padding: '10px 8px', borderBottom: '1px solid #e5e7eb' }}>Região</th>
                  <th style={{ padding: '10px 8px', borderBottom: '1px solid #e5e7eb' }}>Défice</th>
                </tr>
              </thead>
              <tbody>
                {deficitLoading ? (
                  <tr><td colSpan={2} style={{ padding: 16, color: '#6b7280' }}>A carregar…</td></tr>
                ) : (deficitFiltered || []).length === 0 ? (
                  <tr><td colSpan={2} style={{ padding: 16, color: '#6b7280' }}>Sem dados para mostrar.</td></tr>
                ) : (
                  (deficitFiltered || []).map((it, i) => (
                    <tr key={i}>
                      <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6' }}>{it.label}</td>
                      <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6' }}>{formatMoney(it.value)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div style={{ maxWidth: 360 }}>
            <DonutChart data={(deficitFiltered || []).map(d => ({ label: d.label, value: Math.max(0, Number(d.value) || 0) }))} />
          </div>
        </div>
        {deficitError ? <div style={{ background: '#fee2e2', color: '#991b1b', padding: 8, borderRadius: 8, marginTop: 10 }}>{deficitError}</div> : null}
      </Card>

      {regiaoId && (
        <Card title="Inspeções — ASCs da região">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr minmax(220px, 420px)', gap: 16, alignItems: 'stretch' }}>
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
                    ((ascs || []).filter(a => !ascId || a.id === ascId)).map((a, i) => {
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
            <div style={{ maxWidth: 420 }}>
              <DonutChart
                data={((ascs || []).filter(a => !ascId || a.id === ascId)).map((a) => ({ label: a.name || a.id || '—', value: Number((ascCounts.find(x => x.id === a.id)?.count) ?? 0) }))}
                legendMaxHeight={220}
              />
            </div>
          </div>
        </Card>
      )}

      {/* Tendência: respeita seleção de tendência; oculta quando há região selecionada */}
      {!regiaoId && (
        <Card title="Inspeções — Contagens por tendência">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr minmax(220px, 360px)', gap: 16, alignItems: 'stretch' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: '#6b7280' }}>
                    <th style={{ padding: '10px 8px', borderBottom: '1px solid #e5e7eb' }}>Tendência</th>
                    <th style={{ padding: '10px 8px', borderBottom: '1px solid #e5e7eb' }}>Inspeções</th>
                  </tr>
                </thead>
                <tbody>
                  {tendLoading ? (
                    <tr><td colSpan={2} style={{ padding: 16, color: '#6b7280' }}>A carregar…</td></tr>
                  ) : (tendCounts || []).filter((it) => !tendencia || (it.id?.toUpperCase() === tendencia || it.label === labelTendencia(tendencia))).length === 0 ? (
                    <tr><td colSpan={2} style={{ padding: 16, color: '#6b7280' }}>Sem dados para mostrar.</td></tr>
                  ) : (
                    (tendCounts || [])
                      .filter((it) => !tendencia || (it.id?.toUpperCase() === tendencia || it.label === labelTendencia(tendencia)))
                      .map((it, i) => (
                        <tr key={i}>
                          <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6' }}>{it.label || it.id || '-'}</td>
                          <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6' }}>{Number(it.count || 0)}</td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
            <div style={{ maxWidth: 360 }}>
              <DonutChart data={(tendCounts || [])
                .filter((it) => !tendencia || (it.id?.toUpperCase() === tendencia || it.label === labelTendencia(tendencia)))
                .map((it) => ({ label: it.label || it.id || '—', value: Number(it.count || 0) }))} />
            </div>
          </div>
          {tendError ? <div style={{ background: '#fee2e2', color: '#991b1b', padding: 8, borderRadius: 8, marginTop: 10 }}>{tendError}</div> : null}
        </Card>
      )}

      {/* Temporal */}
      <Card title="Análise temporal (últimos meses)">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, color: '#374151' }}>Meses</span>
            <select value={months} onChange={(e) => setMonths(Number(e.target.value))} style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db', minWidth: 120 }}>
              <option value={3}>3</option>
              <option value={6}>6</option>
              <option value={12}>12</option>
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, color: '#374151' }}>Score mín (0-1)</span>
            <input value={minScore} onChange={(e) => setMinScore(e.target.value)} placeholder="0.0" style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db', minWidth: 120 }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, color: '#374151' }}>Score máx (0-1)</span>
            <input value={maxScore} onChange={(e) => setMaxScore(e.target.value)} placeholder="1.0" style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db', minWidth: 120 }} />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 22 }}>
            <input type="checkbox" checked={zeroCompras} onChange={(e) => setZeroCompras(e.target.checked)} />
            <span style={{ color: '#374151' }}>Sem compras nos últimos 6 meses</span>
          </label>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) 1fr', gap: 16, alignItems: 'stretch' }}>
          <Card title="Série — Contagem vs. Défice">
            {temporalLoading ? (
              <div style={{ color: '#6b7280' }}>A carregar…</div>
            ) : temporalError ? (
              <div style={{ background: '#fee2e2', color: '#991b1b', padding: 8, borderRadius: 8 }}>{temporalError}</div>
            ) : (
              <TimeSeriesDual data={temporalItems} />
            )}
          </Card>
          <Card title="Tabela — Mensal">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: '#6b7280' }}>
                    <th style={{ padding: '10px 8px', borderBottom: '1px solid #e5e7eb' }}>Mês</th>
                    <th style={{ padding: '10px 8px', borderBottom: '1px solid #e5e7eb' }}>Inspeções</th>
                    <th style={{ padding: '10px 8px', borderBottom: '1px solid #e5e7eb' }}>Défice</th>
                  </tr>
                </thead>
                <tbody>
                  {temporalLoading ? (
                    <tr><td colSpan={3} style={{ padding: 16, color: '#6b7280' }}>A carregar…</td></tr>
                  ) : (temporalItems || []).length === 0 ? (
                    <tr><td colSpan={3} style={{ padding: 16, color: '#6b7280' }}>Sem dados para mostrar.</td></tr>
                  ) : (
                    (temporalItems || []).map((it, i) => (
                      <tr key={i}>
                        <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6' }}>{formatMonth(it.mes)}</td>
                        <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6' }}>{Number(it.total || 0)}</td>
                        <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6' }}>{formatMoney(it.deficit)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </Card>
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

function formatMoney(n?: number) {
  if (typeof n !== 'number' || Number.isNaN(n)) return '—'
  try { return `${n.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT` } catch { return `${n.toFixed(2)} MT` }
}

function formatMonth(m?: string) {
  if (!m) return '—'
  // Expecting formats like "2025-09" or ISO. We will show MM/YYYY if possible.
  const match = /^(\d{4})-(\d{2})/.exec(m)
  if (match) return `${match[2]}/${match[1]}`
  try { const d = new Date(m); const mm = `${d.getUTCMonth()+1}`.padStart(2, '0'); const yy = d.getUTCFullYear(); return `${mm}/${yy}` } catch { return m }
}

function TimeSeriesDual({ data }: { data: Array<{ mes?: string; total?: number; deficit?: number }> }) {
  const series = Array.isArray(data) ? data : []
  const xs = series.map((_, i) => i)
  const totals = series.map((d) => Number(d.total || 0))
  const deficits = series.map((d) => Number(d.deficit || 0))
  const maxY = Math.max(1, ...totals, ...deficits)
  const W = 420
  const H = 220
  const P = 28
  const innerW = W - P * 2
  const innerH = H - P * 2
  const sx = (i: number) => (series.length <= 1 ? P + innerW / 2 : P + (i * innerW) / (series.length - 1))
  const sy = (v: number) => P + innerH - (Math.min(Math.max(v, 0), maxY) / maxY) * innerH

  const path = (vals: number[]) => vals.map((v, i) => `${i === 0 ? 'M' : 'L'} ${sx(i)} ${sy(v)}`).join(' ')
  const gridY = [0, 0.25, 0.5, 0.75, 1]
  const labels = series.map((d) => formatMonth(d.mes))
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="220" role="img" aria-label="Série temporal">
      <rect x={0} y={0} width={W} height={H} fill="#ffffff" rx={8} />
      {gridY.map((g, i) => (
        <g key={i}>
          <line x1={P} y1={P + g * innerH} x2={W - P} y2={P + g * innerH} stroke="#e5e7eb" strokeWidth={1} />
          <text x={4} y={P + g * innerH + 4} fill="#6b7280" fontSize={10}>{Math.round((1 - g) * maxY)}</text>
        </g>
      ))}
      {/* totals line (blue) */}
      <path d={path(totals)} fill="none" stroke="#0ea5e9" strokeWidth={2} />
      {/* deficit line (red) */}
      <path d={path(deficits)} fill="none" stroke="#ef4444" strokeWidth={2} />
      {/* x labels */}
      {labels.map((lb, i) => (
        <text key={i} x={sx(i)} y={H - 4} fontSize={10} fill="#6b7280" textAnchor="middle">{lb}</text>
      ))}
      {/* legend */}
      <g>
        <rect x={W - 160} y={8} width={150} height={20} fill="#fff" />
        <circle cx={W - 146} cy={18} r={4} fill="#0ea5e9" />
        <text x={W - 136} y={22} fontSize={11} fill="#111827">Inspeções</text>
        <circle cx={W - 82} cy={18} r={4} fill="#ef4444" />
        <text x={W - 72} y={22} fontSize={11} fill="#111827">Défice</text>
      </g>
    </svg>
  )
}

function labelTendencia(v?: string) {
  const x = String(v || '').toUpperCase()
  switch (x) {
    case 'CRESCENTE': return 'Crescente'
    case 'MUITO_CRESCENTE': return 'Muito crescente'
    case 'NORMAL': return 'Normal'
    case 'DECRESCENTE': return 'Decrescente'
    case 'MUITO_DECRESCENTE': return 'Muito decrescente'
    case 'SEM_COMPRAS': return 'Sem compras'
    default: return v || '—'
  }
}
