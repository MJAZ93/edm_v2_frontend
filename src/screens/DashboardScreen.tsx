import React, { useEffect, useMemo, useState } from 'react'
import { AppShell } from '../components/layout/AppShell'
// Navbar removido conforme pedido (sem dropdown "Sucatarias")
import ScrapyardsMapScreen from './ScrapyardsMapScreen'
import { Sidebar } from '../components/layout/Sidebar'
import { SidebarGroups } from '../components/layout/SidebarGroups'
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
import { DashboardApi, ScrapyardApi, InfractionApi, OccurrenceApi } from '../services'
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
import InstallationsScreen from './InstallationsScreen'
import InstallationDetailScreen from './InstallationDetailScreen'
import InstalacaoAccoesScreen from './InstalacaoAccoesScreen'
import InstalacaoAccaoDetailScreen from './InstalacaoAccaoDetailScreen'
import InstalacoesDashboardScreen from './InstalacoesDashboardScreen'
import InspeccoesDashboardScreen from './InspeccoesDashboardScreen'
import InstalacaoAccaoTiposScreen from './InstalacaoAccaoTiposScreen'
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
    instalacoes: '/instalacoes',
    instalacaoAccoes: '/instalacoes/accoes',
    instalacoesDashboard: '/instalacoes/dashboard',
    inspeccoesDashboard: '/inspeccoes/dashboard',
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
    // tenta por prefixo mais específico (ex.: /instalacoes/accoes/123 deve bater em /instalacoes/accoes)
    const matches = Object.entries(KEY_TO_PATH).filter(([, v]) => p.startsWith(v))
    if (matches.length) {
      matches.sort((a, b) => (b[1] as string).length - (a[1] as string).length)
      return matches[0][0] as keyof typeof KEY_TO_PATH
    }
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
  const [occByRegiao, setOccByRegiao] = useState<any[]>([])
  const [financeTop, setFinanceTop] = useState<any[]>([])
  const [financeLoss, setFinanceLoss] = useState<any[]>([])
  const [financeSpend, setFinanceSpend] = useState<any[]>([])
  const [infractionsSeries, setInfractionsSeries] = useState<any[]>([])
  const [infractionsByTipo, setInfractionsByTipo] = useState<any[]>([])
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
    return () => { window.removeEventListener('popstate', onPopState); window.removeEventListener('locationchange', onPopState) }
  }, [])

  // Salvaguarda: paths de ações de instalações devem ativar a secção correta
  useEffect(() => {
    if (path.startsWith('/instalacoes/accoes')) {
      if (active !== 'instalacaoAccoes') setActive('instalacaoAccoes')
    }
  }, [path])

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
        const [ov, tot, cmp, risky, byAsc, topAsc, finTs, infTs, byTipo, byRegiao] = await Promise.all([
          dashApi.privateDashboardKpisOverviewGet(authHeader),
          dashApi.privateDashboardFinanceTotalsGet(authHeader),
          dashApi.privateDashboardFinanceCompareGet(authHeader, 3),
          dashApi.privateDashboardScrapyardsRiskTopGet(authHeader, 5),
          dashApi.privateDashboardOccurrencesByAscGet(authHeader),
          dashApi.privateDashboardFinanceTopGet(authHeader, undefined, undefined, undefined, 'loss', 5),
          dashApi.privateDashboardFinanceTimeseriesGet(authHeader, undefined, undefined, undefined, undefined, 'month'),
          dashApi.privateDashboardInfractionsValueTimeseriesGet(authHeader, 'month'),
          dashApi.privateDashboardGroupedGet('infractions', 'tipo', authHeader),
          dashApi.privateDashboardGroupedGet('occurrences', 'regiao', authHeader)
        ])
        ensureAuthorizedResponse(ov.data); ensureAuthorizedResponse(tot.data); ensureAuthorizedResponse(cmp.data); ensureAuthorizedResponse(risky.data); ensureAuthorizedResponse(byAsc.data); ensureAuthorizedResponse(topAsc.data); ensureAuthorizedResponse(finTs.data); ensureAuthorizedResponse(infTs.data); ensureAuthorizedResponse(byTipo.data); ensureAuthorizedResponse(byRegiao.data)
        setKpis(ov.data)
        setFinanceTotals(tot.data)
        setFinanceCompare(cmp.data)
        setRiskScrapyards((risky.data as any)?.items ?? [])
        setOccByAsc((byAsc.data as any)?.items ?? [])
        setFinanceTop((topAsc.data as any)?.items ?? [])
        setFinanceLoss(((finTs.data as any)?.loss) ?? [])
        setFinanceSpend(((finTs.data as any)?.spend) ?? [])
        setInfractionsSeries(((infTs.data as any)?.buckets) ?? [])
        setInfractionsByTipo(((byTipo.data as any)?.items) ?? [])
        setOccByRegiao(((byRegiao.data as any)?.items) ?? [])
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

  const TITLE_MAP: Record<string, string> = {
    dashboard: 'Dashboard',
    ocorrencias: 'Ocorrências',
    infracoes: 'Infrações',
    infractores: 'Infractores',
    accoes: 'Ações',
    sucatarias: 'Sucatarias',
    sucatariasMapa: 'Sucatarias (Mapa)',
    utilizadores: 'Utilizadores',
    config: 'Configurações',
    regioes: 'Regiões',
    ascs: 'ASCs',
    formasConhecimento: 'Formas de Conhecimento',
    materiais: 'Materiais',
    setoresInfracao: 'Setores de Infração',
    tiposInfracao: 'Tipos de Infração',
    relatorios: 'Relatórios',
    instalacoes: 'Instalações',
    instalacaoAccoes: 'Ações (Instalações)',
    instalacoesDashboard: 'Dashboard',
    inspeccoesDashboard: 'Dashboard',
  }
  const headerTitle = TITLE_MAP[active] || '—'
  const showHeaderTitle = active !== 'instalacoes'

  const instalacaoAccoesRoute = useMemo(() => {
    if (/^\/instalacoes\/accoes\/[^/]+$/.test(path)) return 'detail'
    return 'list'
  }, [path]) as 'detail' | 'list'

  return (
    <AppShell
      sidebar={(
        <SidebarGroups
          groups={[
            {
              label: 'Vandalizações',
              items: MENU.filter((i) => !['instalacoes', 'utilizadores', 'config'].includes(i.key))
            },
            { label: 'Instalações', items: [
              { key: 'instalacoesDashboard', label: 'Dashboard' },
              { key: 'instalacoes', label: 'Lista' },
              { key: 'instalacaoAccoes', label: 'Ações' },
            ] },
            { label: 'Configurações', items: [
              { key: 'utilizadores', label: 'Utilizadores' },
              { key: 'config', label: 'Configurações' },
            ] },
          ]}
          activeKey={active}
          onSelect={handleSelect}
        />
      )}
      header={showHeaderTitle ? (
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', background: '#fff', position: 'sticky', top: 0, zIndex: 5 }}>
          <Heading level={2}>{headerTitle}</Heading>
        </div>
      ) : undefined}
      >
      {active === 'dashboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {dashError ? <div style={{ background: '#fee2e2', color: '#991b1b', padding: 10, borderRadius: 8 }}>{dashError}</div> : null}

          {/* Mapa primeiro */}
          <Card title="Mapa: Sucatarias e Ocorrências">
            <div style={{ width: '100%' }}>
              <DashboardMap height={420} />
              <div style={{ display: 'flex', gap: 16, marginTop: 8, color: '#6b7280', fontSize: 12 }}>
                <div><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 10, background: '#1d4ed8', marginRight: 6 }} /> Sucatarias</div>
                <div><span style={{ color: '#ef4444' }}>●</span> Infrações</div>
              </div>
            </div>
          </Card>

          <Grid minColumnWidth={260} gap={20}>
            <Card title="KPIs">
              {loadingDash ? (
                <div style={{ color: '#6b7280' }}>A carregar…</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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
            
          </Grid>

          <Card title="Sucatarias de maior risco">
            {loadingDash ? <div style={{ color: '#6b7280' }}>A carregar…</div> : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px,1fr))', gap: 12 }}>
                {riskScrapyards.map((s, i) => {
                  const pct = riskPercent(s?.nivel_confianca)
                  const col = riskColor(pct)
                  const barBg = '#fde68a'
                  return (
                    <div key={i} style={{ padding: 12, borderRadius: 12, border: `1px solid ${col}33`, background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                        <div style={{ fontWeight: 800, wordBreak: 'break-word' }}>{s?.nome || s?.scrapyard_id || '—'}</div>
                        <span style={{ fontSize: 12, background: `${col}1A`, color: col, padding: '4px 8px', borderRadius: 999 }}>Risco {pct.toFixed(1)}%</span>
                      </div>
                      <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4, wordBreak: 'break-word' }}>ASC: {s?.asc_name || s?.asc_id || '—'}</div>
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

          <Grid minColumnWidth={360} gap={20}>
            <Card title="Infrações por tipo — Distribuição">
              {loadingDash ? (
                <div style={{ color: '#6b7280' }}>A carregar…</div>
              ) : (
                <DonutChart
                  data={(infractionsByTipo || []).map((it: any) => ({ label: it?.key_name || it?.key_id || '—', value: Number(it?.count || 0) }))}
                />
              )}
            </Card>
            <Card title="Ocorrências por ASC — Distribuição">
              {loadingDash ? (
                <div style={{ color: '#6b7280' }}>A carregar…</div>
              ) : (
                <DonutChart
                  data={(occByAsc || []).map((it: any) => ({ label: it?.asc_name || it?.asc_id || it?.key_name || it?.key_id || '—', value: Number(it?.count || it?.value || 0) }))}
                />
              )}
            </Card>
          </Grid>

          <Card title="Financeiro — Série temporal (perdas vs. gastos)">
            {loadingDash ? <div style={{ color: '#6b7280' }}>A carregar…</div> : (
              <TimeSeriesChart loss={financeLoss} spend={financeSpend} />
            )}
          </Card>

          <Card title="Top ASCs por perdas e gastos">
            {loadingDash ? <div style={{ color: '#6b7280' }}>A carregar…</div> : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px,1fr))', gap: 12 }}>
                {financeTop.map((it, i) => (
                  <div key={i} style={{ padding: 16, borderRadius: 12, border: '1px solid #e5e7eb', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <div style={{ fontWeight: 800, fontSize: 16, wordBreak: 'break-word', marginBottom: 8 }}>{it?.asc_name || it?.asc_id || '—'}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: '#6b7280', fontSize: 12 }}>Perdas</div>
                        <div style={{ fontWeight: 800, color: '#ef4444', fontSize: 18 }}>{formatMoney(it?.loss_total)}</div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: '#6b7280', fontSize: 12 }}>Gastos</div>
                        <div style={{ fontWeight: 800, color: '#0ea5e9', fontSize: 18 }}>{formatMoney(it?.spend_total)}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid #f3f4f6' }}>
                      <div style={{ color: '#6b7280', fontSize: 12 }}>Ocorrências: <strong>{it?.count_occurrences || 0}</strong></div>
                      <div style={{ 
                        fontSize: 11, 
                        padding: '2px 8px', 
                        borderRadius: 12, 
                        background: (it?.loss_total || 0) > (it?.spend_total || 0) ? '#fee2e2' : '#dcfce7',
                        color: (it?.loss_total || 0) > (it?.spend_total || 0) ? '#991b1b' : '#166534'
                      }}>
                        {(it?.loss_total || 0) > (it?.spend_total || 0) ? 'Perdas > Gastos' : 'Gastos ≥ Perdas'}
                      </div>
                    </div>
                  </div>
                ))}
                {!financeTop.length && <div style={{ color: '#6b7280' }}>Sem dados.</div>}
              </div>
            )}
          </Card>
        </div>
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
      {active === 'instalacoes' && (
        /^\/instalacoes\/[^/]+$/.test(path) ? (
          <InstallationDetailScreen />
        ) : (
          <InstallationsScreen />
        )
      )}
      {active === 'instalacoesDashboard' && <InstalacoesDashboardScreen />}
      {active === 'inspeccoesDashboard' && <InspeccoesDashboardScreen />}
      {active === 'instalacaoAccoes' && (
        instalacaoAccoesRoute === 'detail' ? (
          <InstalacaoAccaoDetailScreen />
        ) : (
          <InstalacaoAccoesScreen />
        )
      )}
      {active === 'sucatariasMapa' && <ScrapyardsMapScreen />}
      
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
      {active === 'config' && (
        path.startsWith('/config/tipos-accao') ? (
          <InstalacaoAccaoTiposScreen />
        ) : (
          <ConfigScreen />
        )
      )}
    </AppShell>
  )
}

function Metric({ label, value, color = '#111827' }: { label: string; value: string | number; color?: string }) {
  return (
    <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: 12, width: '100%' }}>
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
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const [width, setWidth] = React.useState<number>(520)
  const H = 180
  React.useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setWidth(el.clientWidth))
    setWidth(el.clientWidth)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  // merge x-domain from both series
  const all = [...(loss || []), ...(spend || [])]
  const pts = all.map((d) => ({ x: new Date(d.ts).getTime(), y: Number(d.total || 0) })).filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y))
  if (!pts.length) return <div style={{ color: '#6b7280' }}>Sem dados</div>
  const minX = Math.min(...pts.map((p) => p.x))
  const maxX = Math.max(...pts.map((p) => p.x))
  const maxY = Math.max(1, ...pts.map((p) => p.y))
  const pad = 24
  const W = Math.max(280, width)
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
    <div ref={containerRef} style={{ width: '100%' }}>
      <svg width={W} height={H} role="img" aria-label="Financeiro série temporal">
        <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="#e5e7eb" />
        <line x1={pad} y1={pad} x2={pad} y2={H - pad} stroke="#e5e7eb" />
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
        {pathSpend && <path d={pathSpend} fill="none" stroke="#0ea5e9" strokeWidth={2} />}
        {pathLoss && <path d={pathLoss} fill="none" stroke="#ef4444" strokeWidth={2} />}
        <g transform={`translate(${W - pad - 140}, ${pad})`}>
          <rect x={0} y={-10} width={140} height={24} fill="#fff" stroke="#e5e7eb" rx={6} />
          <circle cx={12} cy={2} r={4} fill="#ef4444" />
          <text x={22} y={6} fontSize={12} fill="#374151">Perdas</text>
          <circle cx={82} cy={2} r={4} fill="#0ea5e9" />
          <text x={92} y={6} fontSize={12} fill="#374151">Gastos</text>
        </g>
      </svg>
    </div>
  )
}

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
    return [
      `M ${sx} ${sy}`,
      `A ${rOuter} ${rOuter} 0 ${large} 1 ${ex} ${ey}`,
      `L ${isx} ${isy}`,
      `A ${rInner} ${rInner} 0 ${large} 0 ${iex} ${iey}`,
      'Z'
    ].join(' ')
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
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize={18} fill="#111827" fontWeight={800}>
          {total}
        </text>
        <text x={cx} y={cy + 18} textAnchor="middle" dominantBaseline="hanging" fontSize={11} fill="#6b7280">
          total
        </text>
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
              <strong>{s.value}</strong>
              <span style={{ color: '#6b7280', fontSize: 12 }}>{s.pct.toFixed(1)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function DashboardMap({ height = 420 }: { height?: number }) {
  const { getApiConfig, getAuthorizationHeaderValue, logout } = useAuth()
  const scrapyardApi = React.useMemo(() => new ScrapyardApi(getApiConfig()), [getApiConfig])
  const occurrenceApi = React.useMemo(() => new OccurrenceApi(getApiConfig()), [getApiConfig])
  const authHeader = React.useMemo(() => getAuthorizationHeaderValue(), [getAuthorizationHeaderValue])
  const [error, setError] = React.useState<string | null>(null)
  const [scrapyards, setScrapyards] = React.useState<any[]>([])
  const [occurrences, setOccurrences] = React.useState<any[]>([])
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const mapRef = React.useRef<any>(null)
  const markersRef = React.useRef<any[]>([])

  function injectScriptOnce(apiKey: string): Promise<void> {
    if ((window as any).google && (window as any).google.maps) return Promise.resolve()
    if ((window as any).__gmapsLoadingPromise) return (window as any).__gmapsLoadingPromise
    const src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly`
    ;(window as any).__gmapsLoadingPromise = new Promise<void>((resolve, reject) => {
      const existing = document.querySelector(`script[src^="https://maps.googleapis.com/maps/api/js"]`)
      if (existing) {
        existing.addEventListener('load', () => resolve())
        existing.addEventListener('error', () => reject(new Error('Falha ao carregar Google Maps')))
        return
      }
      const script = document.createElement('script')
      script.src = src
      script.async = true
      script.defer = true
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Falha ao carregar Google Maps'))
      document.head.appendChild(script)
    })
    return (window as any).__gmapsLoadingPromise
  }

  const isUnauthorizedBody = (data: any) => {
    try {
      const raw = data?.code ?? data?.error?.code ?? data?.status ?? data?.error?.status ?? data?.error_code
      if (raw === undefined || raw === null) return false
      const num = Number(raw)
      if (!Number.isNaN(num) && num === 401) return true
      const code = String(raw).toUpperCase()
      return code === 'UNAUTHORIZED' || code === 'UNAUTHENTICATED'
    } catch { return false }
  }

  React.useEffect(() => {
    let cancelled = false
    async function loadData() {
      try {
        const [scr, occ] = await Promise.all([
          scrapyardApi.privateScrapyardsGet(authHeader, -1),
          occurrenceApi.privateOccurrencesGet(authHeader, 1, 500, 'created_at', 'desc')
        ])
        if (!cancelled) {
          const sitems = scr.data?.items ?? []
          const oitems = occ.data?.items ?? []
          if (isUnauthorizedBody(scr.data) || isUnauthorizedBody(occ.data)) {
            logout('Sessão expirada. Inicie sessão novamente.')
            return
          }
          setScrapyards(sitems)
          setOccurrences(oitems)
        }
      } catch (err: any) {
        if (err?.response?.status === 401 || isUnauthorizedBody(err?.response?.data)) {
          logout('Sessão expirada. Inicie sessão novamente.')
          return
        }
        if (!cancelled) setError('Falha a obter dados para o mapa.')
      }
    }
    loadData()
    return () => { cancelled = true }
  }, [scrapyardApi, occurrenceApi, authHeader])

  React.useEffect(() => {
    async function init() {
      const key = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY
      if (!key) { setError('Google Maps não está configurado (VITE_GOOGLE_MAPS_API_KEY ausente).'); return }
      try { await injectScriptOnce(key) } catch (e: any) { setError(e?.message || 'Falha ao inicializar o mapa.'); return }
      const g = (window as any).google?.maps
      const center = { lat: -25.965, lng: 32.571 }
      mapRef.current = new g.Map(containerRef.current, {
        center,
        zoom: 10, // ligeiramente mais afastado por defeito
        maxZoom: 12, // limitar zoom máximo automático
        mapTypeControl: false,
        fullscreenControl: false,
        streetViewControl: false,
      })
    }
    init()
  }, [])

  React.useEffect(() => {
    const g = (window as any).google?.maps
    if (!g || !mapRef.current) return
    // limpar marcadores
    markersRef.current.forEach((m) => m.setMap(null))
    markersRef.current = []

    const info = new g.InfoWindow()

    const scrapyardIcon: any = {
      path: g.SymbolPath.CIRCLE,
      scale: 7,
      fillColor: '#1d4ed8', // azul
      fillOpacity: 0.95,
      strokeColor: '#ffffff',
      strokeWeight: 1,
    }
    const infractionIcon: any = {
      path: g.SymbolPath.CIRCLE,
      scale: 7,
      fillColor: '#ef4444', // vermelho
      fillOpacity: 0.95,
      strokeColor: '#ffffff',
      strokeWeight: 1,
    }

    // sucatarias (azul)
    ;(scrapyards || [])
      .map((s: any) => ({ ...s, __lat: Number((s as any).lat), __lng: Number((s as any).long) }))
      .filter((s: any) => Number.isFinite(s.__lat) && Number.isFinite(s.__lng))
      .forEach((s: any) => {
        const position = { lat: s.__lat, lng: s.__lng }
        const marker = new g.Marker({ position, map: mapRef.current, title: s.nome || 'Sucataria', icon: scrapyardIcon })
        marker.addListener('click', () => {
          const asc = (s as any).asc_name || '—'
          const materiais = Array.isArray(s.materiais) && s.materiais.length
            ? (s.materiais.map((m: any) => m?.name).filter(Boolean).join(', '))
            : '—'
          const html = `<div style="max-width:260px">
            <strong>${s.nome || 'Sucataria'}</strong><br/>
            ASC: ${asc}<br/>
            Materiais: ${materiais}
          </div>`
          info.setContent(html)
          info.open({ anchor: marker, map: mapRef.current })
        })
        markersRef.current.push(marker)
      })

    // ocorrências (vermelho)
    ;(occurrences || [])
      .map((o: any) => ({ ...o, __lat: Number((o as any).lat), __lng: Number((o as any).long) }))
      .filter((o: any) => Number.isFinite(o.__lat) && Number.isFinite(o.__lng))
      .forEach((o: any) => {
        const position = { lat: o.__lat, lng: o.__lng }
        const marker = new g.Marker({ position, map: mapRef.current, title: o?.local || 'Ocorrência', icon: infractionIcon })
        marker.addListener('click', () => {
          const when = (o as any)?.data_facto || o?.created_at
          const whenTxt = when ? new Date(when).toLocaleString('pt-PT') : '—'
          const html = `<div style="max-width:240px">
            <strong>Ocorrência</strong><br/>
            Local: ${(o?.local || '—').toString().replace(/</g,'&lt;').replace(/>/g,'&gt;')}<br/>
            Data: ${whenTxt}
          </div>`
          info.setContent(html)
          info.open({ anchor: marker, map: mapRef.current })
        })
        markersRef.current.push(marker)
      })

    // ajustar centro se houver dados
    const positions: Array<{ lat: number; lng: number }> = []
    scrapyards.forEach((s: any) => {
      const la = Number((s as any).lat)
      const ln = Number((s as any).long)
      if (Number.isFinite(la) && Number.isFinite(ln)) positions.push({ lat: la, lng: ln })
    })
    occurrences.forEach((o: any) => {
      const la = Number((o as any).lat)
      const ln = Number((o as any).long)
      if (Number.isFinite(la) && Number.isFinite(ln)) positions.push({ lat: la, lng: ln })
    })
    if (positions.length) {
      const bounds = new (window as any).google.maps.LatLngBounds()
      positions.forEach((p) => bounds.extend(p))
      mapRef.current.fitBounds(bounds)
      // reduzir ligeiramente o zoom automático (caso aproxime demasiado)
      const gEvent = (window as any).google.maps.event
      gEvent.addListenerOnce(mapRef.current, 'idle', () => {
        try {
          const z = mapRef.current.getZoom()
          if (typeof z === 'number' && z > 12) mapRef.current.setZoom(12)
        } catch {}
      })
    }
  }, [scrapyards, occurrences])

  return (
    <div>
      {error ? <div style={{ background: '#fef3c7', color: '#92400e', padding: 10, borderRadius: 8, marginBottom: 8 }}>{error}</div> : null}
      <div ref={containerRef} style={{ width: '100%', height, borderRadius: 12, overflow: 'hidden', border: '1px solid #e5e7eb', background: '#f3f4f6' }} />
    </div>
  )
}
