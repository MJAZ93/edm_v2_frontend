import React, { useEffect, useMemo, useState } from 'react'
import { AppShell } from '../components/layout/AppShell'
// Navbar removido conforme pedido (sem dropdown "Sucatarias")
import ScrapyardsMapScreen from './ScrapyardsMapScreen'
import { Sidebar } from '../components/layout/Sidebar'
import { Card } from '../components/ui/Card'
import { Heading } from '../components/ui/Heading'
import { Grid } from '../components/layout/Grid'
import { PRIMARY_COLOR } from '../utils/theme'
import UsersScreen from './UsersScreen'
import ConfigScreen from './ConfigScreen'
import RegioesScreen from './RegioesScreen'
import ASCsScreen from './ASCsScreen'
import FormasConhecimentoScreen from './FormasConhecimentoScreen'
import MateriaisScreen from './MateriaisScreen'
import SetoresInfracaoScreen from './SetoresInfracaoScreen'
import TiposInfracaoScreen from './TiposInfracaoScreen'
import ScrapyardsScreen from './ScrapyardsScreen'
import ScrapyardDetailScreen from './ScrapyardDetailScreen'
import { SemiCircularGauge } from '../components/ui/SemiCircularGauge'
import { useAuth } from '../contexts/AuthContext'
import { DashboardApi } from '../services'
import { useUnauthorizedHandlers } from '../utils/auth'
import OcorrenciasScreen from './OcorrenciasScreen'
import OcorrenciaCreateScreen from './OcorrenciaCreateScreen'
import OcorrenciaDetailScreen from './OcorrenciaDetailScreen'
import OcorrenciaEditScreen from './OcorrenciaEditScreen'
import InfractionsScreen from './InfractionsScreen'
import InfractionDetailScreen from './InfractionDetailScreen'
import InfractionEditScreen from './InfractionEditScreen'
import InfractorsScreen from './InfractorsScreen'
import InfractorDetailScreen from './InfractorDetailScreen'
import InfractorEditScreen from './InfractorEditScreen'
import ReportsScreen from './ReportsScreen'
import AccoesScreen from './AccoesScreen'
import AccaoDetailScreen from './AccaoDetailScreen'
import AccaoEditScreen from './AccaoEditScreen'

const MENU = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'ocorrencias', label: 'Ocorrências' },
  { key: 'infracoes', label: 'Infrações' },
  { key: 'infractores', label: 'Infractores' },
  { key: 'accoes', label: 'Ações' },
  { key: 'sucatarias', label: 'Sucatarias' },
  { key: 'relatorios', label: 'Relatórios' },
  { key: 'utilizadores', label: 'Utilizadores' },
  { key: 'config', label: 'Configurações' }
]

export default function DashboardScreen() {
  const { getApiConfig, getAuthorizationHeaderValue } = useAuth()
  const dashApi = useMemo(() => new DashboardApi(getApiConfig()), [getApiConfig])
  const authHeader = useMemo(() => getAuthorizationHeaderValue(), [getAuthorizationHeaderValue])
  const { ensureAuthorizedResponse, ensureAuthorizedError } = useUnauthorizedHandlers()
  const KEY_TO_PATH = useMemo(() => ({
    dashboard: '/dashboard',
    ocorrencias: '/ocorrencias',
    infracoes: '/infracoes',
    infractores: '/infractores',
    accoes: '/accoes',
    sucatarias: '/sucatarias',
    sucatariasMapa: '/sucatarias/mapa',
    utilizadores: '/utilizadores',
    config: '/config',
    regioes: '/regioes',
    ascs: '/ascs',
    formasConhecimento: '/formas-conhecimento',
    materiais: '/materiais',
    setoresInfracao: '/setores-infracao',
    tiposInfracao: '/tipos-infracao',
    relatorios: '/relatorios'
  } as const), [])

  const PATH_TO_KEY = useMemo(() => Object.fromEntries(Object.entries(KEY_TO_PATH).map(([k, v]) => [v, k])), [KEY_TO_PATH]) as Record<string, keyof typeof KEY_TO_PATH>

  const normalizePath = (path: string): string => {
    if (!path) return '/dashboard'
    // remove trailing slashes
    let p = path.replace(/\/+$/, '')
    if (p === '') p = '/'
    if (p === '/') return '/dashboard'
    return p
  }

  const resolveKeyFromPath = (path: string): keyof typeof KEY_TO_PATH => {
    const p = normalizePath(path)
    const direct = PATH_TO_KEY[p]
    if (direct) return direct
    // tenta por prefixo (ex.: /ascs/123)
    const entry = Object.entries(KEY_TO_PATH).find(([, v]) => p.startsWith(v))
    if (entry) return entry[0] as keyof typeof KEY_TO_PATH
    return 'dashboard'
  }

  const [active, setActive] = useState<keyof typeof KEY_TO_PATH>(() => resolveKeyFromPath(window.location.pathname))
  const [path, setPath] = useState<string>(() => normalizePath(window.location.pathname))
  // Removed auto-refresh and timestamp UI to simplify header

  // Dashboard data
  const [kpis, setKpis] = useState<any | null>(null)
  const [financeTotals, setFinanceTotals] = useState<any | null>(null)
  const [financeCompare, setFinanceCompare] = useState<any | null>(null)
  const [riskScrapyards, setRiskScrapyards] = useState<any[]>([])
  const [occByAsc, setOccByAsc] = useState<any[]>([])
  const [financeTop, setFinanceTop] = useState<any[]>([])
  const [financeLoss, setFinanceLoss] = useState<any[]>([])
  const [financeSpend, setFinanceSpend] = useState<any[]>([])
  const [infractionsSeries, setInfractionsSeries] = useState<any[]>([])
  const [loadingDash, setLoadingDash] = useState(false)
  const [dashError, setDashError] = useState<string | null>(null)

  // Sincroniza estado com URL (history API)
  useEffect(() => {
    const onPopState = () => {
      const currentPath = normalizePath(window.location.pathname)
      setPath(currentPath)
      const nextKey = resolveKeyFromPath(currentPath)
      setActive(nextKey)
    }
    window.addEventListener('popstate', onPopState)
    window.addEventListener('locationchange', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const handleSelect = (key: string) => {
    const k = key as keyof typeof KEY_TO_PATH
    const path = KEY_TO_PATH[k] || '/dashboard'
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path)
      setPath(normalizePath(path))
      window.dispatchEvent(new Event('locationchange'))
    }
    setActive(k)
  }

  const navigateToPath = (path: string) => {
    const norm = normalizePath(path)
    if (window.location.pathname !== norm) {
      window.history.pushState({}, '', norm)
      setPath(norm)
      window.dispatchEvent(new Event('locationchange'))
    }
    setActive(resolveKeyFromPath(norm))
  }

  const occRoute = useMemo(() => {
    if (path.startsWith('/ocorrencias/novo')) return 'create'
    if (/^\/ocorrencias\/[^/]+\/editar$/.test(path)) return 'edit'
    if (/^\/ocorrencias\/[^/]+$/.test(path)) return 'detail'
    return 'list'
  }, [path]) as 'create' | 'edit' | 'detail' | 'list'

  // Load dashboard data when active is dashboard
  useEffect(() => {
    if (active !== 'dashboard') return
    (async () => {
      setLoadingDash(true); setDashError(null)
      try {
        const [ov, tot, cmp, risky, byAsc, topAsc, finTs, infTs] = await Promise.all([
          dashApi.privateDashboardKpisOverviewGet(authHeader),
          dashApi.privateDashboardFinanceTotalsGet(authHeader),
          dashApi.privateDashboardFinanceCompareGet(authHeader, 3),
          dashApi.privateDashboardScrapyardsRiskTopGet(authHeader, 5),
          dashApi.privateDashboardOccurrencesByAscGet(authHeader, 'occurrences', 'asc', authHeader, undefined, undefined, undefined, undefined),
          dashApi.privateDashboardFinanceTopGet(authHeader, undefined, undefined, undefined, 'loss', 5),
          dashApi.privateDashboardFinanceTimeseriesGet(authHeader, undefined, undefined, undefined, undefined, 'month'),
          dashApi.privateDashboardInfractionsValueTimeseriesGet(authHeader, 'month')
        ])
        ensureAuthorizedResponse(ov.data); ensureAuthorizedResponse(tot.data); ensureAuthorizedResponse(cmp.data); ensureAuthorizedResponse(risky.data); ensureAuthorizedResponse(byAsc.data); ensureAuthorizedResponse(topAsc.data); ensureAuthorizedResponse(finTs.data); ensureAuthorizedResponse(infTs.data)
        setKpis(ov.data)
        setFinanceTotals(tot.data)
        setFinanceCompare(cmp.data)
        setRiskScrapyards((risky.data as any)?.items ?? [])
        setOccByAsc((byAsc.data as any)?.items ?? [])
        setFinanceTop((topAsc.data as any)?.items ?? [])
        setFinanceLoss(((finTs.data as any)?.loss) ?? [])
        setFinanceSpend(((finTs.data as any)?.spend) ?? [])
        setInfractionsSeries(((infTs.data as any)?.buckets) ?? [])
      } catch (err: any) {
        try { ensureAuthorizedError(err) } catch {}
        const status = err?.response?.status
        setDashError(!status ? 'Sem ligação ao servidor.' : 'Falha ao carregar métricas do dashboard.')
      } finally { setLoadingDash(false) }
    })()
  }, [active, dashApi, authHeader])

  const infraRoute = useMemo(() => {
    if (/^\/infracoes\/[^/]+\/editar$/.test(path)) return 'edit'
    if (/^\/infracoes\/[^/]+$/.test(path)) return 'detail'
    return 'list'
  }, [path]) as 'edit' | 'detail' | 'list'

  const infractorRoute = useMemo(() => {
    if (/^\/infractores\/[^/]+\/editar$/.test(path)) return 'edit'
    if (/^\/infractores\/[^/]+$/.test(path)) return 'detail'
    return 'list'
  }, [path]) as 'edit' | 'detail' | 'list'

  const accaoRoute = useMemo(() => {
    if (path.startsWith('/accoes/novo')) return 'create'
    if (/^\/accoes\/[^/]+\/editar$/.test(path)) return 'edit'
    if (/^\/accoes\/[^/]+$/.test(path)) return 'detail'
    return 'list'
  }, [path]) as 'create' | 'edit' | 'detail' | 'list'

  return (
    <AppShell
      sidebar={<Sidebar groupLabel="Vandalizações" items={MENU} activeKey={active} onSelect={handleSelect} />}
      header={undefined}
    >
      {active === 'dashboard' && (
        <>
          {dashError ? <div style={{ background: '#fee2e2', color: '#991b1b', padding: 10, borderRadius: 8, marginBottom: 12 }}>{dashError}</div> : null}
          <Grid columns={4} gap={20}>
            <Card title="KPIs">
              {loadingDash ? (
                <div style={{ color: '#6b7280' }}>A carregar…</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(140px,1fr))', gap: 12 }}>
                  <Metric label="Regiões" value={(kpis as any)?.nr_regioes ?? '—'} color="#7c3aed" />
                  <Metric label="ASCs" value={(kpis as any)?.nr_ascs ?? '—'} color="#1d4ed8" />
                  <Metric label="Ocorrências" value={(kpis as any)?.nr_occurrences ?? '—'} color="#0ea5e9" />
                  <Metric label="Infrações" value={(kpis as any)?.nr_infractions ?? '—'} color="#ef4444" />
                  <Metric label="Infractores" value={(kpis as any)?.nr_infractors ?? '—'} color="#059669" />
                  <Metric label="Total perdas" value={formatMoney((kpis as any)?.total_valor_infractions)} color="#b91c1c" />
                  <Metric label="Média por infração" value={formatMoney((kpis as any)?.avg_valor_infraction)} color="#9333ea" />
                </div>
              )}
            </Card>
            <Card title="Totais financeiros">
              {loadingDash ? (
                <div style={{ color: '#6b7280' }}>A carregar…</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, minmax(120px,1fr))', gap: 8 }}>
                  <Metric label="Perdas (infrações)" value={formatMoney((financeTotals as any)?.loss_total)} color="#ef4444" />
                  <Metric label="Gastos (ações)" value={formatMoney((financeTotals as any)?.actions_spend_total)} color="#f59e0b" />
                  {Object.entries((financeTotals || {})).filter(([k]) => !['loss_total','actions_spend_total','health'].includes(k)).map(([k,v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#374151' }}>
                      <span style={{ color: '#6b7280' }}>{k}</span>
                      <strong>{typeof v === 'number' ? v : String(v)}</strong>
                    </div>
                  ))}
                </div>
              )}
            </Card>
            <Card title="Comparação 3 meses">
              {loadingDash ? <div style={{ color: '#6b7280' }}>A carregar…</div> : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px,1fr))', gap: 12 }}>
                  <CompareBlock
                    title="Perdas (infrações)"
                    before={(financeCompare as any)?.loss_before}
                    after={(financeCompare as any)?.loss_after}
                    changeAbs={(financeCompare as any)?.loss_change_abs}
                    changePct={(financeCompare as any)?.loss_change_pct}
                    goodWhenDecrease
                    color="#ef4444"
                  />
                  <CompareBlock
                    title="Gastos (ações)"
                    before={(financeCompare as any)?.spend_before}
                    after={(financeCompare as any)?.spend_after}
                    changeAbs={(financeCompare as any)?.spend_change_abs}
                    changePct={(financeCompare as any)?.spend_change_pct}
                    goodWhenDecrease={false}
                    color="#f59e0b"
                  />
                </div>
              )}
            </Card>
            <Card title="Saúde geral">
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <SemiCircularGauge
                  value={Number.isFinite(Number((financeTotals as any)?.health))
                    ? Math.max(0, Math.min(100, Number((financeTotals as any)?.health)))
                    : 0}
                />
                <div style={{ color: '#6b7280' }}>
                  {Number.isFinite(Number((financeTotals as any)?.health))
                    ? `Saúde: ${Number((financeTotals as any)?.health).toFixed(1)}%`
                    : 'Saúde: —'}
                </div>
              </div>
            </Card>
          </Grid>

          <Grid columns={2} gap={20}>
            <Card title="Ocorrências por ASC (top)">
              {loadingDash ? <div style={{ color: '#6b7280' }}>A carregar…</div> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {occByAsc.slice(0, 6).map((it, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #e5e7eb', paddingBottom: 6 }}>
                      <span>{it?.asc_name || it?.asc_id || '—'}</span>
                      <strong>{it?.count ?? '—'}</strong>
                    </div>
                  ))}
                  {!occByAsc.length && <div style={{ color: '#6b7280' }}>Sem dados.</div>}
                </div>
              )}
            </Card>
            <Card title="Sucatarias de maior risco">
              {loadingDash ? <div style={{ color: '#6b7280' }}>A carregar…</div> : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px,1fr))', gap: 12 }}>
                  {riskScrapyards.map((s, i) => {
                    const pct = riskPercent(s?.nivel_confianca)
                    const col = riskColor(pct)
                    const barBg = '#fde68a'
                    return (
                      <div key={i} style={{ padding: 12, borderRadius: 12, border: `1px solid ${col}33`, background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontWeight: 800 }}>{s?.nome || s?.scrapyard_id || '—'}</div>
                          <span style={{ fontSize: 12, background: `${col}1A`, color: col, padding: '4px 8px', borderRadius: 999 }}>Risco {pct.toFixed(1)}%</span>
                        </div>
                        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>ASC: {s?.asc_name || s?.asc_id || '—'}</div>
                        <div style={{ marginTop: 8 }}>
                          <div style={{ height: 8, background: barBg, borderRadius: 6, overflow: 'hidden' }}>
                            <div style={{ width: `${Math.max(0, Math.min(100, pct))}%`, height: '100%', background: col, transition: 'width .3s ease' }} />
                          </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                          <button type="button" onClick={() => { if (s?.scrapyard_id) { window.history.pushState({}, '', `/sucatarias/${s.scrapyard_id}`); window.dispatchEvent(new Event('locationchange')) } }} style={{ padding: '8px 10px', borderRadius: 8, border: `1px solid ${col}`, background: '#fff', color: col, cursor: 'pointer' }}>Ver detalhes</button>
                        </div>
                      </div>
                    )
                  })}
                  {!riskScrapyards.length && <div style={{ color: '#6b7280' }}>Sem dados.</div>}
                </div>
              )}
            </Card>
          </Grid>

          <Grid columns={2} gap={20}>
            <Card title="Perdas (infrações) — Série temporal">
              {loadingDash ? <div style={{ color: '#6b7280' }}>A carregar…</div> : (
                <Sparkline data={infractionsSeries} valueKey="total_valor" labelKey="ts" color="#ef4444" />
              )}
            </Card>
            <Card title="Financeiro — Série temporal (perdas vs. gastos)">
              {loadingDash ? <div style={{ color: '#6b7280' }}>A carregar…</div> : (
                <TimeSeriesChart loss={financeLoss} spend={financeSpend} />
              )}
            </Card>
          </Grid>

          <Card title="Top ASCs por perdas">
            {loadingDash ? <div style={{ color: '#6b7280' }}>A carregar…</div> : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px,1fr))', gap: 12 }}>
                {financeTop.map((it, i) => (
                  <div key={i} style={{ padding: 12, borderRadius: 10, border: '1px solid #e5e7eb', background: '#fff7f7' }}>
                    <div style={{ fontWeight: 700 }}>{it?.asc_name || it?.asc_id || '—'}</div>
                    <div style={{ color: '#6b7280', fontSize: 12, marginTop: 4 }}>Perdas</div>
                    <div style={{ fontWeight: 800 }}>{formatMoney(it?.value)}</div>
                  </div>
                ))}
                {!financeTop.length && <div style={{ color: '#6b7280' }}>Sem dados.</div>}
              </div>
            )}
          </Card>
        </>
      )}

      {/* Placeholder removido a pedido: não mostrar conteúdo a implementar */}

      {active === 'utilizadores' && <UsersScreen />}
      {active === 'ocorrencias' && (
        occRoute === 'create' ? (
          <OcorrenciaCreateScreen />
        ) : occRoute === 'edit' ? (
          <OcorrenciaEditScreen />
        ) : occRoute === 'detail' ? (
          <OcorrenciaDetailScreen />
        ) : (
          <OcorrenciasScreen />
        )
      )}
      {active === 'infracoes' && (
        infraRoute === 'edit' ? (
          <InfractionEditScreen />
        ) : infraRoute === 'detail' ? (
          <InfractionDetailScreen />
        ) : (
          <InfractionsScreen />
        )
      )}
      {active === 'infractores' && (
        infractorRoute === 'edit' ? (
          <InfractorEditScreen />
        ) : infractorRoute === 'detail' ? (
          <InfractorDetailScreen />
        ) : (
          <InfractorsScreen />
        )
      )}
      {active === 'sucatarias' && (
        /^\/sucatarias\/[^/]+$/.test(path) ? (
          <ScrapyardDetailScreen />
        ) : (
          <ScrapyardsScreen />
        )
      )}
      {active === 'sucatariasMapa' && <ScrapyardsMapScreen />}
      {active === 'config' && <ConfigScreen />}
      {active === 'regioes' && <RegioesScreen />}
      {active === 'ascs' && <ASCsScreen />}
      {active === 'formasConhecimento' && <FormasConhecimentoScreen />}
      {active === 'materiais' && <MateriaisScreen />}
      {active === 'setoresInfracao' && <SetoresInfracaoScreen />}
      {active === 'tiposInfracao' && <TiposInfracaoScreen />}
      {active === 'relatorios' && <ReportsScreen />}
      {active === 'accoes' && (
        accaoRoute === 'create' ? (
          <AccaoEditScreen />
        ) : accaoRoute === 'edit' ? (
          <AccaoEditScreen />
        ) : accaoRoute === 'detail' ? (
          <AccaoDetailScreen />
        ) : (
          <AccoesScreen />
        )
      )}
    </AppShell>
  )
}

function Metric({ label, value, color = '#111827' }: { label: string; value: string | number; color?: string }) {
  return (
    <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: 12 }}>
      <div style={{ fontSize: 12, color: '#6b7280' }}>{label}</div>
      <div style={{ fontWeight: 800, fontSize: 22, color }}>{value as any}</div>
    </div>
  )
}

function Delta({ label, value }: { label: string; value?: number }) {
  const v = typeof value === 'number' ? value : null
  const color = v == null ? '#6b7280' : (v < 0 ? '#dc2626' : '#16a34a')
  const sign = v == null ? '' : (v > 0 ? '+' : '')
  return (
    <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: 10, minWidth: 140 }}>
      <div style={{ fontSize: 12, color: '#6b7280' }}>{label}</div>
      <div style={{ fontWeight: 800, fontSize: 18, color }}>{v == null ? '—' : `${sign}${v.toFixed(1)}%`}</div>
    </div>
  )
}

function formatMoney(n?: number) {
  if (typeof n !== 'number' || Number.isNaN(n)) return '—'
  try { return `${n.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT` } catch { return `${n.toFixed(2)} MT` }
}

function Sparkline({ data, valueKey = 'value', labelKey = 'bucket', color = '#0ea5e9' }: { data: any[]; valueKey?: string; labelKey?: string; color?: string }) {
  const vals = Array.isArray(data) ? data.map((d) => Number(d?.[valueKey] ?? 0)).filter((x) => Number.isFinite(x)) : []
  const max = Math.max(1, ...vals)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 100 }}>
      {vals.slice(-24).map((v, i) => (
        <div key={i} title={`${v}`}
             style={{ width: 8, height: Math.max(2, Math.round((v / max) * 100)), background: color, borderRadius: 2, opacity: 0.85 }} />
      ))}
      {!vals.length && <div style={{ color: '#6b7280' }}>Sem dados</div>}
    </div>
  )
}

function CompareBlock({ title, before, after, changeAbs, changePct, goodWhenDecrease = true, color = '#0ea5e9' }: {
  title: string
  before?: number
  after?: number
  changeAbs?: number
  changePct?: number
  goodWhenDecrease?: boolean
  color?: string
}) {
  const b = typeof before === 'number' ? before : null
  const a = typeof after === 'number' ? after : null
  const dAbs = typeof changeAbs === 'number' ? changeAbs : (b != null && a != null ? (a - b) : null)
  const dPct = typeof changePct === 'number' ? changePct : (b != null && b !== 0 && a != null ? ((a - b) / b) * 100 : null)
  const isBetter = (b != null && a != null) ? (goodWhenDecrease ? a < b : a > b) : null
  const badgeStyle = {
    background: isBetter === null ? '#f9fafb' : (isBetter ? '#ecfdf5' : '#fef2f2'),
    border: `1px solid ${isBetter === null ? '#e5e7eb' : (isBetter ? '#bbf7d0' : '#fecaca')}`,
  } as React.CSSProperties
  const sign = (v?: number | null) => (v == null ? '' : (v > 0 ? '+' : ''))
  const colorAbs = (dAbs == null ? '#374151' : (dAbs > 0 ? (goodWhenDecrease ? '#dc2626' : '#16a34a') : (goodWhenDecrease ? '#16a34a' : '#dc2626')))
  const colorPct = (dPct == null ? '#374151' : (dPct > 0 ? (goodWhenDecrease ? '#dc2626' : '#16a34a') : (goodWhenDecrease ? '#16a34a' : '#dc2626')))
  return (
    <div style={{ padding: 12, borderRadius: 10, ...badgeStyle }}>
      <div style={{ fontSize: 12, color: '#6b7280' }}>{title}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
        <div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>Antes (3m)</div>
          <div style={{ fontWeight: 700 }}>{formatMoney(b ?? undefined)}</div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>Depois (3m)</div>
          <div style={{ fontWeight: 800, color }}>{formatMoney(a ?? undefined)}</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
        <div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>Variação</div>
          <div style={{ fontWeight: 800, color: colorAbs }}>{dAbs == null ? '—' : `${sign(dAbs)}${formatMoney(Math.abs(dAbs) as any)}`}</div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>Percentual</div>
          <div style={{ fontWeight: 800, color: colorPct }}>{dPct == null ? '—' : `${sign(dPct)}${dPct.toFixed(1)}%`}</div>
        </div>
      </div>
    </div>
  )
}

function riskPercent(n?: number) {
  if (typeof n !== 'number' || Number.isNaN(n)) return 0
  // backend pode devolver 0-1 ou 0-100
  const v = n <= 1 ? n * 100 : n
  return Math.max(0, Math.min(100, v))
}
function riskColor(pct: number) {
  if (pct >= 75) return '#dc2626' // vermelho
  if (pct >= 50) return '#f59e0b' // laranja
  return '#fbbf24' // amarelo
}

function TimeSeriesChart({ loss = [], spend = [] }: { loss?: Array<{ ts: string; total: number }>; spend?: Array<{ ts: string; total: number }> }) {
  // merge x-domain from both series
  const all = [...(loss || []), ...(spend || [])]
  const pts = all.map((d) => ({ x: new Date(d.ts).getTime(), y: Number(d.total || 0) })).filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y))
  if (!pts.length) return <div style={{ color: '#6b7280' }}>Sem dados</div>
  const minX = Math.min(...pts.map((p) => p.x))
  const maxX = Math.max(...pts.map((p) => p.x))
  const maxY = Math.max(1, ...pts.map((p) => p.y))
  const pad = 24
  const W = 520, H = 180
  const sx = (x: number) => pad + ((x - minX) / Math.max(1, (maxX - minX))) * (W - pad * 2)
  const sy = (y: number) => H - pad - (y / maxY) * (H - pad * 2)
  const toPath = (arr: Array<{ ts: string; total: number }>) => {
    const series = arr.map((d) => ({ x: new Date(d.ts).getTime(), y: Number(d.total || 0) }))
      .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y))
      .sort((a, b) => a.x - b.x)
    if (!series.length) return ''
    return series.map((p, i) => `${i === 0 ? 'M' : 'L'} ${sx(p.x)} ${sy(p.y)}`).join(' ')
  }
  const pathLoss = toPath(loss)
  const pathSpend = toPath(spend)
  const ticks = 4
  return (
    <svg width={W} height={H} role="img" aria-label="Financeiro série temporal">
      {/* axes */}
      <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="#e5e7eb" />
      <line x1={pad} y1={pad} x2={pad} y2={H - pad} stroke="#e5e7eb" />
      {/* y ticks */}
      {Array.from({ length: ticks + 1 }).map((_, i) => {
        const yv = (i / ticks) * maxY
        const y = sy(yv)
        return (
          <g key={i}>
            <line x1={pad - 4} y1={y} x2={pad} y2={y} stroke="#e5e7eb" />
            <text x={4} y={y + 4} fontSize={10} fill="#6b7280">{formatMoney(yv)}</text>
          </g>
        )
      })}
      {/* series */}
      {pathSpend && <path d={pathSpend} fill="none" stroke="#0ea5e9" strokeWidth={2} />}
      {pathLoss && <path d={pathLoss} fill="none" stroke="#ef4444" strokeWidth={2} />}
      {/* legend */}
      <g transform={`translate(${W - pad - 140}, ${pad})`}>
        <rect x={0} y={-10} width={140} height={24} fill="#fff" stroke="#e5e7eb" rx={6} />
        <circle cx={12} cy={2} r={4} fill="#ef4444" />
        <text x={22} y={6} fontSize={12} fill="#374151">Perdas</text>
        <circle cx={82} cy={2} r={4} fill="#0ea5e9" />
        <text x={92} y={6} fontSize={12} fill="#374151">Gastos</text>
      </g>
    </svg>
  )
}
