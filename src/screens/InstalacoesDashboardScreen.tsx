import React, { useEffect, useMemo, useState } from 'react'
import { Button, Card, Grid, Heading } from '../components'
import { useAuth } from '../contexts/AuthContext'
import { RegiaoApi, ASCApi, InstallationsApi } from '../services'

export default function InstalacoesDashboardScreen() {
  const { getApiConfig, getAuthorizationHeaderValue, logout } = useAuth()
  const basePath = useMemo(() => (getApiConfig() as any)?.basePath || '/api', [getApiConfig])
  const auth = useMemo(() => getAuthorizationHeaderValue(), [getAuthorizationHeaderValue])

  const groupBy: 'regiao' = 'regiao'
  const [regioes, setRegioes] = useState<any[]>([])
  const [ascs, setAscs] = useState<any[]>([])
  const [regiaoId, setRegiaoId] = useState('')
  const [ascId, setAscId] = useState('')

  const [kpi, setKpi] = useState<any>({ installsTotal: 0, deficitTotal: 0, valorRecTotal: 0 })
  const [topGroups, setTopGroups] = useState<any[]>([])
  const [acaoTemporal, setAcaoTemporal] = useState<any[]>([])
  const [instTemporal, setInstTemporal] = useState<any[]>([])
  const [ascDonut, setAscDonut] = useState<Array<{ label: string; value: number }>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isUnauthorizedBody = (data: any) => { try { const raw = data?.code ?? data?.error?.code ?? data?.status ?? data?.error?.status ?? data?.error_code; if (raw == null) return false; const num = Number(raw); if (!Number.isNaN(num) && num === 401) return true; const code = String(raw).toUpperCase(); return code === 'UNAUTHORIZED' || code === 'UNAUTHENTICATED' } catch { return false } }

  useEffect(() => {
    (async () => {
      try { const r = await new RegiaoApi(getApiConfig()).privateRegioesGet(auth, -1, undefined, 'name', 'asc'); setRegioes(((r.data as any)?.items) ?? []) } catch {}
      try { const a = await new ASCApi(getApiConfig()).privateAscsGet(auth, -1, undefined, 'name', 'asc'); setAscs(((a.data as any)?.items) ?? []) } catch {}
    })()
  }, [getApiConfig, auth])

  useEffect(() => {
    (async () => {
      setLoading(true); setError(null)
      try {
        const fetchJson = async (url: string) => {
          const resp = await fetch(url, { headers: { Authorization: auth } })
          if (resp.status === 401) { logout('Sessão expirada. Inicie sessão novamente.'); throw new Error('401') }
          return resp.json()
        }
        const qsCounts = new URLSearchParams({ group_by: groupBy })
        const qsDef = new URLSearchParams({ group_by: groupBy })
        const qsVal = new URLSearchParams({ group_by: groupBy })
        if (regiaoId) qsVal.set('regiao_id', regiaoId)
        if (ascId) qsVal.set('asc_id', ascId)
        const qsMel = new URLSearchParams({ group_by: groupBy, limit: String(5) })
        if (regiaoId) qsMel.set('regiao_id', regiaoId)
        if (ascId) qsMel.set('asc_id', ascId)
        const qsAcaoTs = new URLSearchParams({ months: String(6) })
        if (regiaoId) qsAcaoTs.set('regiao_id', regiaoId)
        if (ascId) qsAcaoTs.set('asc_id', ascId)
        const qsInstTs = new URLSearchParams({ months: String(6) })

        const [instCounts, instDef, acaoValRec, melhores, acaoTs, instTs] = await Promise.all([
          fetchJson(`${basePath}/private/reports/instalacoes/contagens?${qsCounts.toString()}`),
          fetchJson(`${basePath}/private/reports/instalacoes/deficit?${qsDef.toString()}`),
          fetchJson(`${basePath}/private/reports/instalacao-accoes/valor_recuperado?${qsVal.toString()}`),
          fetchJson(`${basePath}/private/reports/instalacao-accoes/melhores?${qsMel.toString()}`),
          fetchJson(`${basePath}/private/reports/instalacao-accoes/temporal?${qsAcaoTs.toString()}`),
          fetchJson(`${basePath}/private/reports/instalacoes/temporal?${qsInstTs.toString()}`),
        ])
        const installsItems = (instCounts as any)?.items ?? []
        const deficitItems = (instDef as any)?.items ?? []
        const valorItems = (acaoValRec as any)?.items ?? []
        const melhoresItems = (melhores as any)?.items ?? []
        const acaoSeries = (acaoTs as any)?.items ?? []
        const instSeries = (instTs as any)?.items ?? []
        setKpi({
          installsTotal: sumNumeric(installsItems, 'count') ?? installsItems.length,
          deficitTotal: sumNumeric(deficitItems, 'deficit'),
          valorRecTotal: sumNumeric(valorItems, 'value'),
        })
        setTopGroups(melhoresItems)
        setAcaoTemporal(acaoSeries)
        setInstTemporal(instSeries)

        // Donut por ASC (quando existe Região selecionada)
        if (regiaoId) {
          try {
            const installsApi = new InstallationsApi(getApiConfig())
            const { data: installsData } = await installsApi.privateInstallationsGet(auth, -1, undefined, 'mes', 'desc', undefined, regiaoId)
            const mapPtToAsc = new Map<string, string>()
            ;(((installsData as any)?.items) ?? []).forEach((ins: any) => {
              const pt = String(ins?.pt_id || '')
              const asc = String(ins?.asc_name || ins?.asc_id || '')
              if (pt) mapPtToAsc.set(pt, asc || '-')
            })
            const qsValPt = new URLSearchParams({ group_by: 'pt', regiao_id: regiaoId })
            const valPorPt = await fetchJson(`${basePath}/private/reports/instalacao-accoes/valor_recuperado?${qsValPt.toString()}`)
            const itemsPt = ((valPorPt as any)?.items) ?? []
            const acc: Record<string, number> = {}
            itemsPt.forEach((it: any) => {
              const ptId = String(it?.id || it?.pt_id || '')
              const ascLabel = mapPtToAsc.get(ptId) || '-'
              const v = Number(it?.value || 0)
              acc[ascLabel] = (acc[ascLabel] || 0) + (Number.isFinite(v) ? v : 0)
            })
            const arr = Object.entries(acc).map(([label, value]) => ({ label, value })).sort((a,b)=>b.value-a.value).slice(0,8)
            setAscDonut(arr)
          } catch { setAscDonut([]) }
        } else {
          setAscDonut([])
        }
      } catch (err: any) {
        const status = err?.response?.status
        if (status === 401 || isUnauthorizedBody(err?.response?.data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
        setError(!status ? 'Sem ligação ao servidor.' : 'Falha a carregar dados do dashboard de instalações.')
      } finally { setLoading(false) }
    })()
  }, [getApiConfig, basePath, auth, regiaoId, ascId, logout])

  async function executarRelatorio() {
    try { await api.privateReportsExecutePost(auth); alert('Relatório mensal iniciado.') } catch { alert('Falha ao executar relatório.') }
  }
  async function exportarCSV(entity: 'installations' | 'instalacao_accoes') {
    try {
      const qs = new URLSearchParams()
      if (regiaoId) qs.set('regiao_id', regiaoId)
      if (ascId) qs.set('asc_id', ascId)
      const resp = await fetch(`${basePath}/private/reports/export?entity=${encodeURIComponent(entity)}${qs.toString() ? `&${qs.toString()}` : ''}`, { headers: { Authorization: auth } })
      if (resp.status === 401) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      const blob = await resp.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${entity}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch { alert('Falha ao exportar CSV.') }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Heading level={2}>Dashboard de Instalações</Heading>

      <Card title="Filtros">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {/* Agrupamento fixo por Região conforme requisitos */}
          <select value={regiaoId} onChange={(e) => setRegiaoId(e.target.value)} style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #d1d5db' }}>
            <option value="">Todas as regiões</option>
            {regioes.map((r) => (<option key={r.id} value={r.id}>{r.name}</option>))}
          </select>
          <select value={ascId} onChange={(e) => setAscId(e.target.value)} style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #d1d5db' }}>
            <option value="">Todas as ASCs</option>
            {ascs.map((a) => (<option key={a.id} value={a.id}>{a.name}</option>))}
          </select>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <Button onClick={executarRelatorio}>Executar relatório mensal</Button>
            <Button variant="secondary" onClick={() => exportarCSV('installations')}>Exportar Instalações CSV</Button>
            <Button variant="secondary" onClick={() => exportarCSV('instalacao_accoes')}>Exportar Ações CSV</Button>
          </div>
        </div>
        {error ? <div style={{ background: '#fee2e2', color: '#991b1b', padding: 8, borderRadius: 8, marginTop: 10 }}>{error}</div> : null}
      </Card>

      <Grid minColumnWidth={260} gap={16}>
        <Card title="Total instalações">
          {loading ? <div style={{ color: '#6b7280' }}>A carregar…</div> : <Metric value={kpi.installsTotal} />}
        </Card>
        <Card title="Défice total">
          {loading ? <div style={{ color: '#6b7280' }}>A carregar…</div> : <Metric value={formatMoney(kpi.deficitTotal)} />}
        </Card>
        <Card title="Valor recuperado (ações)">
          {loading ? <div style={{ color: '#6b7280' }}>A carregar…</div> : <Metric value={formatMoney(kpi.valorRecTotal)} />}
        </Card>
      </Grid>

      <Grid minColumnWidth={320} gap={16}>
        <Card title="Temporal: Instalações">
          <Timeseries data={instTemporal} valueKey="count" color="#0ea5e9" />
        </Card>
        <Card title="Temporal: Ações (valor)">
          <Timeseries data={acaoTemporal} valueKey="value" color="#10b981" />
        </Card>
      </Grid>

      <Card title={`Top por Região (valor recuperado)`}>
        {loading ? <div style={{ color: '#6b7280' }}>A carregar…</div> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            {(topGroups || []).map((g, i) => (
              <div key={i} style={{ padding: 12, borderRadius: 10, border: '1px solid #e5e7eb', background: '#fff' }}>
                <div style={{ fontWeight: 700 }}>{g?.label || g?.name || '-'}</div>
                <div style={{ color: '#6b7280', fontSize: 12 }}>Valor recuperado</div>
                <div style={{ fontWeight: 800 }}>{formatMoney(g?.value)}</div>
              </div>
            ))}
            {!topGroups?.length && <div style={{ color: '#6b7280' }}>Sem dados.</div>}
          </div>
        )}
      </Card>

      <Card title="Distribuição (valor recuperado)">
        <DonutChart data={(topGroups || []).slice(0, 8).map((g) => ({ label: g?.label || g?.name || '-', value: Number(g?.value || 0) }))} />
      </Card>

      {regiaoId && (
        <Card title="Distribuição por ASC (valor recuperado)">
          <DonutChart data={ascDonut} />
        </Card>
      )}
    </div>
  )
}

function Metric({ value }: { value: string | number }) {
  return <div style={{ fontSize: 22, fontWeight: 800 }}>{typeof value === 'number' ? value : value}</div>
}

function Timeseries({ data, valueKey = 'value', color = '#0ea5e9' }: { data: any[]; valueKey?: string; color?: string }) {
  const vals = Array.isArray(data) ? data.map(d => Number(d?.[valueKey] ?? 0)).filter(v => Number.isFinite(v)) : []
  const max = Math.max(1, ...vals)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 120 }}>
      {vals.slice(-24).map((v, i) => (
        <div key={i} title={`${v}`} style={{ width: 10, height: Math.max(2, Math.round((v / max) * 100)), background: color, borderRadius: 2, opacity: 0.9 }} />
      ))}
      {!vals.length && <div style={{ color: '#6b7280' }}>Sem dados</div>}
    </div>
  )
}

function sumNumeric(items: any[], key: string): number {
  try { return items.reduce((s, it) => s + (Number(it?.[key]) || 0), 0) } catch { return 0 }
}
function formatMoney(n?: number) { if (typeof n !== 'number' || Number.isNaN(n)) return '—'; try { return `${n.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT` } catch { return `${n.toFixed(2)} MT` } }

function DonutChart({ data }: { data: Array<{ label: string; value: number }> }) {
  const clean = Array.isArray(data) ? data.filter(d => Number.isFinite(d.value) && d.value > 0) : []
  const total = clean.reduce((s, d) => s + d.value, 0)
  const W = 240
  const H = 240
  const cx = W / 2
  const cy = H / 2
  const rOuter = 100
  const rInner = 60
  const palette = ['#ef4444', '#0ea5e9', '#10b981', '#f59e0b', '#6366f1', '#14b8a6', '#f97316', '#84cc16']
  let angle = -Math.PI / 2

  const toXY = (r: number, a: number) => [cx + r * Math.cos(a), cy + r * Math.sin(a)]
  const arcPath = (start: number, end: number) => {
    const [sx, sy] = toXY(rOuter, start)
    const [ex, ey] = toXY(rOuter, end)
    const [isx, isy] = toXY(rInner, end)
    const [iex, iey] = toXY(rInner, start)
    const large = end - start > Math.PI ? 1 : 0
    return [`M ${sx} ${sy}`, `A ${rOuter} ${rOuter} 0 ${large} 1 ${ex} ${ey}`, `L ${isx} ${isy}`, `A ${rInner} ${rInner} 0 ${large} 0 ${iex} ${iey}`, 'Z'].join(' ')
  }

  const segments = clean.map((d, i) => {
    const frac = total === 0 ? 0 : d.value / total
    const start = angle
    const end = start + frac * Math.PI * 2
    angle = end
    return { label: d.label, value: d.value, start, end, color: palette[i % palette.length], pct: frac * 100 }
  })

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignItems: 'center' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" role="img" aria-label="Donut chart">
        <circle cx={cx} cy={cy} r={rOuter} fill="#f3f4f6" />
        <circle cx={cx} cy={cy} r={rInner} fill="#fff" />
        {segments.map((s, i) => (
          <path key={i} d={arcPath(s.start, s.end)} fill={s.color} stroke="#fff" strokeWidth={1} />
        ))}
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize={18} fill="#111827" fontWeight={800}>{total.toLocaleString('pt-PT')}</text>
        <text x={cx} y={cy + 18} textAnchor="middle" dominantBaseline="hanging" fontSize={11} fill="#6b7280">total</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
        {segments.length === 0 && <div style={{ color: '#6b7280' }}>Sem dados.</div>}
        {segments.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: s.color, display: 'inline-block' }} />
              <span style={{ color: '#374151', fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.label}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <strong>{formatMoney(s.value)}</strong>
              <span style={{ color: '#6b7280', fontSize: 12 }}>{s.pct.toFixed(1)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
