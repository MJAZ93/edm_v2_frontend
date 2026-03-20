import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Card } from '../components/ui/Card'
import { Grid } from '../components/layout/Grid'
import { useAuth } from '../contexts/AuthContext'
import { ASCApi, DashboardApi, RegiaoApi } from '../services'
import { useUnauthorizedHandlers } from '../utils/auth'

type Mode = 'regiao' | 'asc'
type OptionItem = { id: string; name: string; subtitle?: string; count: number; regiaoId?: string }

type Props = {
  mode: Mode
}

function TerritoryInsightsScreen({ mode }: Props) {
  const { getApiConfig, getAuthorizationHeaderValue } = useAuth()
  const dashApi = useMemo(() => new DashboardApi(getApiConfig()), [getApiConfig])
  const regiaoApi = useMemo(() => new RegiaoApi(getApiConfig()), [getApiConfig])
  const ascApi = useMemo(() => new ASCApi(getApiConfig()), [getApiConfig])
  const authHeader = useMemo(() => getAuthorizationHeaderValue(), [getAuthorizationHeaderValue])
  const { ensureAuthorizedResponse, ensureAuthorizedError } = useUnauthorizedHandlers()

  const [selectedId, setSelectedId] = useState('')
  const [regionScopeId, setRegionScopeId] = useState('')
  const [regioes, setRegioes] = useState<any[]>([])
  const [options, setOptions] = useState<OptionItem[]>([])
  const [loadingOptions, setLoadingOptions] = useState(false)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [kpis, setKpis] = useState<any | null>(null)
  const [totals, setTotals] = useState<any | null>(null)
  const [typeDistribution, setTypeDistribution] = useState<Array<{ label: string; value: number }>>([])
  const [secondaryDistribution, setSecondaryDistribution] = useState<Array<{ label: string; value: number }>>([])
  const [lossSeries, setLossSeries] = useState<Array<{ ts: string; total: number }>>([])
  const [spendSeries, setSpendSeries] = useState<Array<{ ts: string; total: number }>>([])
  const [animatingCardId, setAnimatingCardId] = useState<string | null>(null)
  const detailsRef = useRef<HTMLDivElement | null>(null)

  const now = new Date()
  const defaultStart = new Date(Date.UTC(now.getUTCFullYear() - 1, 0, 1))
  const formatDateInput = (d: Date) => {
    const y = d.getUTCFullYear()
    const m = String(d.getUTCMonth() + 1).padStart(2, '0')
    const day = String(d.getUTCDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }
  const [dateStart] = useState<string>(formatDateInput(defaultStart))
  const [dateEnd] = useState<string>(formatDateInput(now))

  const pageTitle = mode === 'regiao' ? 'Análise por Região' : 'Análise por ASC'
  const pageSubtitle = mode === 'regiao'
    ? 'Selecione uma região para analisar indicadores, distribuição e evolução financeira do território.'
    : 'Selecione uma ASC para analisar indicadores e contexto operacional com o mesmo design system do dashboard principal.'

  const syncFromUrl = () => {
    const params = new URLSearchParams(window.location.search)
    if (mode === 'regiao') {
      setSelectedId(params.get('regiaoId') || '')
      setRegionScopeId('')
    } else {
      setSelectedId(params.get('ascId') || '')
      setRegionScopeId(params.get('regiaoId') || '')
    }
  }

  useEffect(() => {
    syncFromUrl()
    const onLocationChange = () => syncFromUrl()
    window.addEventListener('popstate', onLocationChange)
    window.addEventListener('locationchange', onLocationChange)
    return () => {
      window.removeEventListener('popstate', onLocationChange)
      window.removeEventListener('locationchange', onLocationChange)
    }
  }, [mode])

  const toRfc3339 = (d?: string | null, endOfDay?: boolean): string | undefined => {
    if (!d) return undefined
    try { return new Date(`${d}T${endOfDay ? '23:59:59' : '00:00:00'}Z`).toISOString() } catch { return undefined }
  }

  const updateSearch = (nextSelectedId: string, nextRegionScopeId?: string) => {
    const params = new URLSearchParams()
    const basePath = mode === 'regiao' ? '/dashboard/regioes' : '/dashboard/ascs'
    if (mode === 'regiao') {
      if (nextSelectedId) params.set('regiaoId', nextSelectedId)
    } else {
      if (nextRegionScopeId) params.set('regiaoId', nextRegionScopeId)
      if (nextSelectedId) params.set('ascId', nextSelectedId)
    }
    const nextPath = params.toString() ? `${basePath}?${params.toString()}` : basePath
    window.history.pushState({}, '', nextPath)
    window.dispatchEvent(new Event('locationchange'))
  }

  useEffect(() => {
    (async () => {
      try {
        const { data } = await regiaoApi.privateRegioesGet(authHeader, 1, 300, 'name', 'asc')
        ensureAuthorizedResponse(data)
        setRegioes((data as any)?.items ?? [])
      } catch (err: any) {
        try { ensureAuthorizedError(err) } catch {}
      }
    })()
  }, [regiaoApi, authHeader, ensureAuthorizedResponse, ensureAuthorizedError])

  useEffect(() => {
    ;(async () => {
      setLoadingOptions(true)
      setError(null)
      try {
        const ds = toRfc3339(dateStart)
        const de = toRfc3339(dateEnd, true)

        if (mode === 'regiao') {
          const [{ data: regioesData }, { data: groupedData }] = await Promise.all([
            regiaoApi.privateRegioesGet(authHeader, 1, 300, 'name', 'asc'),
            dashApi.privateDashboardGroupedGet('occurrences', 'regiao', authHeader, ds, de)
          ])
          ensureAuthorizedResponse(regioesData)
          ensureAuthorizedResponse(groupedData)
          const countsMap = new Map<string, number>(
            (((groupedData as any)?.items) ?? []).map((item: any) => [String(item?.regiao_id || item?.key_id || ''), Number(item?.count || item?.value || 0)])
          )
          const nextOptions = (((regioesData as any)?.items) ?? []).map((item: any) => ({
            id: String(item?.id || ''),
            name: String(item?.name || item?.id || '—'),
            count: countsMap.get(String(item?.id || '')) || 0,
          }))
          setOptions(nextOptions)
        } else {
          const [{ data: ascsData }, { data: groupedData }] = await Promise.all([
            ascApi.privateAscsGet(authHeader, 1, 400, 'name', 'asc', undefined, regionScopeId || undefined),
            dashApi.privateDashboardGroupedGet('occurrences', 'asc', authHeader, ds, de, regionScopeId || undefined)
          ])
          ensureAuthorizedResponse(ascsData)
          ensureAuthorizedResponse(groupedData)
          const regiaoNameById = new Map<string, string>((regioes || []).map((item: any) => [String(item?.id || ''), String(item?.name || item?.id || '')]))
          const countsMap = new Map<string, number>(
            (((groupedData as any)?.items) ?? []).map((item: any) => [String(item?.asc_id || item?.key_id || ''), Number(item?.count || item?.value || 0)])
          )
          const nextOptions = (((ascsData as any)?.items) ?? []).map((item: any) => ({
            id: String(item?.id || ''),
            name: String(item?.name || item?.id || '—'),
            subtitle: regiaoNameById.get(String(item?.regiao_id || '')) || 'Sem região',
            regiaoId: String(item?.regiao_id || ''),
            count: countsMap.get(String(item?.id || '')) || 0,
          }))
          setOptions(nextOptions)
        }
      } catch (err: any) {
        try { ensureAuthorizedError(err) } catch {}
        const status = err?.response?.status
        setError(!status ? 'Sem ligação ao servidor.' : 'Falha ao carregar opções analíticas.')
      } finally {
        setLoadingOptions(false)
      }
    })()
  }, [mode, regiaoApi, ascApi, dashApi, authHeader, regionScopeId, dateStart, dateEnd, ensureAuthorizedResponse, ensureAuthorizedError, regioes])

  const selectedOption = options.find((item) => item.id === selectedId)
  const selectedName = selectedOption?.name || 'Nenhuma seleção'

  useEffect(() => {
    if (!selectedId) return

    const timeoutId = window.setTimeout(() => {
      const element = detailsRef.current
      if (!element) return
      const top = window.scrollY + element.getBoundingClientRect().top - 24
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
      if (typeof element.animate === 'function') {
        element.animate(
          [
            { opacity: 0, transform: 'translateY(18px)' },
            { opacity: 1, transform: 'translateY(0)' },
          ],
          { duration: 340, easing: 'cubic-bezier(.2,.8,.2,1)' }
        )
      }
    }, 120)

    return () => window.clearTimeout(timeoutId)
  }, [selectedId])

  useEffect(() => {
    if (!selectedId) {
      setKpis(null)
      setTotals(null)
      setTypeDistribution([])
      setSecondaryDistribution([])
      setLossSeries([])
      setSpendSeries([])
      return
    }

    ;(async () => {
      setLoadingDetails(true)
      setError(null)
      try {
        const ds = toRfc3339(dateStart)
        const de = toRfc3339(dateEnd, true)
        const regiaoId = mode === 'regiao'
          ? selectedId
          : (selectedOption?.regiaoId || regionScopeId || undefined)
        const ascId = mode === 'asc' ? selectedId : undefined
        const secondaryGroupBy = mode === 'regiao' ? 'asc' : 'tipo'
        const [overview, financeTotals, financeSeries, byType, secondary] = await Promise.all([
          dashApi.privateDashboardKpisOverviewGet(authHeader, ds, de, regiaoId, ascId),
          dashApi.privateDashboardFinanceTotalsGet(authHeader, ds, de, regiaoId, ascId),
          dashApi.privateDashboardFinanceTimeseriesGet(authHeader, ds, de, regiaoId, ascId, 'month'),
          dashApi.privateDashboardGroupedGet('infractions', 'tipo', authHeader, ds, de, regiaoId, ascId),
          dashApi.privateDashboardGroupedGet(mode === 'regiao' ? 'occurrences' : 'infractions', secondaryGroupBy, authHeader, ds, de, regiaoId, ascId)
        ])
        ensureAuthorizedResponse(overview.data)
        ensureAuthorizedResponse(financeTotals.data)
        ensureAuthorizedResponse(financeSeries.data)
        ensureAuthorizedResponse(byType.data)
        ensureAuthorizedResponse(secondary.data)

        setKpis(overview.data)
        setTotals(financeTotals.data)
        setLossSeries(((financeSeries.data as any)?.loss) ?? [])
        setSpendSeries(((financeSeries.data as any)?.spend) ?? [])
        setTypeDistribution((((byType.data as any)?.items) ?? []).map((item: any) => ({
          label: String(item?.key_name || item?.tipo_name || item?.key_id || '—'),
          value: Number(item?.count || item?.value || 0)
        })))
        setSecondaryDistribution((((secondary.data as any)?.items) ?? []).map((item: any) => ({
          label: String(item?.asc_name || item?.key_name || item?.tipo_name || item?.key_id || '—'),
          value: Number(item?.count || item?.value || 0)
        })))
      } catch (err: any) {
        try { ensureAuthorizedError(err) } catch {}
        const status = err?.response?.status
        setError(!status ? 'Sem ligação ao servidor.' : 'Falha ao carregar a análise selecionada.')
      } finally {
        setLoadingDetails(false)
      }
    })()
  }, [selectedId, regionScopeId, mode, dateStart, dateEnd, dashApi, authHeader, ensureAuthorizedResponse, ensureAuthorizedError, selectedOption])

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <Card
        title={pageTitle}
        subtitle={pageSubtitle}
        extra={mode === 'asc' ? (
          <div style={{ minWidth: 220 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 12, color: '#7b8494', fontWeight: 700 }}>Filtrar cards por região</span>
              <select
                value={regionScopeId}
                onChange={(e) => updateSearch('', e.target.value)}
              >
                <option value="">Todas as regiões</option>
                {regioes.map((item: any) => (
                  <option key={item?.id} value={item?.id}>{item?.name || item?.id}</option>
                ))}
              </select>
            </label>
          </div>
        ) : (
          <span style={contextChipStyle}>Período: Últimos 12 meses</span>
        )}
      >
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span style={contextChipStyle}>{mode === 'regiao' ? 'Selecione uma região' : 'Selecione uma ASC'}</span>
          {mode === 'asc' && regionScopeId ? (
            <span style={contextChipStyle}>
              Região base: {regioes.find((item: any) => item.id === regionScopeId)?.name || regionScopeId}
            </span>
          ) : null}
        </div>
      </Card>

      {error ? (
        <div style={{ background: '#fff1e8', color: '#8d4a17', padding: 12, borderRadius: 14, border: '1px solid rgba(141, 74, 23, 0.18)' }}>
          {error}
        </div>
      ) : null}

      <Card
        title={mode === 'regiao' ? 'Regiões disponíveis' : 'ASCs disponíveis'}
        subtitle={mode === 'regiao' ? 'Escolha o território a analisar.' : 'Escolha a ASC para abrir os respetivos indicadores.'}
      >
        {loadingOptions ? (
          <div style={{ color: '#7b8494', textAlign: 'center', padding: 24 }}>A carregar cartões de seleção…</div>
        ) : (
          <Grid minColumnWidth={220} gap={14}>
            {options.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setAnimatingCardId(item.id)
                  window.setTimeout(() => setAnimatingCardId((current) => current === item.id ? null : current), 420)
                  updateSearch(item.id, mode === 'asc' ? (item.regiaoId || regionScopeId) : regionScopeId)
                }}
                style={{
                  textAlign: 'left',
                  padding: 18,
                  borderRadius: 20,
                  border: selectedId === item.id ? '1px solid rgba(201, 109, 31, 0.34)' : '1px solid rgba(101, 74, 32, 0.14)',
                  background: selectedId === item.id
                    ? 'linear-gradient(180deg, rgba(255, 244, 230, 0.98) 0%, rgba(248, 231, 205, 0.92) 100%)'
                    : 'linear-gradient(180deg, rgba(255,252,247,.94) 0%, rgba(248,241,230,.88) 100%)',
                  boxShadow: selectedId === item.id
                    ? '0 18px 34px rgba(76, 57, 24, 0.12)'
                    : '0 12px 24px rgba(76, 57, 24, 0.06)',
                  display: 'grid',
                  gap: 10,
                  minHeight: 132,
                  transform: selectedId === item.id ? 'translateY(-4px)' : 'translateY(0)',
                  animation: animatingCardId === item.id ? 'territoryCardPulse 420ms cubic-bezier(.2,.8,.2,1)' : 'none',
                  transition: 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease, background 180ms ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 17, fontWeight: 800, color: '#1f2937', lineHeight: 1.2 }}>{item.name}</div>
                    {item.subtitle ? <div style={{ fontSize: 12, color: '#7b8494', marginTop: 6 }}>{item.subtitle}</div> : null}
                  </div>
                  <span style={countBadgeStyle}>{item.count}</span>
                </div>
                <div style={{ fontSize: 12, color: '#5f6673', fontWeight: 700 }}>
                  {item.count.toLocaleString('pt-PT')} ocorrências no período
                </div>
              </button>
            ))}
          </Grid>
        )}
      </Card>

      {!selectedId ? (
        <Card title="Seleção pendente" subtitle="Escolha um cartão acima para abrir a análise detalhada.">
          <div style={{ padding: '10px 0', color: '#5f6673' }}>
            O detalhe desta vista mostra métricas, distribuição e evolução apenas do território escolhido.
          </div>
        </Card>
      ) : (
        <div ref={detailsRef} style={{ display: 'grid', gap: 16 }}>
          <Grid minColumnWidth={240} gap={16}>
            <Card title="Contexto atual" subtitle={selectedName}>
              <div style={{ display: 'grid', gap: 12 }}>
                <StatPill label="Ocorrências" value={(kpis as any)?.nr_occurrences ?? '—'} tone="teal" />
                <StatPill label="Infrações" value={(kpis as any)?.nr_infractions ?? '—'} tone="danger" />
                <StatPill label="Infractores" value={(kpis as any)?.nr_infractors ?? '—'} tone="amber" />
              </div>
            </Card>

            <Card title="Indicadores financeiros" subtitle="Perdas e gasto operacional da seleção">
              <div style={{ display: 'grid', gap: 12 }}>
                <StatPill label="Perdas" value={formatMoney((kpis as any)?.total_valor_infractions)} tone="danger" />
                <StatPill label="Gastos em ações" value={formatMoney((totals as any)?.actions_spend_total)} tone="teal" />
                <StatPill label="Média por infração" value={formatMoney((kpis as any)?.avg_valor_infraction)} tone="amber" />
              </div>
            </Card>
          </Grid>

          <Grid minColumnWidth={360} gap={16}>
            <Card
              title="Distribuição por tipo de infração"
              subtitle="Leitura rápida das categorias com maior peso."
            >
              {loadingDetails ? <LoadingBlock text="A carregar distribuição…" /> : <DistributionBars data={typeDistribution} />}
            </Card>

            <Card
              title={mode === 'regiao' ? 'Ocorrências por ASC' : 'Categorias de infração em destaque'}
              subtitle={mode === 'regiao' ? 'ASCs mais ativas dentro da região selecionada.' : 'Leitura rápida do mix de infrações na ASC.'}
            >
              {loadingDetails ? <LoadingBlock text="A carregar distribuição secundária…" /> : <DistributionBars data={secondaryDistribution} />}
            </Card>
          </Grid>

          <Card title="Evolução financeira" subtitle="Perdas e gastos ao longo do período analisado.">
            {loadingDetails ? <LoadingBlock text="A carregar série temporal…" /> : <CompactTrendChart loss={lossSeries} spend={spendSeries} />}
          </Card>
        </div>
      )}
    </div>
  )
}

function LoadingBlock({ text }: { text: string }) {
  return <div style={{ color: '#7b8494', textAlign: 'center', padding: 28 }}>{text}</div>
}

function StatPill({ label, value, tone }: { label: string; value: string | number; tone: 'teal' | 'danger' | 'amber' }) {
  const toneMap = {
    teal: { bg: '#e6f4f1', border: '#b8ddd4', color: '#0f766e' },
    danger: { bg: '#fbe9e7', border: '#e9b7b2', color: '#b42318' },
    amber: { bg: '#f9efe2', border: '#e4cfb1', color: '#8d4a17' },
  }[tone]

  return (
    <div style={{ padding: 14, borderRadius: 16, background: toneMap.bg, border: `1px solid ${toneMap.border}` }}>
      <div style={{ fontSize: 12, color: '#7b8494', fontWeight: 700, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: toneMap.color }}>{value}</div>
    </div>
  )
}

function DistributionBars({ data }: { data: Array<{ label: string; value: number }> }) {
  const clean = (data || []).filter((item) => Number.isFinite(item.value) && item.value > 0).slice(0, 8)
  const max = Math.max(1, ...clean.map((item) => item.value))
  const palette = ['#c96d1f', '#0f766e', '#b42318', '#8d4a17', '#5f8a57', '#c2410c', '#7c5a2b', '#6d8b38']

  if (!clean.length) {
    return <div style={{ color: '#7b8494', textAlign: 'center', padding: 20 }}>Sem dados para apresentar.</div>
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {clean.map((item, index) => (
        <div key={`${item.label}-${index}`} style={{ display: 'grid', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' }}>
            <div style={{ color: '#3f4652', fontWeight: 700, fontSize: 14 }}>{item.label}</div>
            <div style={{ color: '#7b8494', fontSize: 12, fontWeight: 700 }}>{item.value.toLocaleString('pt-PT')}</div>
          </div>
          <div style={{ height: 12, background: '#efe4d4', borderRadius: 999, overflow: 'hidden' }}>
            <div
              style={{
                width: `${(item.value / max) * 100}%`,
                height: '100%',
                background: `linear-gradient(90deg, ${palette[index % palette.length]} 0%, rgba(255,255,255,0.88) 140%)`,
                borderRadius: 999,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function CompactTrendChart({ loss = [], spend = [] }: { loss?: Array<{ ts: string; total: number }>; spend?: Array<{ ts: string; total: number }> }) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [width, setWidth] = useState(900)
  const height = 280
  const pad = 34

  useEffect(() => {
    const element = containerRef.current
    if (!element) return
    const observer = new ResizeObserver(() => setWidth(element.clientWidth))
    setWidth(element.clientWidth)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const lossData = (loss || []).map((item) => ({ x: new Date(item.ts).getTime(), y: Number(item.total || 0) })).filter((item) => Number.isFinite(item.x) && Number.isFinite(item.y))
  const spendData = (spend || []).map((item) => ({ x: new Date(item.ts).getTime(), y: Number(item.total || 0) })).filter((item) => Number.isFinite(item.x) && Number.isFinite(item.y))
  const all = [...lossData, ...spendData]

  if (!all.length) {
    return <div style={{ color: '#7b8494', textAlign: 'center', padding: 20 }}>Sem série temporal disponível.</div>
  }

  const minX = Math.min(...all.map((item) => item.x))
  const maxX = Math.max(...all.map((item) => item.x))
  const maxY = Math.max(1, ...all.map((item) => item.y))
  const chartWidth = Math.max(320, width) - pad * 2
  const chartHeight = height - pad * 2
  const sx = (x: number) => pad + ((x - minX) / Math.max(1, maxX - minX)) * chartWidth
  const sy = (y: number) => height - pad - (y / maxY) * chartHeight
  const path = (items: Array<{ x: number; y: number }>) => items.map((item, index) => `${index === 0 ? 'M' : 'L'} ${sx(item.x)} ${sy(item.y)}`).join(' ')

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      <svg width={Math.max(320, width)} height={height} role="img" aria-label="Evolução financeira">
        <defs>
          <linearGradient id="territoryLossGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#b42318" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#b42318" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="territorySpendGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0f766e" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#0f766e" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {Array.from({ length: 5 }).map((_, index) => {
          const y = pad + (chartHeight / 4) * index
          return <line key={index} x1={pad} y1={y} x2={pad + chartWidth} y2={y} stroke="#e8dfd2" strokeDasharray="3,4" />
        })}

        <line x1={pad} y1={height - pad} x2={pad + chartWidth} y2={height - pad} stroke="#cfbfaa" />
        <line x1={pad} y1={pad} x2={pad} y2={height - pad} stroke="#cfbfaa" />

        {lossData.length > 1 ? <path d={`${path(lossData)} L ${sx(lossData[lossData.length - 1].x)} ${height - pad} L ${sx(lossData[0].x)} ${height - pad} Z`} fill="url(#territoryLossGradient)" /> : null}
        {spendData.length > 1 ? <path d={`${path(spendData)} L ${sx(spendData[spendData.length - 1].x)} ${height - pad} L ${sx(spendData[0].x)} ${height - pad} Z`} fill="url(#territorySpendGradient)" /> : null}
        {lossData.length > 1 ? <path d={path(lossData)} fill="none" stroke="#b42318" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /> : null}
        {spendData.length > 1 ? <path d={path(spendData)} fill="none" stroke="#0f766e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /> : null}

        <g transform={`translate(${pad}, 14)`}>
          <rect x={0} y={0} width={170} height={42} rx={12} fill="#fffaf2" stroke="#d9c9b4" />
          <circle cx={18} cy={14} r={5} fill="#b42318" />
          <text x={30} y={18} fontSize={12} fill="#3f4652" fontWeight="700">Perdas</text>
          <circle cx={18} cy={30} r={5} fill="#0f766e" />
          <text x={30} y={34} fontSize={12} fill="#3f4652" fontWeight="700">Gastos</text>
        </g>
      </svg>
    </div>
  )
}

function formatMoney(n?: number) {
  if (typeof n !== 'number' || Number.isNaN(n)) return '—'
  try { return `${n.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT` } catch { return `${n.toFixed(2)} MT` }
}

const contextChipStyle: React.CSSProperties = {
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

const countBadgeStyle: React.CSSProperties = {
  display: 'inline-grid',
  placeItems: 'center',
  minWidth: 42,
  height: 42,
  padding: '0 10px',
  borderRadius: 14,
  background: '#fffaf2',
  border: '1px solid rgba(101, 74, 32, 0.12)',
  color: '#8d4a17',
  fontWeight: 800,
  fontSize: 14,
}

export function RegioesInsightsScreen() {
  return <TerritoryInsightsScreen mode="regiao" />
}

export function AscsInsightsScreen() {
  return <TerritoryInsightsScreen mode="asc" />
}
