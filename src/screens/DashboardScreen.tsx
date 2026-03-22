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
import ProvinciasScreen from './ProvinciasScreen'
import DirecoesTransportesScreen from './DirecoesTransportesScreen'
import ASCsScreen from './ASCsScreen'
import FormasConhecimentoScreen from './FormasConhecimentoScreen'
import MateriaisScreen from './MateriaisScreen'
import SetoresInfracaoScreen from './SetoresInfracaoScreen'
import TiposInfracaoScreen from './TiposInfracaoScreen'
import ScrapyardsScreen from './ScrapyardsScreen'
import ScrapyardDetailScreen from './ScrapyardDetailScreen'
import { SemiCircularGauge } from '../components/ui/SemiCircularGauge'
import { useAuth } from '../contexts/AuthContext'
import { DashboardApi, RegiaoApi, ASCApi, TipoInfracaoApi, ScrapyardApi, OccurrenceApi, InfractionApi } from '../services'
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
import ClientesScreen from './ClientesScreen'
import ClienteDetailScreen from './ClienteDetailScreen'
import ClienteAccoesScreen from './ClienteAccoesScreen'
import ClienteAccaoDetailScreen from './ClienteAccaoDetailScreen'
import ClientesDashboardScreen from './ClientesDashboardScreen'
import ClientesInspeccoesDashboardScreen from './ClientesInspeccoesDashboardScreen'
import InstalacaoAccaoTiposScreen from './InstalacaoAccaoTiposScreen'
import AccaoEditScreen from './AccaoEditScreen'
import { AscsInsightsScreen, RegioesInsightsScreen } from './TerritoryInsightsScreen'
import { ClientesAscsDashboardScreen, ClientesRegioesDashboardScreen } from './ClientesTerritoryDashboardScreen'

const MENU = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'dashboardRegioes', label: 'Regiões' },
  { key: 'dashboardAscs', label: 'ASCs' },
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
    dashboardRegioes: '/dashboard/regioes',
    dashboardAscs: '/dashboard/ascs',
    ocorrencias: '/ocorrencias',
    infracoes: '/infracoes',
    infractores: '/infractores',
    accoes: '/accoes',
    instalacoes: '/instalacoes',
    instalacaoAccoes: '/instalacoes/accoes',
    instalacoesDashboard: '/instalacoes/dashboard',
    instalacoesDashboardRegioes: '/instalacoes/dashboard/regioes',
    instalacoesDashboardAscs: '/instalacoes/dashboard/ascs',
    inspeccoesDashboard: '/inspeccoes/dashboard',
    provincias: '/provincias',
    direcoesTransportes: '/direcoes-transportes',
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
    if (!path) return '/instalacoes/dashboard'
    // remove trailing slashes
    let p = path.replace(/\/+$/, '')
    if (p === '') p = '/'
    if (p === '/') return '/instalacoes/dashboard'
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
    return 'instalacoesDashboard'
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
  // Helpers datas
  const formatDateInput = (d: Date) => {
    const y = d.getUTCFullYear()
    const m = String(d.getUTCMonth() + 1).padStart(2, '0')
    const day = String(d.getUTCDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }
  const today = new Date()
  const defaultStart = new Date(Date.UTC(today.getUTCFullYear() - 1, 0, 1))
  const defaultEnd = today
  // Filtros (por defeito: início do ano passado até hoje)
  const [dateStart, setDateStart] = useState<string | null>(() => formatDateInput(defaultStart))
  const [dateEnd, setDateEnd] = useState<string | null>(() => formatDateInput(defaultEnd))
  const [regiaoId, setRegiaoId] = useState('')
  const [ascId, setAscId] = useState('')
  const [bucket, setBucket] = useState<'day' | 'week' | 'month'>('month')
  const [regioes, setRegioes] = useState<any[]>([])
  const [ascs, setAscs] = useState<any[]>([])
  const [tipos, setTipos] = useState<any[]>([])
  const [tipoId, setTipoId] = useState('')
  const regiaoApi = useMemo(() => new RegiaoApi(getApiConfig()), [getApiConfig])
  const ascApi = useMemo(() => new ASCApi(getApiConfig()), [getApiConfig])
  const tipoApi = useMemo(() => new TipoInfracaoApi(getApiConfig()), [getApiConfig])

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
  const [occTab, setOccTab] = useState<'dash' | 'list'>('list')

  function toRfc3339(d?: string | null, endOfDay?: boolean): string | undefined {
    if (!d) return undefined
    try { return new Date(`${d}T${endOfDay ? '23:59:59' : '00:00:00'}Z`).toISOString() } catch { return undefined }
  }

  // Carrega opções de filtros
  useEffect(() => { (async () => { try { const { data } = await regiaoApi.privateRegioesGet(authHeader, 1, 200, 'name', 'asc'); ensureAuthorizedResponse(data); setRegioes((data as any).items ?? []) } catch (err: any) { try { ensureAuthorizedError(err) } catch {} } })() }, [regiaoApi, authHeader])
  useEffect(() => { (async () => { try { const { data } = await ascApi.privateAscsGet(authHeader, 1, 200, 'name', 'asc', undefined, regiaoId || undefined); ensureAuthorizedResponse(data); setAscs((data as any).items ?? []) } catch (err: any) { try { ensureAuthorizedError(err) } catch {} } })() }, [ascApi, authHeader, regiaoId])
  useEffect(() => { (async () => { try { const { data } = await tipoApi.privateTiposInfracaoGet(authHeader, 1, 200, 'name', 'asc'); ensureAuthorizedResponse(data); setTipos((data as any).items ?? []) } catch (err: any) { try { ensureAuthorizedError(err) } catch {} } })() }, [tipoApi, authHeader])

  // Load dashboard data quando ativo e filtros mudam (inclui tab de Ocorrências/Dashboard)
  useEffect(() => {
    const onDash = active === 'dashboard'
    const onOccDash = active === 'ocorrencias' && occRoute === 'list' && occTab === 'dash'
    if (!onDash && !onOccDash) return
    (async () => {
      setLoadingDash(true); setDashError(null)
      try {
        const ds = toRfc3339(dateStart)
        const de = toRfc3339(dateEnd, true)
        const [ov, tot, risky, topAsc, finTs, infTs, byTipo, byRegiao, byAsc] = await Promise.all([
          dashApi.privateDashboardKpisOverviewGet(authHeader, ds, de, regiaoId || undefined, ascId || undefined),
          dashApi.privateDashboardFinanceTotalsGet(authHeader, ds, de, regiaoId || undefined, ascId || undefined),
          dashApi.privateDashboardScrapyardsRiskTopGet(authHeader, 5),
          dashApi.privateDashboardFinanceTopGet(authHeader, ds, de, regiaoId || undefined, 'loss', 5),
          dashApi.privateDashboardFinanceTimeseriesGet(authHeader, ds, de, regiaoId || undefined, ascId || undefined, bucket),
          dashApi.privateDashboardInfractionsValueTimeseriesGet(authHeader, bucket),
          dashApi.privateDashboardGroupedGet('infractions', 'tipo', authHeader, ds, de, regiaoId || undefined, ascId || undefined),
          dashApi.privateDashboardGroupedGet('occurrences', 'regiao', authHeader, ds, de, regiaoId || undefined, ascId || undefined),
          dashApi.privateDashboardGroupedGet('occurrences', 'asc', authHeader, ds, de, regiaoId || undefined, ascId || undefined)
        ])
        ensureAuthorizedResponse(ov.data); ensureAuthorizedResponse(tot.data); ensureAuthorizedResponse(risky.data); ensureAuthorizedResponse(topAsc.data); ensureAuthorizedResponse(finTs.data); ensureAuthorizedResponse(infTs.data); ensureAuthorizedResponse(byTipo.data); ensureAuthorizedResponse(byRegiao.data); ensureAuthorizedResponse(byAsc.data)
        setKpis(ov.data)
        setFinanceTotals(tot.data)
        // Calcula comparação ano-a-ano: janela atual vs mesma janela do ano anterior
        const curStart = dateStart ? new Date(`${dateStart}T00:00:00Z`) : undefined
        const curEnd = dateEnd ? new Date(`${dateEnd}T23:59:59Z`) : undefined
        const now = new Date()
        let winStart = curStart ? new Date(curStart) : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 2, 1))
        let winEnd = curEnd ? new Date(curEnd) : now
        const prevStart = new Date(Date.UTC(winStart.getUTCFullYear() - 1, winStart.getUTCMonth(), winStart.getUTCDate()))
        const prevEnd = new Date(Date.UTC(winEnd.getUTCFullYear() - 1, winEnd.getUTCMonth(), winEnd.getUTCDate()))
        const [totPrev, totCur] = await Promise.all([
          dashApi.privateDashboardFinanceTotalsGet(authHeader, prevStart.toISOString(), prevEnd.toISOString(), regiaoId || undefined, ascId || undefined),
          dashApi.privateDashboardFinanceTotalsGet(authHeader, winStart.toISOString(), winEnd.toISOString(), regiaoId || undefined, ascId || undefined)
        ])
        ensureAuthorizedResponse(totPrev.data); ensureAuthorizedResponse(totCur.data)
        const lossBefore = Number((totPrev.data as any)?.loss_total || 0)
        const lossAfter = Number((totCur.data as any)?.loss_total || 0)
        const spendBefore = Number((totPrev.data as any)?.actions_spend_total || 0)
        const spendAfter = Number((totCur.data as any)?.actions_spend_total || 0)
        const financeCmp = {
          loss_before: lossBefore,
          loss_after: lossAfter,
          loss_change_abs: lossAfter - lossBefore,
          loss_change_pct: lossBefore ? ((lossAfter - lossBefore) / lossBefore) * 100 : null,
          spend_before: spendBefore,
          spend_after: spendAfter,
          spend_change_abs: spendAfter - spendBefore,
          spend_change_pct: spendBefore ? ((spendAfter - spendBefore) / spendBefore) * 100 : null,
        }
        setFinanceCompare(financeCmp)
        setRiskScrapyards((risky.data as any)?.items ?? [])
        setFinanceTop((topAsc.data as any)?.items ?? [])
        setFinanceLoss(((finTs.data as any)?.loss) ?? [])
        setFinanceSpend(((finTs.data as any)?.spend) ?? [])
        setInfractionsSeries(((infTs.data as any)?.buckets) ?? [])
        setInfractionsByTipo(((byTipo.data as any)?.items) ?? [])
        setOccByRegiao(((byRegiao.data as any)?.items) ?? [])
        setOccByAsc(((byAsc.data as any)?.items) ?? [])
      } catch (err: any) {
        try { ensureAuthorizedError(err) } catch {}
        const status = err?.response?.status
        setDashError(!status ? 'Sem ligação ao servidor.' : 'Falha ao carregar métricas do dashboard.')
      } finally { setLoadingDash(false) }
    })()
  }, [active, occRoute, occTab, dashApi, authHeader, dateStart, dateEnd, regiaoId, ascId, bucket])

  const formatDatePt = (d?: string | null) => {
    if (!d) return '—'
    try { return new Date(`${d}T00:00:00Z`).toLocaleDateString('pt-PT') } catch { return d }
  }
  const rangeLabel = `${formatDatePt(dateStart)} a ${formatDatePt(dateEnd)}`


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
    dashboardRegioes: 'Dashboard · Regiões',
    dashboardAscs: 'Dashboard · ASCs',
    ocorrencias: 'Ocorrências',
    infracoes: 'Infrações',
    infractores: 'Infractores',
    accoes: 'Ações',
    sucatarias: 'Sucatarias',
    sucatariasMapa: 'Sucatarias (Mapa)',
    provincias: 'Províncias',
    direcoesTransportes: 'Direções de Transporte',
    utilizadores: 'Utilizadores',
    config: 'Configurações',
    regioes: 'Regiões',
    ascs: 'ASCs',
    formasConhecimento: 'Formas de Conhecimento',
    materiais: 'Materiais',
    setoresInfracao: 'Setores de Infração',
    tiposInfracao: 'Tipos de Infração',
    relatorios: 'Relatórios',
    instalacoes: 'Clientes',
    instalacaoAccoes: 'Ações (Clientes)',
    instalacoesDashboard: 'Dashboard',
    instalacoesDashboardRegioes: 'Dashboard · Regiões',
    instalacoesDashboardAscs: 'Dashboard · ASCs',
    inspeccoesDashboard: 'Dashboard',
  }
  const headerTitle = TITLE_MAP[active] || '—'
  const showHeaderTitle = !(active === 'ocorrencias' && (occRoute === 'create' || occRoute === 'edit' || occRoute === 'detail'))
  const hasSelectedRegiao = Boolean(regiaoId)
  const headerSubtitleMap: Record<string, string> = {
    dashboard: 'Vista operacional consolidada com acesso rápido às métricas, mapas e distribuição de risco.',
    dashboardRegioes: 'Análise territorial por região, com seleção por cards e leitura detalhada do território.',
    dashboardAscs: 'Análise dedicada às ASCs, com foco em desempenho local e indicadores operacionais.',
    ocorrencias: 'Acompanhe registos, mapas e listagens com uma navegação mais clara e foco no contexto atual.',
    infracoes: 'Gerir infrações com espaço visual mais limpo e leitura mais previsível.',
    infractores: 'Aceda aos registos de infractores dentro da mesma estrutura privada revista.',
    accoes: 'Centralize o acompanhamento das ações com melhor separação entre navegação e conteúdo.',
    sucatarias: 'Explore sucatarias e respetivos detalhes com uma área de trabalho mais ampla.',
    utilizadores: 'Administração da plataforma com densidade visual mais controlada.',
    config: 'Parâmetros e catálogos da aplicação organizados numa shell consistente.',
    instalacoesDashboard: 'Análise dedicada a clientes e instalações num layout mais respirado.',
    instalacoesDashboardRegioes: 'Dashboard dedicado a regiões de clientes, com seleção por cards e drill-down territorial.',
    instalacoesDashboardAscs: 'Dashboard dedicado a ASCs de clientes, com seleção por carrossel e contexto específico.',
    inspeccoesDashboard: 'Indicadores de inspeções apresentados numa shell privada mais moderna.',
  }

  const instalacaoAccoesRoute = useMemo(() => {
    if (/^\/instalacoes\/accoes\/[^/]+$/.test(path)) return 'detail'
    return 'list'
  }, [path]) as 'detail' | 'list'

  return (
    <AppShell
      sidebar={(
        <SidebarGroups
          groups={[
            { label: 'Clientes', items: [
              { key: 'instalacoesDashboard', label: 'Dashboard' },
              { key: 'instalacoesDashboardRegioes', label: 'Regiões' },
              { key: 'instalacoesDashboardAscs', label: 'ASCs' },
              { key: 'instalacoes', label: 'Lista' },
              { key: 'instalacaoAccoes', label: 'Ações' },
            ] },
            {
              label: 'Vandalizações',
              items: MENU.filter((i) => !['instalacoes', 'utilizadores', 'config'].includes(i.key))
            },
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
        <div className="app-page-header">
          <div>
            <Heading level={2} className="app-page-header__title">{headerTitle}</Heading>
            <p className="app-page-header__subtitle">
              {headerSubtitleMap[active] || 'Estrutura privada revista com maior clareza visual, melhor hierarquia e mais espaço útil.'}
            </p>
          </div>
        </div>
      ) : undefined}
      >
      {active === 'dashboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          <Card
            title="Filtros"
            subtitle="Refine o dashboard por período, geografia e tipo de infração."
            extra={
              <button
                onClick={() => { setDateStart(null); setDateEnd(null); setRegiaoId(''); setAscId(''); setTipoId(''); setBucket('month') }}
                style={secondaryActionButtonStyle}
              >
                Limpar filtros
              </button>
            }
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 14,
                alignItems: 'end'
              }}
            >
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 13, color: '#374151' }}>Início</span>
                <input type="date" value={dateStart ?? ''} onChange={(e) => setDateStart(e.target.value || null)} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 13, color: '#374151' }}>Fim</span>
                <input type="date" value={dateEnd ?? ''} onChange={(e) => setDateEnd(e.target.value || null)} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 13, color: '#374151' }}>Região</span>
                <select value={regiaoId} onChange={(e) => { setRegiaoId(e.target.value); setAscId('') }}>
                  <option value="">Todas</option>
                  {regioes.map((r: any) => <option key={r.id} value={r.id}>{r.name || r.id}</option>)}
                </select>
              </label>
              {hasSelectedRegiao && (
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 13, color: '#374151' }}>ASC</span>
                  <select value={ascId} onChange={(e) => setAscId(e.target.value)}>
                    <option value="">Todas</option>
                    {ascs.map((a: any) => <option key={a.id} value={a.id}>{a.name || a.id}</option>)}
                  </select>
                </label>
              )}
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 13, color: '#374151' }}>Tipo de Infração</span>
                <select value={tipoId} onChange={(e) => setTipoId(e.target.value)}>
                  <option value="">Todos</option>
                  {tipos.map((t: any) => <option key={t.id} value={t.id}>{t.name || t.id}</option>)}
                </select>
              </label>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
              <span style={filterChipStyle}>Intervalo: {rangeLabel}</span>
              <span style={filterChipStyle}>Região: {regiaoId ? (regioes.find((r: any) => r.id === regiaoId)?.name || regiaoId) : 'Todas'}</span>
              {hasSelectedRegiao ? <span style={filterChipStyle}>ASC: {ascId ? (ascs.find((a: any) => a.id === ascId)?.name || ascId) : 'Todas'}</span> : null}
            </div>
          </Card>

          {dashError && (
            <div style={{ background: '#fee2e2', color: '#991b1b', padding: 12, borderRadius: 10, border: '1px solid #fecaca' }}>
              {dashError}
            </div>
          )}

          <Card title="Mapa Geral">
            <div style={{ width: '100%' }}>
              <DashboardMap height={420} dateStart={dateStart} dateEnd={dateEnd} regiaoId={regiaoId} ascId={ascId} tipoId={tipoId} />
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12, padding: '8px 0', color: '#6b7280', fontSize: 13 }}>
                <div style={{ ...filterChipStyle, marginRight: 'auto' }}>
                  <strong>Intervalo:</strong> {rangeLabel}
                </div>
                <div style={mapLegendChipStyle}>
                  <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', background: '#b42318' }} />
                  <span>Sucatarias</span>
                </div>
                <div style={mapLegendChipStyle}>
                  <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', background: '#0f766e' }} />
                  <span>Ocorrências</span>
                </div>
              </div>
            </div>
          </Card>


          <Grid minColumnWidth={300} gap={16}>
            <Card title="Métricas Principais">
              {loadingDash ? (
                <div style={{ color: '#6b7280', padding: 20, textAlign: 'center' }}>A carregar métricas…</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                  <MetricCard label="Regiões" value={(kpis as any)?.nr_regioes ?? '—'} color="#7c3aed" />
                  <MetricCard label="ASCs" value={(kpis as any)?.nr_ascs ?? '—'} color="#1d4ed8" />
                  <MetricCard label="Ocorrências" value={(kpis as any)?.nr_occurrences ?? '—'} color="#0ea5e9" />
                  <MetricCard label="Infrações" value={(kpis as any)?.nr_infractions ?? '—'} color="#ef4444" />
                  <MetricCard label="Infractores" value={(kpis as any)?.nr_infractors ?? '—'} color="#059669" />
                </div>
              )}
            </Card>

            <Card title={`Resumo Financeiro (${rangeLabel})`}>
              {loadingDash ? (
                <div style={{ color: '#6b7280', padding: 20, textAlign: 'center' }}>A carregar dados…</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(0, 1fr))', gap: 12 }}>
                    <div style={{ padding: 16, borderRadius: 16, background: '#fbe9e7', border: '1px solid #e9b7b2', minWidth: 0 }}>
                      <div style={{ fontSize: 12, color: '#9f2d1f', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.06em' }}>Total Perdas</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: '#b42318', lineHeight: 1.25, overflowWrap: 'anywhere' }}>
                        {formatMoney((kpis as any)?.total_valor_infractions)}
                      </div>
                    </div>
                    <div style={{ padding: 16, borderRadius: 16, background: '#e6f4f1', border: '1px solid #b8ddd4', minWidth: 0 }}>
                      <div style={{ fontSize: 12, color: '#0f766e', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.06em' }}>Gastos Ações</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: '#0f766e', lineHeight: 1.25, overflowWrap: 'anywhere' }}>
                        {formatMoney((financeTotals as any)?.actions_spend_total)}
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: 14, borderRadius: 16, background: '#f6ecde', border: '1px solid rgba(101, 74, 32, 0.12)' }}>
                    <div style={{ fontSize: 12, color: '#7b8494', marginBottom: 4, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>Média por Infração</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#3f4652', overflowWrap: 'anywhere' }}>
                      {formatMoney((kpis as any)?.avg_valor_infraction)}
                    </div>
                  </div>
                </div>
              )}
            </Card>

            <Card title={(() => {
              // Calcula tamanho da janela em meses para titulo
              const s = dateStart ? new Date(`${dateStart}T00:00:00Z`) : null
              const e = dateEnd ? new Date(`${dateEnd}T00:00:00Z`) : null
              let n = 3
              if (s && e) {
                n = Math.max(1, (e.getUTCFullYear() - s.getUTCFullYear()) * 12 + (e.getUTCMonth() - s.getUTCMonth()) + 1)
              }
              return `Evolução (Ano a ano · ${n} meses)`
            })()}>
              {loadingDash ? (
                <div style={{ color: '#6b7280', padding: 20, textAlign: 'center' }}>A carregar comparação…</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <ComparisonCard
                    title="Perdas (Infrações)"
                    before={(financeCompare as any)?.loss_before}
                    after={(financeCompare as any)?.loss_after}
                    changeAbs={(financeCompare as any)?.loss_change_abs}
                    changePct={(financeCompare as any)?.loss_change_pct}
                    goodWhenDecrease
                    color="#ef4444"
                  />
                  <ComparisonCard
                    title="Gastos (Ações)"
                    before={(financeCompare as any)?.spend_before}
                    after={(financeCompare as any)?.spend_after}
                    changeAbs={(financeCompare as any)?.spend_change_abs}
                    changePct={(financeCompare as any)?.spend_change_pct}
                    goodWhenDecrease={false}
                    color="#0ea5e9"
                  />
                </div>
              )}
            </Card>
          </Grid>

          <Card title="Análise de Risco · Sucatarias">
            {loadingDash ? (
              <div style={{ color: '#6b7280', padding: 20, textAlign: 'center' }}>A carregar análise de risco…</div>
            ) : riskScrapyards.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#6b7280' }}>Sem dados de risco disponíveis.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid rgba(101, 74, 32, 0.12)' }}>
                      <th style={{ padding: '12px 8px', textAlign: 'left', color: '#3f4652', fontWeight: 700 }}>Sucataria</th>
                      <th style={{ padding: '12px 8px', textAlign: 'center', color: '#3f4652', fontWeight: 700 }}>Nível Risco</th>
                      <th style={{ padding: '12px 8px', textAlign: 'center', color: '#3f4652', fontWeight: 700 }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {riskScrapyards.map((s, i) => {
                      const pct = riskPercent(s?.nivel_confianca)
                      const col = riskColor(pct)
                      return (
                        <tr key={i} style={{ borderBottom: '1px solid rgba(101, 74, 32, 0.08)' }}>
                          <td style={{ padding: '12px 8px' }}>
                            <div style={{ fontWeight: 600, color: '#111827' }}>{s?.nome || s?.scrapyard_id || '—'}</div>
                          </td>
                          <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                              <div style={{ 
                                width: 60, 
                                height: 8, 
                                background: '#efe4d4', 
                                borderRadius: 4, 
                                overflow: 'hidden',
                                position: 'relative'
                              }}>
                                <div style={{ 
                                  width: `${Math.max(0, Math.min(100, pct))}%`, 
                                  height: '100%', 
                                  background: col,
                                  transition: 'width 0.3s ease'
                                }} />
                              </div>
                              <span style={{ 
                                fontSize: 12, 
                                fontWeight: 600,
                                color: col,
                                padding: '4px 8px',
                                borderRadius: 999,
                                background: `${col}15`
                              }}>
                                {pct.toFixed(1)}%
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                            <button 
                              type="button" 
                              onClick={() => { 
                                if (s?.scrapyard_id) { 
                                  window.history.pushState({}, '', `/sucatarias/${s.scrapyard_id}`)
                                  window.dispatchEvent(new Event('locationchange'))
                                } 
                              }}
                              style={{ 
                                minHeight: 38,
                                padding: '0 14px', 
                                borderRadius: 12, 
                                border: '1px solid rgba(101, 74, 32, 0.14)', 
                                background: 'linear-gradient(180deg, #fffaf2 0%, #f6ecde 100%)', 
                                color: '#8d4a17', 
                                cursor: 'pointer',
                                fontSize: 12,
                                fontWeight: 700,
                                boxShadow: '0 8px 18px rgba(76, 57, 24, 0.08)'
                              }}
                            >
                              Ver detalhes
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Grid minColumnWidth={400} gap={16}>
            <Card title="Distribuição por Tipo de Infração">
              {loadingDash ? (
                <div style={{ color: '#6b7280', padding: 20, textAlign: 'center' }}>A carregar distribuições…</div>
              ) : (
                <DonutChart
                  data={(infractionsByTipo || []).map((it: any) => ({ 
                    label: it?.key_name || it?.key_id || '—', 
                    value: Number(it?.count || 0) 
                  }))}
                />
              )}
            </Card>

            <Card title="Distribuição por ASC">
              {loadingDash ? (
                <div style={{ color: '#6b7280', padding: 20, textAlign: 'center' }}>A carregar distribuições…</div>
              ) : (
                <DonutChart
                  data={(occByAsc || []).map((it: any) => ({ 
                    label: it?.asc_name || it?.asc_id || it?.key_name || it?.key_id || '—', 
                    value: Number(it?.count || it?.value || 0) 
                  }))}
                  onSegmentClick={(idx) => {
                    const it = (occByAsc || [])[idx]
                    if (!it) return
                    const id = it?.asc_id || it?.key_id
                    if (id) {
                      const params = new URLSearchParams()
                      if (regiaoId) params.set('regiaoId', String(regiaoId))
                      params.set('ascId', String(id))
                      navigateToPath(`/dashboard/ascs?${params.toString()}`)
                    }
                  }}
                />
              )}
            </Card>

            {!hasSelectedRegiao && (
              <Card title="Distribuição por Região">
                {loadingDash ? (
                  <div style={{ color: '#6b7280', padding: 20, textAlign: 'center' }}>A carregar distribuições…</div>
                ) : (
                  <DonutChart
                    data={(occByRegiao || []).map((it: any) => ({ 
                      label: it?.regiao_name || it?.regiao_id || it?.key_name || it?.key_id || '—', 
                      value: Number(it?.count || it?.value || 0) 
                    }))}
                    onSegmentClick={(idx) => {
                    const it = (occByRegiao || [])[idx]
                    if (!it) return
                    const id = it?.regiao_id || it?.key_id
                    if (id) navigateToPath(`/dashboard/regioes?regiaoId=${encodeURIComponent(String(id))}`)
                  }}
                />
              )}
            </Card>
            )}
          </Grid>

          <Card title={`Evolução Temporal (${rangeLabel}) · Perdas vs Gastos`}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, color: '#374151' }}>Escala:</span>
                <select value={bucket} onChange={(e) => setBucket(e.target.value as any)} style={{ width: 140 }}>
                  <option value="day">Dia</option>
                  <option value="week">Semana</option>
                  <option value="month">Mês</option>
                </select>
              </label>
            </div>
            {loadingDash ? (
              <div style={{ color: '#6b7280', padding: 40, textAlign: 'center' }}>A carregar série temporal…</div>
            ) : (
              <TimeSeriesChart loss={financeLoss} spend={financeSpend} />
            )}
          </Card>

          <Card title={`Top ASCs (${rangeLabel}) · Distribuição de Perdas`}>
            {loadingDash ? (
              <div style={{ color: '#6b7280', padding: 20, textAlign: 'center' }}>A carregar rankings…</div>
            ) : financeTop.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#6b7280' }}>Sem dados de performance disponíveis.</div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center', maxWidth: 500, margin: '0 auto' }}>
                <DonutChart
                  data={financeTop.map((it: any) => ({ 
                    label: it?.asc_name || it?.asc_id || '—', 
                    value: Number(it?.loss_total || 0) 
                  }))}
                  valueFormatter={(value) => formatMoney(value)}
                />
              </div>
            )}
          </Card>

        </div>
      )}

      {active === 'dashboardRegioes' && <RegioesInsightsScreen />}
      {active === 'dashboardAscs' && <AscsInsightsScreen />}

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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  onClick={() => setOccTab('list')}
                  style={occTab === 'list' ? occTabButtonActiveStyle : occTabButtonStyle}
                >Listagens</button>
                <button
                  onClick={() => setOccTab('dash')}
                  style={occTab === 'dash' ? occTabButtonActiveStyle : occTabButtonStyle}
                >Mapa</button>
              </div>
              <button
                type="button"
                style={occCreateCtaStyle}
                onClick={() => { if (window.location.pathname !== '/ocorrencias/novo') window.history.pushState({}, '', `/ocorrencias/novo${window.location.search}`); window.dispatchEvent(new Event('popstate')); window.dispatchEvent(new Event('locationchange')) }}
              >
                <span style={occCreateCtaIconStyle}>+</span>
                <span>Nova ocorrência</span>
              </button>
            </div>

            {occTab === 'dash' ? (
              <>
                <Card title="Mapa de Ocorrências">
                  <div style={{ width: '100%' }}>
                    <DashboardMap height={420} dateStart={dateStart} dateEnd={dateEnd} regiaoId={regiaoId} ascId={ascId} tipoId={tipoId} interactive={true} />
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12, padding: '8px 0', color: '#6b7280', fontSize: 13 }}>
                      <div style={{ ...filterChipStyle, marginRight: 'auto' }}>
                        <strong>Intervalo:</strong> {rangeLabel}
                      </div>
                      <div style={mapLegendChipStyle}>
                        <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', background: '#b42318' }} />
                        <span>Sucatarias</span>
                      </div>
                      <div style={mapLegendChipStyle}>
                        <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', background: '#0f766e' }} />
                        <span>Ocorrências</span>
                      </div>
                    </div>
                  </div>
                </Card>
                <div style={{ display: 'grid', gap: 16 }}>
                  <Card title="Resumo" subtitle="Indicadores principais do período e da seleção atual.">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <MetricCard label="Ocorrências" value={(kpis as any)?.nr_occurrences ?? '—'} color="#0ea5e9" />
                      <MetricCard label="Infrações" value={(kpis as any)?.nr_infractions ?? '—'} color="#ef4444" />
                    </div>
                  </Card>
                  <Grid columns={2} gap={16}>
                    <Card title="Distribuição por Região" subtitle="Clique numa região para abrir a análise territorial.">
                      <DonutChart
                        data={(occByRegiao || []).map((it: any) => ({ 
                          label: it?.regiao_name || it?.regiao_id || it?.key_name || it?.key_id || '—', 
                          value: Number(it?.count || it?.value || 0) 
                        }))}
                        onSegmentClick={(idx) => {
                          const it = (occByRegiao || [])[idx]
                          if (!it) return
                          const id = it?.regiao_id || it?.key_id
                          if (id) navigateToPath(`/dashboard/regioes?regiaoId=${encodeURIComponent(String(id))}`)
                        }}
                      />
                    </Card>
                    <Card title="Distribuição por ASC" subtitle="Clique numa ASC para abrir a análise detalhada.">
                      <DonutChart
                        data={(occByAsc || []).map((it: any) => ({ 
                          label: it?.asc_name || it?.asc_id || it?.key_name || it?.key_id || '—', 
                          value: Number(it?.count || it?.value || 0) 
                        }))}
                        onSegmentClick={(idx) => {
                          const it = (occByAsc || [])[idx]
                          if (!it) return
                          const id = it?.asc_id || it?.key_id
                          const regId = it?.regiao_id
                          if (id) {
                            const params = new URLSearchParams()
                            if (regId) params.set('regiaoId', String(regId))
                            params.set('ascId', String(id))
                            navigateToPath(`/dashboard/ascs?${params.toString()}`)
                          }
                        }}
                      />
                    </Card>
                  </Grid>
                </div>
              </>
            ) : (
              <OcorrenciasScreen />
            )}
          </div>
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
          <ClienteDetailScreen />
        ) : (
          <ClientesScreen />
        )
      )}
      {active === 'instalacoesDashboard' && (
        <ClientesDashboardScreen
          onRegiaoCardSelect={(nextRegiaoId) => navigateToPath(`/instalacoes/dashboard/regioes?regiaoId=${encodeURIComponent(nextRegiaoId)}`)}
          onAscCardSelect={(nextAscId, nextRegiaoId) => {
            const params = new URLSearchParams()
            if (nextRegiaoId) params.set('regiaoId', String(nextRegiaoId))
            params.set('ascId', String(nextAscId))
            navigateToPath(`/instalacoes/dashboard/ascs?${params.toString()}`)
          }}
        />
      )}
      {active === 'instalacoesDashboardRegioes' && <ClientesRegioesDashboardScreen />}
      {active === 'instalacoesDashboardAscs' && <ClientesAscsDashboardScreen />}
      {active === 'inspeccoesDashboard' && <ClientesInspeccoesDashboardScreen />}
      {active === 'instalacaoAccoes' && (
        instalacaoAccoesRoute === 'detail' ? (
          <ClienteAccaoDetailScreen />
        ) : (
          <ClienteAccoesScreen />
        )
      )}
      {active === 'sucatariasMapa' && <ScrapyardsMapScreen />}
      
      {active === 'provincias' && <ProvinciasScreen />}
      {active === 'direcoesTransportes' && <DirecoesTransportesScreen />}
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

// Mapa de agregação por Região (centroides das ocorrências)
function RegionClusterMap({ height = 360, dateStart, dateEnd, regiaoId, ascId, regioes, onSelectRegiao }: {
  height?: number
  dateStart?: string | null
  dateEnd?: string | null
  regiaoId?: string
  ascId?: string
  regioes: Array<{ id?: string; name?: string }>
  onSelectRegiao?: (id: string) => void
}) {
  const { getApiConfig, getAuthorizationHeaderValue, logout } = useAuth()
  const occurrenceApi = React.useMemo(() => new OccurrenceApi(getApiConfig()), [getApiConfig])
  const authHeader = React.useMemo(() => getAuthorizationHeaderValue(), [getAuthorizationHeaderValue])
  const [error, setError] = React.useState<string | null>(null)
  const [groups, setGroups] = React.useState<Array<{ id: string; name: string; lat: number; lng: number; count: number }>>([])
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

  function buildDashboardMarkerIcon(gmaps: any, kind: 'scrapyard' | 'occurrence', fill: string, stroke: string) {
    const glyph = kind === 'scrapyard'
      ? `<path d="M11 26V20.8L17.2 24.2V20.8L23 24.2V15.2H26V26H11Z" stroke="${stroke}" stroke-width="1.8" stroke-linejoin="round"/><path d="M14.4 26V22.5H17V26" stroke="${stroke}" stroke-width="1.8" stroke-linejoin="round"/><path d="M22.5 15.2V11.8H24.2V15.2" stroke="${stroke}" stroke-width="1.8" stroke-linecap="round"/><path d="M14 18.8H14.01M20 19.5H20.01" stroke="${stroke}" stroke-width="2.3" stroke-linecap="round"/>`
      : `<path d="M18 11L23 20H13L18 11Z" stroke="${stroke}" stroke-width="1.8" stroke-linejoin="round"/><path d="M18 14.8V17.8" stroke="${stroke}" stroke-width="1.8" stroke-linecap="round"/><circle cx="18" cy="19.6" r="0.9" fill="${stroke}"/>`
    const svg = `
      <svg width="38" height="46" viewBox="0 0 38 46" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 1.8C9.7 1.8 2.2 9.3 2.2 18.6C2.2 31.2 17.2 42.7 18.1 43.4C18.6 43.8 19.4 43.8 19.9 43.4C20.8 42.7 35.8 31.2 35.8 18.6C35.8 9.3 28.3 1.8 19 1.8Z" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
        ${glyph}
      </svg>
    `.trim()
    return {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
      scaledSize: new gmaps.Size(38, 46),
      anchor: new gmaps.Point(19, 43),
    }
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

  const toRfc3339 = (d?: string | null, endOfDay?: boolean): string | undefined => {
    if (!d) return undefined
    try { return new Date(`${d}T${endOfDay ? '23:59:59' : '00:00:00'}Z`).toISOString() } catch { return undefined }
  }

  React.useEffect(() => {
    let cancelled = false
    async function loadData() {
      if (!authHeader) return
      try {
        const ds = toRfc3339(dateStart)
        const de = toRfc3339(dateEnd, true)
        // Buscar ocorrências com filtros para calcular centroides por região (limite 1000 para melhor amostragem)
        const { data } = await occurrenceApi.privateOccurrencesGet(authHeader, 1, 1000, 'created_at', 'desc', regiaoId || undefined, ascId || undefined, undefined, undefined, ds, de)
        if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
        const items = (data as any)?.items ?? []
        const byRegion: Record<string, { latSum: number; lngSum: number; count: number }> = {}
        for (const o of items) {
          const id = (o as any)?.regiao_id || ''
          const la = Number((o as any)?.lat)
          const ln = Number((o as any)?.long)
          if (!id || !Number.isFinite(la) || !Number.isFinite(ln)) continue
          if (!byRegion[id]) byRegion[id] = { latSum: 0, lngSum: 0, count: 0 }
          byRegion[id].latSum += la
          byRegion[id].lngSum += ln
          byRegion[id].count += 1
        }
        const mapName = new Map<string, string>((regioes || []).filter((r) => r.id).map((r) => [String(r.id), String(r.name || r.id)]))
        const list: Array<{ id: string; name: string; lat: number; lng: number; count: number }> = Object.entries(byRegion).map(([id, s]) => ({
          id,
          name: mapName.get(id) || id,
          lat: s.latSum / s.count,
          lng: s.lngSum / s.count,
          count: s.count,
        }))
        if (!cancelled) setGroups(list)
      } catch (err: any) {
        if (err?.response?.status === 401 || isUnauthorizedBody(err?.response?.data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
        if (!cancelled) setError('Falha a obter dados para o mapa por região.')
      }
    }
    loadData()
    return () => { cancelled = true }
  }, [occurrenceApi, authHeader, dateStart, dateEnd, regiaoId, ascId, regioes])

  React.useEffect(() => {
    const key = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY
    if (!key) { setError('Google Maps não está configurado (VITE_GOOGLE_MAPS_API_KEY ausente).'); return }
    (async () => { try { await injectScriptOnce(key) } catch (e: any) { setError(e?.message || 'Falha ao inicializar o mapa.') } })()
  }, [])

  React.useEffect(() => {
    const g = (window as any).google?.maps
    if (!g) return
    if (!mapRef.current) {
      const center = { lat: -25.965, lng: 32.571 }
      mapRef.current = new g.Map(containerRef.current, {
        center,
        zoom: 6,
        maxZoom: 12,
        mapTypeControl: false,
        fullscreenControl: false,
        streetViewControl: false,
      })
    }
    // limpar marcadores
    markersRef.current.forEach((m) => m.setMap(null))
    markersRef.current = []

    const info = new g.InfoWindow()
    const clusterIcon: any = {
      path: g.SymbolPath.CIRCLE,
      scale: 8,
      fillColor: '#1d4ed8', // azul: ocorrências
      fillOpacity: 0.95,
      strokeColor: '#ffffff',
      strokeWeight: 1,
    };
    ;(groups || []).forEach((gr) => {
      if (!Number.isFinite(gr.lat) || !Number.isFinite(gr.lng)) return
      const marker = new g.Marker({ position: { lat: gr.lat, lng: gr.lng }, map: mapRef.current, title: `${gr.name}: ${gr.count}`, icon: clusterIcon, label: { text: String(gr.count), color: '#ffffff', fontSize: '12px', fontWeight: '700' } as any })
      marker.addListener('click', () => { onSelectRegiao?.(gr.id) })
      marker.addListener('mouseover', () => {
        const html = `<div style="max-width:220px"><strong>${gr.name}</strong><br/>Ocorrências: ${gr.count}</div>`
        info.setContent(html); info.open({ anchor: marker, map: mapRef.current })
      })
      markersRef.current.push(marker)
    })

    // ajustar vista
    const bounds = new (window as any).google.maps.LatLngBounds()
    let added = false
    ;(groups || []).forEach((gr) => {
      if (Number.isFinite(gr.lat) && Number.isFinite(gr.lng)) { bounds.extend({ lat: gr.lat, lng: gr.lng }); added = true }
    })
    if (added) mapRef.current.fitBounds(bounds)
  }, [groups])

  return (
    <div>
      <div ref={containerRef} style={{ width: '100%', height, borderRadius: 8, overflow: 'hidden', border: '1px solid #e5e7eb', background: '#f3f4f6' }} />
      {error ? <div style={{ color: '#991b1b', background: '#fee2e2', padding: 8, borderRadius: 8, marginTop: 8 }}>{error}</div> : null}
      {!error && (
        <div style={{ color: '#6b7280', marginTop: 6, fontSize: 12 }}>
          Clique numa região para filtrar os gráficos.
        </div>
      )}
    </div>
  )
}

function MetricCard({ label, value, color = '#111827' }: { label: string; value: string | number; color?: string }) {
  return (
    <div style={{ 
      padding: 18, 
      borderRadius: 18, 
      background: 'linear-gradient(180deg, rgba(255,252,247,.96) 0%, rgba(248,241,230,.9) 100%)', 
      border: '1px solid rgba(101, 74, 32, 0.14)',
      boxShadow: '0 12px 24px rgba(76, 57, 24, 0.08)'
    }}>
      <div style={{ fontSize: 12, color: '#7b8494', fontWeight: 700, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.08em' }}>{label}</div>
      <div style={{ fontWeight: 800, fontSize: 26, color }}>{value as any}</div>
    </div>
  )
}

function ComparisonCard({ title, before, after, changeAbs, changePct, goodWhenDecrease = true, color = '#0ea5e9' }: {
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
  
  const sign = (v?: number | null) => (v == null ? '' : (v > 0 ? '+' : ''))
  const colorAbs = (dAbs == null ? '#374151' : (dAbs > 0 ? (goodWhenDecrease ? '#dc2626' : '#16a34a') : (goodWhenDecrease ? '#16a34a' : '#dc2626')))
  const colorPct = (dPct == null ? '#374151' : (dPct > 0 ? (goodWhenDecrease ? '#dc2626' : '#16a34a') : (goodWhenDecrease ? '#16a34a' : '#dc2626')))
  
  return (
    <div style={{ 
      padding: 18, 
      borderRadius: 18, 
      background: 'linear-gradient(180deg, rgba(255,252,247,.96) 0%, rgba(248,241,230,.9) 100%)',
      border: '1px solid rgba(101, 74, 32, 0.14)',
      boxShadow: '0 12px 24px rgba(76, 57, 24, 0.08)'
    }}>
      <div style={{ fontSize: 13, color: '#5f6673', fontWeight: 700, marginBottom: 12 }}>{title}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 11, color: '#7b8494', marginBottom: 4 }}>Período Anterior</div>
          <div style={{ fontWeight: 700, fontSize: 16, color: '#374151' }}>{formatMoney(b ?? undefined)}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#7b8494', marginBottom: 4 }}>Período Atual</div>
          <div style={{ fontWeight: 800, fontSize: 16, color }}>{formatMoney(a ?? undefined)}</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, paddingTop: 12, borderTop: '1px solid rgba(101, 74, 32, 0.08)' }}>
        <div>
          <div style={{ fontSize: 11, color: '#7b8494', marginBottom: 2 }}>Variação Absoluta</div>
          <div style={{ fontWeight: 700, fontSize: 14, color: colorAbs }}>
            {dAbs == null ? '—' : `${sign(dAbs)}${formatMoney(Math.abs(dAbs) as any)}`}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#7b8494', marginBottom: 2 }}>Variação %</div>
          <div style={{ fontWeight: 700, fontSize: 14, color: colorPct }}>
            {dPct == null ? '—' : `${sign(dPct)}${dPct.toFixed(1)}%`}
          </div>
        </div>
      </div>
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

const filterChipStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  minHeight: 34,
  padding: '0 12px',
  borderRadius: 999,
  background: 'linear-gradient(180deg, #faf1e3 0%, #f5ead9 100%)',
  border: '1px solid rgba(101, 74, 32, 0.14)',
  color: '#5f6673',
  fontSize: 12,
  fontWeight: 700,
}

const mapLegendChipStyle: React.CSSProperties = {
  ...filterChipStyle,
  gap: 8,
}

const secondaryActionButtonStyle: React.CSSProperties = {
  minHeight: 42,
  padding: '0 16px',
  borderRadius: 14,
  border: '1px solid rgba(101, 74, 32, 0.16)',
  background: 'linear-gradient(180deg, #fffaf2 0%, #f6ecde 100%)',
  color: '#8d4a17',
  fontWeight: 700,
  boxShadow: '0 8px 18px rgba(76, 57, 24, 0.08)',
}

const occTabButtonStyle: React.CSSProperties = {
  minHeight: 42,
  padding: '0 16px',
  borderRadius: 14,
  border: '1px solid rgba(101, 74, 32, 0.14)',
  background: 'linear-gradient(180deg, #fffaf2 0%, #f6ecde 100%)',
  color: '#5f6673',
  fontWeight: 700,
  boxShadow: '0 8px 18px rgba(76, 57, 24, 0.06)',
}

const occTabButtonActiveStyle: React.CSSProperties = {
  ...occTabButtonStyle,
  border: '1px solid rgba(201, 109, 31, 0.28)',
  background: 'linear-gradient(180deg, rgba(255, 244, 230, 0.98) 0%, rgba(248, 231, 205, 0.92) 100%)',
  color: '#8d4a17',
  boxShadow: '0 12px 24px rgba(76, 57, 24, 0.10)',
}

const occCreateCtaStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  minHeight: 44,
  padding: '0 18px',
  border: '1px solid rgba(201, 109, 31, 0.18)',
  borderRadius: 16,
  background: 'linear-gradient(135deg, #c96d1f 0%, #a85c1c 100%)',
  color: '#fff8ef',
  fontSize: 15,
  fontWeight: 800,
  letterSpacing: '.01em',
  boxShadow: '0 18px 34px rgba(201, 109, 31, 0.22)',
  cursor: 'pointer',
}

const occCreateCtaIconStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 22,
  height: 22,
  borderRadius: 999,
  background: 'rgba(255, 248, 239, 0.18)',
  fontSize: 18,
  lineHeight: 1,
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
  const [width, setWidth] = React.useState<number>(800)
  const [hoveredPoint, setHoveredPoint] = React.useState<{ x: number; y: number; loss?: number; spend?: number; date?: string } | null>(null)
  const H = 300 // Aumentar altura para melhor visualização
  const pad = 50 // Aumentar padding para labels melhores
  
  React.useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setWidth(el.clientWidth))
    setWidth(el.clientWidth)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Preparar dados das séries
  const lossData = (loss || []).map((d) => ({ x: new Date(d.ts).getTime(), y: Number(d.total || 0), ts: d.ts }))
    .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y))
    .sort((a, b) => a.x - b.x)
  
  const spendData = (spend || []).map((d) => ({ x: new Date(d.ts).getTime(), y: Number(d.total || 0), ts: d.ts }))
    .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y))
    .sort((a, b) => a.x - b.x)

  if (!lossData.length && !spendData.length) return <div style={{ color: '#6b7280', textAlign: 'center', padding: '40px' }}>Sem dados financeiros disponíveis</div>

  // Calcular domínios
  const allData = [...lossData, ...spendData]
  const minX = Math.min(...allData.map((p) => p.x))
  const maxX = Math.max(...allData.map((p) => p.x))
  const maxY = Math.max(1, ...allData.map((p) => p.y))
  
  const W = Math.max(400, width)
  const chartWidth = W - pad * 2
  const chartHeight = H - pad * 2

  // Funções de escala
  const sx = (x: number) => pad + ((x - minX) / Math.max(1, (maxX - minX))) * chartWidth
  const sy = (y: number) => H - pad - (y / maxY) * chartHeight

  // Criar paths das linhas
  const createPath = (data: Array<{ x: number; y: number }>) => {
    if (!data.length) return ''
    return data.map((p, i) => `${i === 0 ? 'M' : 'L'} ${sx(p.x)} ${sy(p.y)}`).join(' ')
  }

  const pathLoss = createPath(lossData)
  const pathSpend = createPath(spendData)

  // Criar áreas preenchidas
  const createArea = (data: Array<{ x: number; y: number }>) => {
    if (!data.length) return ''
    const path = data.map((p, i) => `${i === 0 ? 'M' : 'L'} ${sx(p.x)} ${sy(p.y)}`).join(' ')
    const baseline = `L ${sx(data[data.length - 1].x)} ${sy(0)} L ${sx(data[0].x)} ${sy(0)} Z`
    return path + ' ' + baseline
  }

  const areaLoss = createArea(lossData)
  const areaSpend = createArea(spendData)

  // Ticks do eixo Y
  const yTicks = 6
  const xTicks = Math.min(8, Math.max(4, Math.floor(chartWidth / 120)))

  // Datas para eixo X
  const timeSpan = maxX - minX
  const xTickValues = Array.from({ length: xTicks }, (_, i) => {
    return minX + (timeSpan / (xTicks - 1)) * i
  })

  // Tooltip handler
  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    
    if (mouseX < pad || mouseX > W - pad || mouseY < pad || mouseY > H - pad) {
      setHoveredPoint(null)
      return
    }

    // Encontrar ponto mais próximo no tempo
    const timeAtMouse = minX + ((mouseX - pad) / chartWidth) * (maxX - minX)
    
    // Encontrar valores nas séries para este tempo
    const findClosestValue = (data: Array<{ x: number; y: number; ts: string }>) => {
      if (!data.length) return null
      const closest = data.reduce((prev, curr) => 
        Math.abs(curr.x - timeAtMouse) < Math.abs(prev.x - timeAtMouse) ? curr : prev
      )
      return closest
    }

    const closestLoss = findClosestValue(lossData)
    const closestSpend = findClosestValue(spendData)
    
    if (closestLoss || closestSpend) {
      const refPoint = closestLoss || closestSpend!
      setHoveredPoint({
        x: sx(refPoint.x),
        y: mouseY,
        loss: closestLoss?.y,
        spend: closestSpend?.y,
        date: new Date(refPoint.x).toLocaleDateString('pt-PT', { month: 'short', year: 'numeric' })
      })
    }
  }

  const handleMouseLeave = () => setHoveredPoint(null)

  return (
    <div ref={containerRef} style={{ width: '100%', position: 'relative' }}>
      <svg 
        width={W} 
        height={H} 
        role="img" 
        aria-label="Série temporal financeira"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ cursor: 'crosshair' }}
      >
        {/* Definir gradientes */}
        <defs>
          <linearGradient id="lossGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#b42318" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#b42318" stopOpacity="0.05" />
          </linearGradient>
          <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0f766e" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#0f766e" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Grid de fundo */}
        {Array.from({ length: yTicks + 1 }).map((_, i) => {
          const yv = (i / yTicks) * maxY
          const y = sy(yv)
          return (
            <line key={`y-grid-${i}`} x1={pad} y1={y} x2={W - pad} y2={y} stroke="#e8dfd2" strokeDasharray="3,4" />
          )
        })}
        
        {xTickValues.map((xv, i) => {
          const x = sx(xv)
          return (
            <line key={`x-grid-${i}`} x1={x} y1={pad} x2={x} y2={H - pad} stroke="#e8dfd2" strokeDasharray="3,4" />
          )
        })}

        {/* Eixos principais */}
        <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="#cfbfaa" strokeWidth="2" />
        <line x1={pad} y1={pad} x2={pad} y2={H - pad} stroke="#cfbfaa" strokeWidth="2" />

        {/* Áreas preenchidas */}
        {areaSpend && <path d={areaSpend} fill="url(#spendGradient)" />}
        {areaLoss && <path d={areaLoss} fill="url(#lossGradient)" />}

        {/* Linhas das séries */}
        {pathSpend && <path d={pathSpend} fill="none" stroke="#0f766e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
        {pathLoss && <path d={pathLoss} fill="none" stroke="#b42318" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}

        {/* Pontos de dados */}
        {lossData.map((point, i) => (
          <circle key={`loss-${i}`} cx={sx(point.x)} cy={sy(point.y)} r="4" fill="#b42318" stroke="#fffaf2" strokeWidth="2" />
        ))}
        {spendData.map((point, i) => (
          <circle key={`spend-${i}`} cx={sx(point.x)} cy={sy(point.y)} r="4" fill="#0f766e" stroke="#fffaf2" strokeWidth="2" />
        ))}

        {/* Labels do eixo Y */}
        {Array.from({ length: yTicks + 1 }).map((_, i) => {
          const yv = (i / yTicks) * maxY
          const y = sy(yv)
          return (
            <g key={`y-label-${i}`}>
              <line x1={pad - 6} y1={y} x2={pad} y2={y} stroke="#9d9487" />
              <text x={pad - 10} y={y + 4} fontSize={11} fill="#7b8494" textAnchor="end">
                {yv === 0 ? '0' : `${(yv / 1000000).toFixed(1)}M`}
              </text>
            </g>
          )
        })}

        {/* Labels do eixo X */}
        {xTickValues.map((xv, i) => {
          const x = sx(xv)
          const date = new Date(xv)
          return (
            <g key={`x-label-${i}`}>
              <line x1={x} y1={H - pad} x2={x} y2={H - pad + 6} stroke="#9d9487" />
              <text x={x} y={H - pad + 18} fontSize={11} fill="#7b8494" textAnchor="middle">
                {date.toLocaleDateString('pt-PT', { month: 'short', year: '2-digit' })}
              </text>
            </g>
          )
        })}

        {/* Linha vertical do hover */}
        {hoveredPoint && (
          <>
            <line 
              x1={hoveredPoint.x} 
              y1={pad} 
              x2={hoveredPoint.x} 
              y2={H - pad} 
              stroke="#5f6673" 
              strokeWidth="1" 
              strokeDasharray="4,4"
            />
            <circle cx={hoveredPoint.x} cy={hoveredPoint.y} r="6" fill="#5f6673" fillOpacity="0.12" />
          </>
        )}

        {/* Legenda melhorada */}
        <g transform={`translate(${W - 200}, ${pad + 10})`}>
          <rect x={0} y={-15} width={190} height={50} fill="#fffaf2" stroke="#d9c9b4" rx="12" fillOpacity="0.98" />
          <g transform="translate(15, 5)">
            <circle cx={8} cy={0} r={6} fill="#b42318" />
            <text x={20} y={4} fontSize={13} fill="#3f4652" fontWeight="600">Perdas</text>
            <circle cx={8} cy={20} r={6} fill="#0f766e" />
            <text x={20} y={24} fontSize={13} fill="#3f4652" fontWeight="600">Gastos</text>
          </g>
        </g>

        {/* Título do eixo Y */}
        <text x={15} y={pad - 15} fontSize={12} fill="#7b8494" fontWeight="600">MT (Milhões)</text>
      </svg>

      {/* Tooltip */}
      {hoveredPoint && (
        <div
          style={{
            position: 'absolute',
            left: Math.min(hoveredPoint.x + 10, W - 200),
            top: Math.max(hoveredPoint.y - 80, 10),
            background: '#fffaf2',
            border: '1px solid #d9c9b4',
            borderRadius: '12px',
            padding: '12px',
            boxShadow: '0 16px 32px rgba(76, 57, 24, 0.16)',
            fontSize: '13px',
            minWidth: '160px',
            zIndex: 10
          }}
        >
          <div style={{ fontWeight: '700', marginBottom: '8px', color: '#3f4652' }}>
            {hoveredPoint.date}
          </div>
          {hoveredPoint.loss !== undefined && (
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#b42318', marginRight: '8px' }} />
              <span style={{ color: '#7b8494' }}>Perdas:</span>
              <span style={{ marginLeft: '8px', fontWeight: '600', color: '#b42318' }}>
                {formatMoney(hoveredPoint.loss)}
              </span>
            </div>
          )}
          {hoveredPoint.spend !== undefined && (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#0f766e', marginRight: '8px' }} />
              <span style={{ color: '#7b8494' }}>Gastos:</span>
              <span style={{ marginLeft: '8px', fontWeight: '600', color: '#0f766e' }}>
                {formatMoney(hoveredPoint.spend)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function DonutChart({
  data,
  onSegmentClick,
  valueFormatter,
}: {
  data: Array<{ label: string; value: number }>
  onSegmentClick?: (index: number) => void
  valueFormatter?: (value: number) => string
}) {
  const [hoverIdx, setHoverIdx] = React.useState<number | null>(null)
  const clean = Array.isArray(data) ? data.filter(d => Number.isFinite(d.value) && d.value > 0) : []
  const total = clean.reduce((s, d) => s + d.value, 0)
  const W = 240
  const H = 240
  const cx = W / 2
  const cy = H / 2
  const rOuter = 100
  const rInner = 60
  const palette = ['#c96d1f', '#0f766e', '#b42318', '#8d4a17', '#3b7a57', '#c2410c', '#6b8a3a', '#7c5a2b']
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
  const formatValue = valueFormatter ?? ((value: number) => value.toLocaleString('pt-PT'))

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) minmax(220px, 1fr)', gap: 16, alignItems: 'center' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" role="img" aria-label="Donut chart">
        <circle cx={cx} cy={cy} r={rOuter} fill="#f6ecde" />
        <circle cx={cx} cy={cy} r={rInner} fill="#fffaf2" />
        {segments.map((s, i) => {
          const mid = (s.start + s.end) / 2
          const isHover = hoverIdx === i
          const hasHover = hoverIdx !== null
          const offset = isHover ? 6 : 0
          const dx = Math.cos(mid) * offset
          const dy = Math.sin(mid) * offset
          const scale = isHover ? 1.04 : 1
          const opacity = hasHover ? (isHover ? 1 : 0.6) : 1
          return (
            <path
              key={i}
              d={arcPath(s.start, s.end)}
              fill={s.color}
              stroke="#fffaf2"
              strokeWidth={1}
              style={{ cursor: onSegmentClick ? 'pointer' : 'default', transform: `translate(${dx}px, ${dy}px) scale(${scale})`, transformOrigin: `${cx}px ${cy}px`, transition: 'transform 160ms ease, opacity 160ms ease', opacity }}
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
              onClick={() => { if (onSegmentClick) onSegmentClick(i) }}
            />
          )
        })}
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize={20} fill="#1f2937" fontWeight={800}>
          {total}
        </text>
        <text x={cx} y={cy + 18} textAnchor="middle" dominantBaseline="hanging" fontSize={11} fill="#7b8494">
          total
        </text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
        {segments.length === 0 && <div style={{ color: '#6b7280' }}>Sem dados.</div>}
        {segments.map((s, i) => {
          const isHover = hoverIdx === i
          return (
            <div
              key={i}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, cursor: onSegmentClick ? 'pointer' : 'default', background: isHover ? '#f6ecde' : 'transparent', borderRadius: 12, padding: isHover ? '8px 10px' : '4px 0', transition: 'background 120ms ease, padding 120ms ease' }}
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
              onClick={() => { if (onSegmentClick) onSegmentClick(i) }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: s.color, display: 'inline-block' }} />
                <span style={{ color: '#3f4652', fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: isHover ? 700 as any : 500 as any }}>{s.label}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <strong style={{ color: '#1f2937' }}>{formatValue(s.value)}</strong>
                <span style={{ color: '#7b8494', fontSize: 12 }}>{s.pct.toFixed(1)}%</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DashboardMap({ height = 420, dateStart, dateEnd, regiaoId, ascId, tipoId, interactive = true }: { height?: number; dateStart?: string | null; dateEnd?: string | null; regiaoId?: string; ascId?: string; tipoId?: string; interactive?: boolean }) {
  const { getApiConfig, getAuthorizationHeaderValue, logout } = useAuth()
  const scrapyardApi = React.useMemo(() => new ScrapyardApi(getApiConfig()), [getApiConfig])
  const occurrenceApi = React.useMemo(() => new OccurrenceApi(getApiConfig()), [getApiConfig])
  const infractionApi = React.useMemo(() => new InfractionApi(getApiConfig()), [getApiConfig])
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

  const toRfc3339 = (d?: string | null, endOfDay?: boolean): string | undefined => {
    if (!d) return undefined
    try { return new Date(`${d}T${endOfDay ? '23:59:59' : '00:00:00'}Z`).toISOString() } catch { return undefined }
  }

  React.useEffect(() => {
    let cancelled = false
    async function loadData() {
      if (!authHeader) return
      try {
        const ds = toRfc3339(dateStart)
        const de = toRfc3339(dateEnd, true)
        const [scr, occ, infr] = await Promise.all([
          scrapyardApi.privateScrapyardsGet(authHeader, -1),
          // Buscar TODAS as ocorrências (-1) e aplicar filtros (região/ASC/datas)
          occurrenceApi.privateOccurrencesGet(
            authHeader,
            -1,
            undefined,
            'created_at',
            'desc',
            regiaoId || undefined,
            ascId || undefined,
            undefined,
            undefined,
            undefined,
            ds,
            de,
            undefined,
            undefined,
            undefined
          ),
          // Quando filtrar por tipo, buscar TODAS as infrações desse tipo
          tipoId ? infractionApi.privateInfractionsGet(authHeader, -1, undefined, 'created_at', 'desc', tipoId || undefined, undefined) : Promise.resolve({ data: { items: [] } } as any)
        ])
        if (!cancelled) {
          const sitems = scr.data?.items ?? []
          let oitems = occ.data?.items ?? []
          if (isUnauthorizedBody(scr.data) || isUnauthorizedBody(occ.data)) {
            logout('Sessão expirada. Inicie sessão novamente.')
            return
          }
          // Se houver filtro de tipo, manter apenas ocorrências que tenham pelo menos uma infração desse tipo (com base no join por occurrence_id)
          if (tipoId) {
            const infItems = (infr.data as any)?.items ?? []
            const occIds = new Set<string>(infItems.map((it: any) => String(it.occurrence_id || '')).filter(Boolean))
            oitems = (oitems || []).filter((o: any) => (o?.id ? occIds.has(String(o.id)) : false))
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
  }, [scrapyardApi, occurrenceApi, authHeader, dateStart, dateEnd, regiaoId, ascId])

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
        styles: [
          { elementType: 'geometry', stylers: [{ color: '#efe7da' }] },
          { elementType: 'labels.text.fill', stylers: [{ color: '#5f6673' }] },
          { elementType: 'labels.text.stroke', stylers: [{ color: '#f8f4ec' }] },
          { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
          { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#e2d6c6' }] },
          { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#e8dfd2' }] },
          { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#cde7df' }] },
          { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#c8b9a4' }] },
        ],
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
    const escapeHtml = (value: any) => String(value ?? '—')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')

    const buildDashboardMarkerIcon = (gmaps: any, kind: 'scrapyard' | 'occurrence', fill: string, stroke: string) => {
      const glyph = kind === 'scrapyard'
        ? `<path d="M11 26V20.8L17.2 24.2V20.8L23 24.2V15.2H26V26H11Z" stroke="${stroke}" stroke-width="1.8" stroke-linejoin="round"/><path d="M14.4 26V22.5H17V26" stroke="${stroke}" stroke-width="1.8" stroke-linejoin="round"/><path d="M22.5 15.2V11.8H24.2V15.2" stroke="${stroke}" stroke-width="1.8" stroke-linecap="round"/><path d="M14 18.8H14.01M20 19.5H20.01" stroke="${stroke}" stroke-width="2.3" stroke-linecap="round"/>`
        : `<path d="M18 11L23 20H13L18 11Z" stroke="${stroke}" stroke-width="1.8" stroke-linejoin="round"/><path d="M18 14.8V17.8" stroke="${stroke}" stroke-width="1.8" stroke-linecap="round"/><circle cx="18" cy="19.6" r="0.9" fill="${stroke}"/>`
      const svg = `
        <svg width="38" height="46" viewBox="0 0 38 46" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 1.8C9.7 1.8 2.2 9.3 2.2 18.6C2.2 31.2 17.2 42.7 18.1 43.4C18.6 43.8 19.4 43.8 19.9 43.4C20.8 42.7 35.8 31.2 35.8 18.6C35.8 9.3 28.3 1.8 19 1.8Z" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
          ${glyph}
        </svg>
      `.trim()
      return {
        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
        scaledSize: new gmaps.Size(38, 46),
        anchor: new gmaps.Point(19, 43),
      }
    }

    const scrapyardIcon = buildDashboardMarkerIcon(g, 'scrapyard', '#b42318', '#fffaf2')
    const infractionIcon = buildDashboardMarkerIcon(g, 'occurrence', '#0f766e', '#fffaf2')

    // sucatarias (vermelho)
    ;(scrapyards || [])
      .map((s: any) => ({ ...s, __lat: Number((s as any).lat), __lng: Number((s as any).long) }))
      .filter((s: any) => Number.isFinite(s.__lat) && Number.isFinite(s.__lng))
      .forEach((s: any) => {
        const position = { lat: s.__lat, lng: s.__lng }
        const marker = new g.Marker({ position, map: mapRef.current, title: s.nome || 'Sucataria', icon: scrapyardIcon })
        if (interactive) marker.addListener('click', () => {
          const asc = (s as any).asc_name || '—'
          const materiais = Array.isArray(s.materiais) && s.materiais.length
            ? (s.materiais.map((m: any) => m?.name).filter(Boolean).join(', '))
            : '—'
          const detailUrl = `/sucatarias/${encodeURIComponent(String(s?.scrapyard_id || s?.id || ''))}`
          const html = `<div style="max-width:280px;font-family:Manrope,'Segoe UI',sans-serif;background:linear-gradient(180deg,#fffaf2 0%,#f6ecde 100%);border:1px solid rgba(101,74,32,.14);border-radius:18px;padding:14px;box-shadow:0 14px 28px rgba(76,57,24,.12);color:#1f2937">
            <div style="font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#8d4a17;margin-bottom:6px">Sucataria</div>
            <div style="font-size:16px;font-weight:800;line-height:1.2;margin-bottom:10px">${escapeHtml(s.nome || 'Sucataria')}</div>
            <div style="display:grid;gap:6px;margin-bottom:12px">
              <div style="font-size:12px;color:#5f6673"><strong style="color:#3f4652">ASC:</strong> ${escapeHtml(asc)}</div>
              <div style="font-size:12px;color:#5f6673"><strong style="color:#3f4652">Materiais:</strong> ${escapeHtml(materiais)}</div>
            </div>
            <a href="${detailUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 14px;border-radius:12px;border:1px solid rgba(101,74,32,.14);background:linear-gradient(180deg,#fffaf2 0%,#f6ecde 100%);color:#8d4a17;font-size:12px;font-weight:700;text-decoration:none;box-shadow:0 8px 18px rgba(76,57,24,.08)">
              Abrir detalhe
            </a>
          </div>`
          info.setContent(html)
          info.open({ anchor: marker, map: mapRef.current })
        })
        markersRef.current.push(marker)
      })

    // ocorrências (azul)
    ;(occurrences || [])
      .map((o: any) => ({ ...o, __lat: Number((o as any).lat), __lng: Number((o as any).long) }))
      .filter((o: any) => Number.isFinite(o.__lat) && Number.isFinite(o.__lng))
      .forEach((o: any) => {
        const position = { lat: o.__lat, lng: o.__lng }
        const marker = new g.Marker({ position, map: mapRef.current, title: o?.local || 'Ocorrência', icon: infractionIcon })
        if (interactive) marker.addListener('click', () => {
          const when = (o as any)?.data_facto || o?.created_at
          const whenTxt = when ? new Date(when).toLocaleString('pt-PT') : '—'
          const detailUrl = `/ocorrencias/${encodeURIComponent(String(o?.id || ''))}`
          const html = `<div style="max-width:280px;font-family:Manrope,'Segoe UI',sans-serif;background:linear-gradient(180deg,#fffaf2 0%,#f6ecde 100%);border:1px solid rgba(101,74,32,.14);border-radius:18px;padding:14px;box-shadow:0 14px 28px rgba(76,57,24,.12);color:#1f2937">
            <div style="font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#0f766e;margin-bottom:6px">Ocorrência</div>
            <div style="font-size:16px;font-weight:800;line-height:1.2;margin-bottom:10px">${escapeHtml(o?.local || 'Ocorrência')}</div>
            <div style="display:grid;gap:6px;margin-bottom:12px">
              <div style="font-size:12px;color:#5f6673"><strong style="color:#3f4652">Data:</strong> ${escapeHtml(whenTxt)}</div>
              <div style="font-size:12px;color:#5f6673"><strong style="color:#3f4652">ID:</strong> ${escapeHtml(o?.id || '—')}</div>
            </div>
            <a href="${detailUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 14px;border-radius:12px;border:1px solid rgba(15,118,110,.18);background:linear-gradient(180deg,#eef8f5 0%,#ddf0eb 100%);color:#0f766e;font-size:12px;font-weight:700;text-decoration:none;box-shadow:0 8px 18px rgba(15,118,110,.10)">
              Abrir detalhe
            </a>
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
      {error ? <div style={{ background: '#fff1e8', color: '#8d4a17', padding: 10, borderRadius: 12, marginBottom: 10, border: '1px solid rgba(141, 74, 23, 0.18)' }}>{error}</div> : null}
      <div ref={containerRef} style={{ width: '100%', height, borderRadius: 22, overflow: 'hidden', border: '1px solid rgba(101, 74, 32, 0.14)', background: '#efe7da', boxShadow: '0 18px 36px rgba(76, 57, 24, 0.08)' }} />
    </div>
  )
}
