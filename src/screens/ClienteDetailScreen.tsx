import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Card } from '../components'
import { useAuth } from '../contexts/AuthContext'
import { InstallationsApi, RegiaoApi, ASCApi, ComprasApi, EquipamentosApi, InstalacaoAccoesApi, type ModelInstallation, type ModelCompras, type ModelEquipamentos, type ModelInstalacaoAccoes } from '../services'

export default function ClienteDetailScreen() {
  const { getApiConfig, getAuthorizationHeaderValue, logout } = useAuth()
  const api = useMemo(() => new InstallationsApi(getApiConfig()), [getApiConfig])
  const regiaoApi = useMemo(() => new RegiaoApi(getApiConfig()), [getApiConfig])
  const ascApi = useMemo(() => new ASCApi(getApiConfig()), [getApiConfig])
  const authHeader = useMemo(() => getAuthorizationHeaderValue(), [getAuthorizationHeaderValue])

  const pf = useMemo(() => {
    const parts = window.location.pathname.split('/').filter(Boolean)
    return parts[1] || ''
  }, [])
  const mes = useMemo(() => new URLSearchParams(window.location.search).get('mes') || '', [])

  const [item, setItem] = useState<ModelInstallation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [regiaoName, setRegiaoName] = useState<string>('')
  const [ascName, setAscName] = useState<string>('')
  const [nearby, setNearby] = useState<ModelInstallation[]>([])
  const [nearbyError, setNearbyError] = useState<string | null>(null)
  const [compras, setCompras] = useState<ModelCompras[]>([])
  const [equipamentos, setEquipamentos] = useState<ModelEquipamentos[]>([])
  const [comprasError, setComprasError] = useState<string | null>(null)
  const [equipError, setEquipError] = useState<string | null>(null)
  const [acoes, setAcoes] = useState<ModelInstalacaoAccoes[]>([])
  const [acoesError, setAcoesError] = useState<string | null>(null)

  const mapRef = useRef<HTMLDivElement | null>(null)
  const gmapRef = useRef<any>(null)
  const mainMarkerRef = useRef<any>(null)
  const nearbyMarkersRef = useRef<any[]>([])
  const infoRef = useRef<any>(null)
  const [mapReady, setMapReady] = useState(false)

  const isUnauthorizedBody = (data: any) => {
    try {
      const raw = data?.code ?? data?.error?.code ?? data?.status ?? data?.error?.status ?? data?.error_code
      if (raw == null) return false
      const num = Number(raw)
      if (!Number.isNaN(num) && num === 401) return true
      const code = String(raw).toUpperCase()
      return code === 'UNAUTHORIZED' || code === 'UNAUTHENTICATED'
    } catch {
      return false
    }
  }

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.privateInstallationsPfGet(pf, mes, authHeader)
      if (isUnauthorizedBody(data)) {
        logout('Sessão expirada. Inicie sessão novamente.')
        return
      }
      setItem(data as any)
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 401 || isUnauthorizedBody(err?.response?.data)) {
        logout('Sessão expirada. Inicie sessão novamente.')
        return
      }
      setError(!status ? 'Sem ligação ao servidor.' : 'Falha a obter cliente.')
    } finally {
      setLoading(false)
    }
  }, [api, authHeader, pf, mes, logout])

  useEffect(() => { if (pf && mes) load() }, [load, pf, mes])

  useEffect(() => {
    ;(async () => {
      if (!item?.regiao_id) {
        setRegiaoName('')
        return
      }
      try {
        const { data } = await regiaoApi.privateRegioesIdGet(item.regiao_id, authHeader)
        setRegiaoName((data as any)?.name || '')
      } catch {
        setRegiaoName('')
      }
    })()
  }, [item?.regiao_id, regiaoApi, authHeader])

  useEffect(() => {
    ;(async () => {
      const ascId = (item as any)?.asc_id
      const inlineAscName = (item as any)?.asc_name
      if (inlineAscName) {
        setAscName(String(inlineAscName))
        return
      }
      if (!ascId) {
        setAscName('')
        return
      }
      try {
        const { data } = await ascApi.privateAscsIdGet(String(ascId), authHeader)
        if (isUnauthorizedBody(data)) {
          logout('Sessão expirada. Inicie sessão novamente.')
          return
        }
        setAscName((data as any)?.name || '')
      } catch {
        setAscName('')
      }
    })()
  }, [(item as any)?.asc_id, (item as any)?.asc_name, ascApi, authHeader, logout])

  const injectScriptOnce = (apiKey: string): Promise<void> => {
    if ((window as any).google && (window as any).google.maps) return Promise.resolve()
    if ((window as any).__gmapsLoadingPromise) return (window as any).__gmapsLoadingPromise
    const src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly&loading=async`
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

  function scoreToPct(score?: number): number | null {
    if (typeof score !== 'number' || Number.isNaN(score)) return null
    return Math.max(0, Math.min(100, score * 100))
  }

  function scoreColor(pct: number): string {
    if (pct >= 80) return '#0f766e'
    if (pct >= 60) return '#15803d'
    if (pct >= 40) return '#a16207'
    if (pct >= 20) return '#c96d1f'
    return '#b42318'
  }

  function buildScoreSvg(pct: number | null, main: boolean): string {
    const size = main ? 38 : 28
    const r = size / 2
    const fill = pct == null ? '#9ca3af' : scoreColor(pct)
    const text = pct == null ? '?' : String(Math.round(pct))
    const fontSize = main ? 12 : 10
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 ${size} ${size}'>
      <circle cx='${r}' cy='${r}' r='${r - 1}' fill='${fill}' stroke='#ffffff' stroke-width='2'/>
      <text x='50%' y='50%' dominant-baseline='central' text-anchor='middle' font-family='Segoe UI, sans-serif' font-size='${fontSize}' font-weight='800' fill='#ffffff'>${text}</text>
    </svg>`
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
  }

  function makeGIcon(g: any, pct: number | null, main: boolean): any {
    const url = buildScoreSvg(pct, main)
    const size = main ? 38 : 28
    return { url, scaledSize: new g.Size(size, size), anchor: new g.Point(size / 2, size / 2) }
  }

  useEffect(() => {
    ;(async () => {
      const lat = Number(item?.lat)
      const lng = Number((item as any)?.long)
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return
      const key = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY
      if (!key) return
      try { await injectScriptOnce(key) } catch { return }
      const g = (window as any).google?.maps
      const center = { lat, lng }
      gmapRef.current = new g.Map(mapRef.current, {
        center,
        zoom: 14,
        mapTypeControl: false,
        fullscreenControl: false,
        streetViewControl: false,
      })
      const mainIcon = makeGIcon(g, scoreToPct(item?.score as any), true)
      if (mainMarkerRef.current) { try { mainMarkerRef.current.setMap(null) } catch {} }
      mainMarkerRef.current = new g.Marker({ position: center, map: gmapRef.current, title: item?.nome || 'Cliente', icon: mainIcon })
      try { infoRef.current = new g.InfoWindow() } catch { infoRef.current = null }
      if (infoRef.current && mainMarkerRef.current) {
        const comprasLabel = formatKwh(item?.compras_6_meses)
        const consumoLabel = formatKwh((item as any)?.equipamentos_6_meses)
        const html = `<div style="max-width:260px">
          <strong>${item?.nome || item?.pf || 'Cliente'}</strong><br/>
          PF: ${item?.pf || '—'}<br/>
          Compras (6m): ${comprasLabel}<br/>
          Consumo calc. (6m): ${consumoLabel}
        </div>`
        mainMarkerRef.current.addListener('click', () => {
          try {
            infoRef.current.setContent(html)
            infoRef.current.open({ anchor: mainMarkerRef.current, map: gmapRef.current })
          } catch {}
        })
      }
      setMapReady(true)
    })()
  }, [item?.lat, (item as any)?.long, item?.nome, item?.pf, item?.compras_6_meses, (item as any)?.equipamentos_6_meses, item?.score])

  useEffect(() => {
    ;(async () => {
      const lat = Number(item?.lat)
      const lng = Number((item as any)?.long)
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        setNearby([])
        return
      }
      try {
        setNearbyError(null)
        const { data } = await api.privateInstallationsGet(
          authHeader,
          1,
          10,
          'mes',
          'desc',
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          lat,
          lng,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined
        )
        const list = (data as any)?.items ?? []
        setNearby(Array.isArray(list) ? list.filter((entry: any) => entry?.pf !== item?.pf || entry?.mes !== item?.mes) : [])
      } catch {
        setNearby([])
        setNearbyError('Falha ao carregar clientes próximos.')
      }
    })()
  }, [item?.lat, (item as any)?.long, item?.pf, item?.mes, api, authHeader])

  useEffect(() => {
    ;(async () => {
      setComprasError(null)
      setEquipError(null)
      setAcoesError(null)

      try {
        const currentPf = item?.pf
        if (currentPf) {
          const comprasApi = new ComprasApi((api as any).configuration)
          const { data } = await comprasApi.privateComprasPfGet(currentPf, authHeader)
          setCompras(((data as any)?.items) ?? [])
        } else {
          setCompras([])
        }
      } catch {
        setComprasError('Falha ao carregar compras.')
        setCompras([])
      }

      try {
        const inspeccaoId = (item as any)?.inspecao_id
        if (inspeccaoId) {
          const equipamentosApi = new EquipamentosApi((api as any).configuration)
          const { data } = await equipamentosApi.privateEquipamentosInspeccaoIdGet(inspeccaoId, authHeader)
          setEquipamentos(((data as any)?.items) ?? [])
        } else {
          setEquipamentos([])
        }
      } catch {
        setEquipError('Falha ao carregar equipamentos.')
        setEquipamentos([])
      }

      try {
        const currentPf = item?.pf
        if (currentPf) {
          const accoesApi = new InstalacaoAccoesApi((api as any).configuration)
          const { data } = await accoesApi.privateInstalacaoAccoesGet(authHeader, -1, undefined, 'created_at', 'desc', currentPf)
          setAcoes(((data as any)?.items) ?? [])
        } else {
          setAcoes([])
        }
      } catch {
        setAcoesError('Falha ao carregar ações deste cliente.')
        setAcoes([])
      }
    })()
  }, [item?.pf, (item as any)?.inspecao_id, api, authHeader])

  useEffect(() => {
    const g = (window as any).google?.maps
    if (!g || !gmapRef.current || !mapReady) return

    nearbyMarkersRef.current.forEach((marker) => { try { marker.setMap(null) } catch {} })
    nearbyMarkersRef.current = []

    const bounds = new g.LatLngBounds()
    const lat = Number(item?.lat)
    const lng = Number((item as any)?.long)
    if (Number.isFinite(lat) && Number.isFinite(lng)) bounds.extend({ lat, lng })

    ;(nearby || [])
      .map((entry) => ({ ...entry, __lat: Number((entry as any).lat), __lng: Number((entry as any).long) }))
      .filter((entry) => Number.isFinite((entry as any).__lat) && Number.isFinite((entry as any).__lng))
      .forEach((entry) => {
        const pos = { lat: (entry as any).__lat, lng: (entry as any).__lng }
        const marker = new g.Marker({
          position: pos,
          map: gmapRef.current,
          title: entry.nome || entry.pf || 'Cliente próximo',
          icon: makeGIcon(g, scoreToPct((entry as any)?.score as any), false),
        })
        if (infoRef.current) {
          const html = `<div style="max-width:260px">
            <strong>${entry.nome || entry.pf || 'Cliente'}</strong><br/>
            PF: ${entry.pf || '—'}<br/>
            Compras (6m): ${formatKwh(entry.compras_6_meses)}<br/>
            Consumo calc. (6m): ${formatKwh((entry as any).equipamentos_6_meses)}
          </div>`
          marker.addListener('click', () => {
            try {
              infoRef.current.setContent(html)
              infoRef.current.open({ anchor: marker, map: gmapRef.current })
            } catch {}
          })
        }
        nearbyMarkersRef.current.push(marker)
        bounds.extend(pos)
      })

    try {
      if (!bounds.isEmpty()) gmapRef.current.fitBounds(bounds)
    } catch {}
  }, [nearby, item?.lat, (item as any)?.long, mapReady])

  const nearbyWithDistance = useMemo(() => {
    if (!item || item.lat == null || (item as any)?.long == null) return nearby.map((entry) => ({ item: entry, distanceMeters: null as number | null }))
    return nearby.map((entry) => {
      if ((entry as any).lat == null || (entry as any).long == null) return { item: entry, distanceMeters: null as number | null }
      return {
        item: entry,
        distanceMeters: haversineMeters(Number(item.lat), Number((item as any).long), Number((entry as any).lat), Number((entry as any).long)),
      }
    }).sort((a, b) => {
      if (a.distanceMeters == null && b.distanceMeters == null) return 0
      if (a.distanceMeters == null) return 1
      if (b.distanceMeters == null) return -1
      return a.distanceMeters - b.distanceMeters
    })
  }, [item, nearby])

  const totalComprasAmount = compras.reduce((sum, entry) => sum + Number((entry as any).trn_amount || 0), 0)
  const totalComprasUnits = compras.reduce((sum, entry) => sum + Number((entry as any).trn_units || 0), 0)
  const totalEquipamentosEstimado = equipamentos.reduce((sum, entry) => sum + Number((entry as any).consumo_estimado || 0), 0)
  const totalValorRecuperado = acoes.reduce((sum, entry) => sum + Number((entry as any).valor_recuperado || 0), 0)
  const nearestClientDistance = nearbyWithDistance[0]?.distanceMeters ?? null
  const comprasChartData = useMemo(
    () => buildComprasChartData(compras, acoes),
    [compras, acoes]
  )
  const purchaseSummaryTone = getPurchaseSummaryTone(item?.tendencia_compras)

  function voltar() {
    if (window.location.pathname !== '/instalacoes') window.history.pushState({}, '', '/instalacoes')
    window.dispatchEvent(new Event('locationchange'))
  }

  function adicionarAcao() {
    const params = new URLSearchParams()
    params.set('pf', pf)
    params.set('novo', '1')
    window.history.pushState({}, '', `/instalacoes/accoes?${params.toString()}`)
    window.dispatchEvent(new Event('locationchange'))
  }

  function gerirAcoes() {
    const params = new URLSearchParams()
    if (item?.pf) params.set('pf', item.pf)
    window.history.pushState({}, '', `/instalacoes/accoes?${params.toString()}`)
    window.dispatchEvent(new Event('locationchange'))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={screenHeroStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={screenEyebrowStyle}>Cliente em análise</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <h2 style={{ margin: 0, fontSize: 30, lineHeight: 1.05, color: '#1f2937' }}>{item?.nome || item?.pf || 'Cliente'}</h2>
            <p style={{ margin: 0, color: '#5f6673', lineHeight: 1.6 }}>
              Consulte o perfil energético, o enquadramento territorial, o histórico de ações e o contexto geográfico do cliente selecionado.
            </p>
          </div>
        </div>
        <div style={screenActionRowStyle}>
          <button type="button" onClick={voltar} style={detailSecondaryActionStyle}>
            <IconBack />
            <span>Voltar</span>
          </button>
          <button type="button" onClick={adicionarAcao} style={detailPrimaryActionStyle}>
            <IconPlus />
            <span>Adicionar ação</span>
          </button>
        </div>
      </div>

      {!pf || !mes ? <div style={infoBannerStyle}>Parâmetros inválidos. Falta PF ou mês.</div> : null}
      {loading ? <div style={infoBannerStyle}>A carregar…</div> : null}
      {error ? <div style={errorBannerStyle}>{error}</div> : null}

      {!loading && !error && item ? (
        <>
          <Card title="Dados gerais">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={detailOverviewStyle}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0, flex: 1 }}>
                  <div style={detailOverviewEyebrowStyle}>Cliente</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <strong style={{ fontSize: 28, lineHeight: 1.05, color: '#1f2937' }}>{item.nome || item.pf || 'Cliente sem nome'}</strong>
                    <span style={{ color: '#5f6673', lineHeight: 1.6 }}>
                      PF {item.pf || '-'} · {item.pt_name || item.pt_id || 'PT indisponível'} · {ascName || (item as any).asc_name || (item as any).asc_id || 'ASC indisponível'}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <StatusPill icon={<IconMonth />} label="Mês" value={formatMonth(item.mes)} />
                  <StatusPill icon={<IconTrend />} label="Tendência" value={formatTendencia(item.tendencia_compras)} tone={getTrendTone(item.tendencia_compras)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14 }}>
                <SummaryMetricCard label="Compras (6m)" value={formatKwh(item.compras_6_meses)} accent="#0f766e" />
                <SummaryMetricCard label="Consumo calc. (6m)" value={formatKwh((item as any).equipamentos_6_meses)} accent="#3056a6" />
                <SummaryMetricCard label="Score" value={formatPercent(item.score)} accent={scoreColor(scoreToPct(item.score) ?? 0)} />
                <SummaryMetricCard label="Valor recuperado" value={formatMoney(totalValorRecuperado)} accent="#8d4a17" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.15fr .95fr .95fr', gap: 14 }}>
                <DetailSectionCard
                  icon={<IconUser />}
                  title="Identificação"
                  description="Contexto base do cliente e da sua referência operacional."
                  items={[
                    { label: 'Nome', value: item.nome || '-' },
                    { label: 'PF', value: item.pf || '-' },
                    { label: 'Mês de análise', value: formatMonth(item.mes) },
                  ]}
                />
                <DetailSectionCard
                  icon={<IconLocation />}
                  title="Enquadramento"
                  description="Território e estrutura comercial associada ao cliente."
                  items={[
                    { label: 'ASC', value: ascName || (item as any).asc_name || (item as any).asc_id || '-' },
                    { label: 'Região', value: regiaoName || item.regiao_id || '-' },
                    { label: 'PT', value: item.pt_name || item.pt_id || '-' },
                  ]}
                />
                <DetailSectionCard
                  icon={<IconPin />}
                  title="Georreferenciação"
                  description="Ponto usado para o mapa e para o contexto de proximidade."
                  items={[
                    { label: 'Latitude', value: item.lat != null ? String(item.lat) : '-' },
                    { label: 'Longitude', value: (item as any).long != null ? String((item as any).long) : '-' },
                    { label: 'Ação corrente', value: (item as any).has_current_accao ? 'Sim' : 'Não' },
                  ]}
                />
              </div>
            </div>
          </Card>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(360px, 1.35fr) minmax(300px, 1fr)', gap: 16, alignItems: 'stretch' }}>
            <Card title="Localização" subtitle="Posição geográfica do cliente e clientes próximos no mapa." style={pairedDetailCardStyle}>
              {item.lat != null && (item as any).long != null ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span style={mapInfoChipStyle}>Ponto base: cliente</span>
                    <span style={mapInfoChipStyle}>Clientes próximos: {nearbyWithDistance.length}</span>
                  </div>
                  <div ref={mapRef} style={mapContainerStyle} />
                </div>
              ) : (
                <div style={infoBannerStyle}>Sem coordenadas registadas para este cliente.</div>
              )}
            </Card>

            <Card title="Clientes próximos" subtitle="Registos encontrados junto ao cliente analisado." style={pairedDetailCardStyle}>
              <div style={nearbyPanelStyle}>
                {nearbyError ? <div style={infoBannerStyle}>{nearbyError}</div> : null}
                {!nearbyWithDistance.length ? (
                  <div style={infoBannerStyle}>Sem clientes próximos.</div>
                ) : (
                  <>
                    <div style={nearbyListStyle}>
                      {nearbyWithDistance.map(({ item: currentItem, distanceMeters }) => (
                        <div key={`${currentItem.pf}-${currentItem.mes}`} style={contextCardStyle}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                            <span style={contextCardIconStyle}><IconUser /></span>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                              <strong style={{ color: '#1f2937' }}>{currentItem.nome || currentItem.pf || 'Cliente'}</strong>
                              <span style={{ color: '#5f6673', fontSize: 13 }}>{(currentItem as any).asc_name || currentItem.pt_name || 'Contexto indisponível'}</span>
                              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                                <span style={{ color: '#8d4a17', fontSize: 12, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase' }}>
                                  {formatDistance(distanceMeters)}
                                </span>
                                <span style={scoreRangeBadgeStyle(currentItem.score)}>
                                  Score: {formatPercent(currentItem.score)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={nearbySummaryStyle}>
                      <span style={mapLegendChipStyle}>Total: {nearbyWithDistance.length}</span>
                      <span style={mapLegendChipStyle}>Mais próximo: {formatDistance(nearbyWithDistance[0]?.distanceMeters ?? null)}</span>
                    </div>
                  </>
                )}
              </div>
            </Card>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 0.78fr) minmax(420px, 1.22fr)', gap: 16, alignItems: 'stretch' }}>
            <Card title="Resumo de compras" subtitle="Leitura do comportamento comercial do cliente nos últimos 6 meses." style={energyCardStyle}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
                <div style={{ ...energyHeroStyle, borderColor: purchaseSummaryTone.border, background: purchaseSummaryTone.background }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
                    <span style={{ ...detailOverviewEyebrowStyle, color: purchaseSummaryTone.accent }}>Comportamento</span>
                    <strong style={{ fontSize: 19, lineHeight: 1.1, color: '#1f2937' }}>
                      {describePurchaseTrendTitle(item.tendencia_compras)}
                    </strong>
                    <span style={{ color: '#5f6673', lineHeight: 1.6 }}>
                      {describePurchaseTrendBody(item.tendencia_compras)}
                    </span>
                  </div>
                  <span style={{ ...energySignalBadgeStyle, background: purchaseSummaryTone.badgeBackground, borderColor: purchaseSummaryTone.border, color: purchaseSummaryTone.accent }}>
                    {formatTendencia(item.tendencia_compras)}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
                  <SummaryMetricCard label="Compras (6m)" value={formatKwh(item.compras_6_meses)} accent="#0f766e" />
                  <SummaryMetricCard
                    label="Média por compra"
                    value={compras.length > 0 ? formatKwh(totalComprasUnits / compras.length) : '0 kWh'}
                    accent="#7c3aed"
                  />
                </div>
              </div>
            </Card>

            <Card title="Histórico de ações" subtitle="Registos de ação já associados a este cliente.">
              {acoesError ? <div style={infoBannerStyle}>{acoesError}</div> : null}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span style={mapLegendChipStyle}>Total: {acoes.length}</span>
                  <span style={mapLegendChipStyle}>Valor recuperado: {formatMoney(totalValorRecuperado)}</span>
                </div>
                <button type="button" onClick={gerirAcoes} style={detailSecondaryActionStyle}>
                  <IconList />
                  <span>Gerir ações</span>
                </button>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={tableHeaderCellStyle}>Criado em</th>
                      <th style={tableHeaderCellStyle}>Execução</th>
                      <th style={tableHeaderCellStyle}>Tipo</th>
                      <th style={tableHeaderCellStyle}>Marcação</th>
                      <th style={tableHeaderCellStyle}>Análise</th>
                      <th style={tableHeaderCellStyle}>Valor recuperado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {acoes.length === 0 ? (
                      <tr><td colSpan={6} style={emptyTableCellStyle}>Sem ações registadas para este cliente.</td></tr>
                    ) : acoes.map((acao, index) => (
                      <tr key={`acao-${acao.id ?? 'sem-id'}-${acao.created_at ?? 'sem-data'}-${index}`}>
                        <td style={tableCellStyle}><span style={emphasisTextStyle}>{formatDate(acao.created_at)}</span></td>
                        <td style={tableCellStyle}>{formatDate(acao.data_execucao)}</td>
                        <td style={tableCellStyle}><span style={emphasisTextStyle}>{(acao as any).accao_tipo?.nome || (acao as any).accao_tipo_id || '-'}</span></td>
                        <td style={tableCellStyle}><span style={statusToneBadgeStyle('marcacao', acao.marcacao_status)}>{acao.marcacao_status || '-'}</span></td>
                        <td style={tableCellStyle}><span style={statusToneBadgeStyle('analise', acao.analise_status)}>{acao.analise_status || '-'}</span></td>
                        <td style={tableCellStyle}><span style={valueBadgeStyle}>{formatMoney(acao.valor_recuperado)}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          <Card title="Compras VS ações" subtitle="Histórico mensal de compras com marcações verticais para meses onde existiram ações.">
            <ComprasBarChart data={comprasChartData} />
          </Card>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'stretch' }}>
            <Card title="Equipamentos" subtitle="Inventário e estimativa de consumo por inspeção." style={pairedDetailCardStyle}>
              {equipError ? <div style={infoBannerStyle}>{equipError}</div> : null}
              <div style={tablePanelStyle}>
                <div style={cardContextStripStyle}>
                  <span style={mapLegendChipStyle}>Equipamentos: {equipamentos.length}</span>
                  <span style={mapLegendChipStyle}>Consumo estimado: {formatKwh(totalEquipamentosEstimado)}</span>
                </div>
                <div style={tableScrollWrapStyle}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={tableHeaderCellStyle}>Equipamento</th>
                      <th style={tableHeaderCellStyle}>Qtd</th>
                      <th style={tableHeaderCellStyle}>Potência</th>
                      <th style={tableHeaderCellStyle}>Horas/dia</th>
                      <th style={tableHeaderCellStyle}>Dias/mês</th>
                      <th style={tableHeaderCellStyle}>Consumo estimado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {equipamentos.length === 0 ? (
                      <tr><td colSpan={6} style={emptyTableCellStyle}>Sem equipamentos registados.</td></tr>
                    ) : equipamentos.map((equipamento, index) => (
                      <tr key={`equip-${equipamento.id ?? 'sem-id'}-${equipamento.nome ?? 'sem-nome'}-${index}`}>
                        <td style={tableCellStyle}><span style={emphasisTextStyle}>{equipamento.nome || '-'}</span></td>
                        <td style={tableCellStyle}>{fmtInt(equipamento.quantidade)}</td>
                        <td style={tableCellStyle}><span style={secondaryEmphasisTextStyle}>{fmtNum(equipamento.potencia)}</span></td>
                        <td style={tableCellStyle}>{fmtNum(equipamento.horas)}</td>
                        <td style={tableCellStyle}>{fmtInt(equipamento.dias)}</td>
                        <td style={tableCellStyle}><span style={consumptionBadgeStyle}>{formatKwh(equipamento.consumo_estimado)}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            </Card>

            <Card title="Compras" subtitle="Histórico comercial do PF usado no enquadramento do cliente." style={pairedDetailCardStyle}>
              {comprasError ? <div style={infoBannerStyle}>{comprasError}</div> : null}
              <div style={tablePanelStyle}>
                <div style={cardContextStripStyle}>
                  <span style={mapLegendChipStyle}>Compras: {compras.length}</span>
                  <span style={mapLegendChipStyle}>Total em energia: {formatKwh(totalComprasUnits)}</span>
                  <span style={mapLegendChipStyle}>Total em valor: {formatMoney(totalComprasAmount)}</span>
                </div>
                <div style={tableScrollWrapStyle}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={tableHeaderCellStyle}>Período</th>
                      <th style={tableHeaderCellStyle}>Unidades</th>
                      <th style={tableHeaderCellStyle}>Valor</th>
                      <th style={tableHeaderCellStyle}>Nº compras</th>
                    </tr>
                  </thead>
                  <tbody>
                    {compras.length === 0 ? (
                      <tr><td colSpan={4} style={emptyTableCellStyle}>Sem compras registadas.</td></tr>
                    ) : compras.map((compra, index) => (
                      <tr key={`compra-${compra.id ?? 'sem-id'}-${compra.periodo ?? 'sem-periodo'}-${index}`}>
                        <td style={tableCellStyle}><span style={emphasisTextStyle}>{compra.periodo || '-'}</span></td>
                        <td style={tableCellStyle}><span style={consumptionBadgeStyle}>{formatKwh(compra.trn_units)}</span></td>
                        <td style={tableCellStyle}>{formatMoney(compra.trn_amount)}</td>
                        <td style={tableCellStyle}><span style={secondaryEmphasisTextStyle}>{fmtInt(compra.no_compras)}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  )
}

function DetailSectionCard({
  icon,
  title,
  description,
  items,
}: {
  icon: React.ReactNode
  title: string
  description: string
  items: Array<{ label: string; value: string }>
}) {
  return (
    <div style={detailSectionCardStyle}>
      <div style={detailSectionHeaderStyle}>
        <span style={detailSectionIconStyle}>{icon}</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <strong style={{ color: '#1f2937', fontSize: 16 }}>{title}</strong>
          <span style={{ color: '#5f6673', fontSize: 13, lineHeight: 1.5 }}>{description}</span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map((currentItem) => (
          <div key={currentItem.label} style={detailSectionItemStyle}>
            <span style={detailSectionItemLabelStyle}>{currentItem.label}</span>
            <strong style={detailSectionItemValueStyle}>{currentItem.value || '-'}</strong>
          </div>
        ))}
      </div>
    </div>
  )
}

function SummaryMetricCard({ label, value, accent, highlight = false }: { label: string; value: string; accent: string; highlight?: boolean }) {
  return (
    <div
      style={{
        padding: '16px 18px',
        borderRadius: 18,
        background: highlight ? hexToRgba(accent, 0.08) : '#fffdf8',
        border: `1px solid ${hexToRgba(accent, highlight ? 0.22 : 0.14)}`,
        boxShadow: highlight ? `0 16px 30px ${hexToRgba(accent, 0.14)}` : '0 12px 24px rgba(76, 57, 24, 0.06)',
      }}
    >
      <div style={{ fontSize: 12, color: accent, marginBottom: 8, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 24, lineHeight: 1.1, fontWeight: 800, color: '#1f2937' }}>{value || '0'}</div>
    </div>
  )
}

function StatusPill({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone?: { background: string; border: string; accent: string } }) {
  return (
    <span style={{ ...statusPillStyle, background: tone?.background || statusPillStyle.background, borderColor: tone?.border || 'rgba(101, 74, 32, 0.12)' }}>
      <span style={{ ...statusPillIconStyle, background: tone ? hexToRgba(tone.accent, 0.12) : statusPillIconStyle.background, color: tone?.accent || '#8d4a17' }}>{icon}</span>
      <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={statusPillLabelStyle}>{label}</span>
        <span style={{ ...statusPillValueStyle, color: tone?.accent || '#1f2937' }}>{value || '-'}</span>
      </span>
    </span>
  )
}

function ComprasBarChart({
  data,
}: {
  data: Array<{ key: string; label: string; units: number; amount: number; actionCount: number; actionEvents: Array<{ label: string; date: string; day: number | null }> }>
}) {
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const [width, setWidth] = React.useState(960)

  React.useEffect(() => {
    const element = containerRef.current
    if (!element) return
    const observer = new ResizeObserver(() => setWidth(element.clientWidth))
    setWidth(element.clientWidth)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  if (!data.length) {
    return <div style={infoBannerStyle}>Sem histórico suficiente para desenhar o gráfico de compras.</div>
  }

  const W = Math.max(760, width)
  const H = 420
  const padTop = 52
  const padBottom = 46
  const padX = 20
  const chartWidth = W - padX * 2
  const chartHeight = H - padTop - padBottom
  const maxValue = Math.max(1, ...data.map((item) => item.units))
  const slotWidth = chartWidth / Math.max(data.length, 1)
  const barWidth = Math.min(42, Math.max(22, slotWidth * 0.54))
  const xAt = (index: number) => padX + index * slotWidth + slotWidth / 2

  return (
    <div ref={containerRef} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <svg width={W} height={H} style={{ width: '100%', height: H }}>
        {[0, 0.25, 0.5, 0.75, 1].map((factor) => {
          const y = padTop + factor * chartHeight
          const value = Math.round((1 - factor) * maxValue)
          return (
            <g key={factor}>
              <line x1={padX} y1={y} x2={W - padX} y2={y} stroke="rgba(148, 163, 184, 0.18)" strokeDasharray="4,6" />
              <text x={W - padX} y={y - 6} fontSize={11} fill="#64748b" textAnchor="end">
                {value.toLocaleString('pt-PT')} kWh
              </text>
            </g>
          )
        })}

        {data.map((entry, index) => {
          const x = xAt(index)
          const barHeight = (entry.units / maxValue) * chartHeight
          const y = H - padBottom - barHeight
          return (
            <g key={entry.key}>
              {entry.actionEvents.map((event, eventIndex) => {
                const markerX = resolveActionMarkerX({
                  monthKey: entry.key,
                  day: event.day,
                  slotCenterX: x,
                  slotWidth,
                  barWidth,
                  chartLeft: padX,
                  chartRight: W - padX,
                })
                const actionLabel = truncateText(event.label, 18)
                const dateLabel = formatActionDate(event.date)
                const labelWidth = Math.min(188, Math.max(124, Math.max(actionLabel.length * 6.8 + 28, dateLabel.length * 6.2 + 24)))
                const labelX = Math.max(8, Math.min(markerX - labelWidth / 2, W - labelWidth - 8))
                const labelY = 10 + eventIndex * 40
                return (
                  <g key={`${entry.key}-${event.date}-${eventIndex}`}>
                    <line
                      x1={markerX}
                      y1={labelY + 28}
                      x2={markerX}
                      y2={H - padBottom + 6}
                      stroke="#c96d1f"
                      strokeWidth="3"
                      strokeDasharray="7,6"
                    />
                    <circle cx={markerX} cy={Math.max(padTop + 12, y - 8)} r="5.5" fill="#c96d1f" stroke="#fffdf8" strokeWidth="3" />
                    <rect
                      x={labelX}
                      y={labelY}
                      width={labelWidth}
                      height="34"
                      rx="16"
                      fill="#fff7ec"
                      stroke="rgba(201, 109, 31, 0.22)"
                    />
                    <rect
                      x={labelX + 10}
                      y={labelY + 10}
                      width="8"
                      height="8"
                      rx="4"
                      fill="#c96d1f"
                    />
                    <text x={labelX + 24} y={labelY + 14} fontSize={11} fill="#8d4a17" textAnchor="start" fontWeight="800">
                      {actionLabel}
                    </text>
                    <text x={labelX + 24} y={labelY + 27} fontSize={10} fill="#9a6b34" textAnchor="start" fontWeight="700">
                      {dateLabel}
                    </text>
                  </g>
                )
              })}

              <rect
                x={x - barWidth / 2}
                y={y}
                width={barWidth}
                height={barHeight}
                rx="12"
                fill="#0f766e"
                stroke="rgba(15, 118, 110, 0.24)"
              />
              <text x={x} y={H - 16} fontSize={11} fill="#64748b" textAnchor="middle">
                {entry.label}
              </text>
            </g>
          )
        })}
      </svg>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <span style={mapLegendChipStyle}>Barras: compras em kWh</span>
        <span style={mapLegendChipStyle}>Linhas vermelhas: ações executadas</span>
        <span style={mapLegendChipStyle}>Pico: {formatKwh(Math.max(...data.map((entry) => entry.units)))}</span>
      </div>
    </div>
  )
}

function formatKwh(n?: number) {
  if (typeof n !== 'number' || Number.isNaN(n)) return '0 kWh'
  try { return `${n.toLocaleString('pt-PT')} kWh` } catch { return `${n} kWh` }
}

function formatPercent(n?: number) {
  if (typeof n !== 'number' || Number.isNaN(n)) return '0%'
  const value = n * 100
  try { return `${value.toLocaleString('pt-PT', { maximumFractionDigits: 1 })}%` } catch { return `${value.toFixed(1)}%` }
}

function formatMoney(n?: number) {
  if (typeof n !== 'number' || Number.isNaN(n)) return '0,00 MT'
  try { return `${n.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT` } catch { return `${n.toFixed(2)} MT` }
}

function formatDate(iso?: string) {
  if (!iso) return '-'
  try {
    const d = new Date(iso as any)
    if (Number.isNaN(d.getTime())) return '-'
    return d.toLocaleDateString('pt-PT')
  } catch {
    return '-'
  }
}

function fmtInt(n?: number) {
  return typeof n === 'number' && Number.isFinite(n) ? String(Math.round(n)) : '0'
}

function fmtNum(n?: number) {
  return typeof n === 'number' && Number.isFinite(n) ? String(n) : '0'
}

function formatMonth(iso?: string) {
  if (!iso) return '-'
  try {
    const d = new Date(iso as any)
    if (Number.isNaN(d.getTime())) return '-'
    return d.toLocaleDateString('pt-PT', { year: 'numeric', month: '2-digit' })
  } catch {
    return '-'
  }
}

function formatTendencia(t?: any) {
  const value = String(t || '')
  switch (value) {
    case 'CRESCENTE': return 'Crescente'
    case 'MUITO_CRESCENTE': return 'Muito crescente'
    case 'NORMAL': return 'Normal'
    case 'DECRESCENTE': return 'Decrescente'
    case 'MUITO_DECRESCENTE': return 'Muito decrescente'
    case 'SEM_COMPRAS': return 'Sem compras'
    default: return 'Sem classificação'
  }
}

function formatDistance(distanceMeters: number | null) {
  if (distanceMeters == null || Number.isNaN(distanceMeters)) return 'Distância indisponível'
  if (distanceMeters < 1000) return `${Math.round(distanceMeters)} m`
  return `${(distanceMeters / 1000).toFixed(2).replace('.', ',')} km`
}

function getTrendTone(trend?: any) {
  const raw = String(trend || '')
  if (raw === 'SEM_COMPRAS') return { background: '#fff7f6', border: 'rgba(180, 35, 24, 0.16)', accent: '#b42318' }
  if (raw === 'MUITO_DECRESCENTE') return { background: '#fff4e8', border: 'rgba(201, 109, 31, 0.16)', accent: '#c96d1f' }
  if (raw === 'DECRESCENTE') return { background: '#fff9e8', border: 'rgba(202, 138, 4, 0.18)', accent: '#a16207' }
  if (raw === 'MUITO_CRESCENTE') return { background: '#f2fcfa', border: 'rgba(15, 118, 110, 0.16)', accent: '#0f766e' }
  if (raw === 'CRESCENTE') return { background: '#f0fdf4', border: 'rgba(34, 197, 94, 0.18)', accent: '#15803d' }
  return { background: '#eff6ff', border: 'rgba(48, 86, 166, 0.14)', accent: '#3056a6' }
}

function scoreRangeBadgeStyle(score?: number): React.CSSProperties {
  const pct = typeof score === 'number' && Number.isFinite(score) ? score * 100 : null
  const color = pct == null ? '#5f6673' : pct >= 80 ? '#0f766e' : pct >= 60 ? '#15803d' : pct >= 40 ? '#a16207' : pct >= 20 ? '#c96d1f' : '#b42318'
  return {
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: 28,
    padding: '0 10px',
    borderRadius: 999,
    background: hexToRgba(color, 0.10),
    border: `1px solid ${hexToRgba(color, 0.18)}`,
    color,
    fontSize: 12,
    fontWeight: 800,
  }
}

function statusToneBadgeStyle(kind: 'marcacao' | 'analise', value?: string): React.CSSProperties {
  const raw = String(value || '').toLowerCase()
  if (raw.includes('concl') || raw.includes('aprov') || raw.includes('execut')) {
    return solidPillStyle('#f2fcfa', '#0f766e', 'rgba(15, 118, 110, 0.16)')
  }
  if (raw.includes('pend') || raw.includes('curso') || raw.includes('agend')) {
    return solidPillStyle('#fff9e8', '#a16207', 'rgba(202, 138, 4, 0.18)')
  }
  if (raw.includes('cancel') || raw.includes('rejeit') || raw.includes('falh')) {
    return solidPillStyle('#fff7f6', '#b42318', 'rgba(180, 35, 24, 0.16)')
  }
  return kind === 'marcacao'
    ? solidPillStyle('#eff6ff', '#3056a6', 'rgba(48, 86, 166, 0.14)')
    : solidPillStyle('#f5f1ea', '#5f6673', 'rgba(101, 74, 32, 0.12)')
}

function solidPillStyle(background: string, color: string, borderColor: string): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: 28,
    padding: '0 10px',
    borderRadius: 999,
    background,
    border: `1px solid ${borderColor}`,
    color,
    fontSize: 12,
    fontWeight: 800,
    whiteSpace: 'nowrap',
  }
}

function getPurchaseSummaryTone(trend?: any) {
  const raw = String(trend || '')
  if (raw === 'SEM_COMPRAS') return { background: '#fff7f6', badgeBackground: '#fff7f6', border: 'rgba(180, 35, 24, 0.18)', accent: '#b42318' }
  if (raw === 'MUITO_DECRESCENTE') return { background: '#fff4e8', badgeBackground: '#fff4e8', border: 'rgba(201, 109, 31, 0.18)', accent: '#c96d1f' }
  if (raw === 'DECRESCENTE') return { background: '#fff9e8', badgeBackground: '#fff9e8', border: 'rgba(202, 138, 4, 0.18)', accent: '#a16207' }
  if (raw === 'MUITO_CRESCENTE') return { background: '#f2fcfa', badgeBackground: '#f2fcfa', border: 'rgba(15, 118, 110, 0.18)', accent: '#0f766e' }
  if (raw === 'CRESCENTE') return { background: '#f0fdf4', badgeBackground: '#f0fdf4', border: 'rgba(34, 197, 94, 0.18)', accent: '#15803d' }
  return { background: '#eff6ff', badgeBackground: '#eff6ff', border: 'rgba(48, 86, 166, 0.18)', accent: '#3056a6' }
}

function describePurchaseTrendTitle(trend?: any) {
  const raw = String(trend || '')
  if (raw === 'SEM_COMPRAS') return 'Sem compras recentes'
  if (raw === 'MUITO_DECRESCENTE') return 'Queda forte no comportamento de compras'
  if (raw === 'DECRESCENTE') return 'Queda gradual no comportamento de compras'
  if (raw === 'MUITO_CRESCENTE') return 'Aumento forte no comportamento de compras'
  if (raw === 'CRESCENTE') return 'Aumento gradual no comportamento de compras'
  return 'Comportamento de compras estável'
}

function describePurchaseTrendBody(trend?: any) {
  const raw = String(trend || '')
  if (raw === 'SEM_COMPRAS') return 'O backend classificou este cliente sem compras no período analisado, o que merece atenção imediata e leitura conjunta com o histórico de ações.'
  if (raw === 'MUITO_DECRESCENTE') return 'As compras dos últimos meses mostram uma quebra acentuada face ao comportamento recente do cliente.'
  if (raw === 'DECRESCENTE') return 'As compras vêm a reduzir ao longo dos últimos meses, sugerindo arrefecimento do consumo comercial.'
  if (raw === 'MUITO_CRESCENTE') return 'O cliente apresenta aumento forte de compras nos últimos meses, o que aponta para intensificação do consumo registado.'
  if (raw === 'CRESCENTE') return 'Há sinais de crescimento nas compras ao longo do período recente, com trajetória positiva.'
  return 'O comportamento de compras está relativamente estável no horizonte de 6 meses disponibilizado pelo backend.'
}

function buildComprasChartData(
  compras: ModelCompras[],
  acoes: ModelInstalacaoAccoes[]
): Array<{ key: string; label: string; units: number; amount: number; actionCount: number; actionEvents: Array<{ label: string; date: string; day: number | null }> }> {
  const purchasesByMonth = new Map<string, { units: number; amount: number }>()
  const actionCountByMonth = new Map<string, number>()
  const actionEventsByMonth = new Map<string, Array<{ label: string; date: string; day: number | null }>>()
  const timelineKeys = new Set<string>()

  compras.forEach((compra, index) => {
    const key = normalizeMonthKey(compra.periodo) || `compra-${index}`
    timelineKeys.add(key)
    const current = purchasesByMonth.get(key) || { units: 0, amount: 0 }
    current.units += Number((compra as any).trn_units || 0)
    current.amount += Number((compra as any).trn_amount || 0)
    purchasesByMonth.set(key, current)
  })

  acoes.forEach((acao) => {
    const actionDate = String((acao as any).data_execucao || acao.created_at || '')
    const key = normalizeMonthKey(actionDate)
    if (!key) return
    timelineKeys.add(key)
    actionCountByMonth.set(key, (actionCountByMonth.get(key) || 0) + 1)
    const nextEvents = actionEventsByMonth.get(key) || []
    nextEvents.push({
      label: String((acao as any).accao_tipo?.nome || (acao as any).accao_tipo_id || 'Ação'),
      date: actionDate,
      day: extractDayOfMonth(actionDate),
    })
    actionEventsByMonth.set(key, nextEvents)
  })

  return [...timelineKeys]
    .sort((a, b) => a.localeCompare(b))
    .map((key) => {
      const purchase = purchasesByMonth.get(key) || { units: 0, amount: 0 }
      return {
        key,
        label: shortMonthLabel(key),
        units: purchase.units,
        amount: purchase.amount,
        actionCount: actionCountByMonth.get(key) || 0,
        actionEvents: actionEventsByMonth.get(key) || [],
      }
    })
}

function resolveActionMarkerX({
  monthKey,
  day,
  slotCenterX,
  slotWidth,
  barWidth,
  chartLeft,
  chartRight,
}: {
  monthKey: string
  day: number | null
  slotCenterX: number
  slotWidth: number
  barWidth: number
  chartLeft: number
  chartRight: number
}) {
  const match = monthKey.match(/^(\d{4})-(\d{2})$/)
  const daysInMonth = match ? new Date(Number(match[1]), Number(match[2]), 0).getDate() : 31
  const safeDay = Math.min(Math.max(day || 15, 1), daysInMonth)
  const slotStart = slotCenterX - slotWidth / 2
  const offset = (safeDay / daysInMonth) * slotWidth
  const x = slotStart + offset
  return Math.max(chartLeft + 8, Math.min(x, chartRight - 8))
}

function extractDayOfMonth(value?: string) {
  if (!value) return null
  const date = new Date(value)
  if (!Number.isNaN(date.getTime())) return date.getDate()
  const raw = String(value).trim()
  const isoDay = raw.match(/^\d{4}-\d{2}-(\d{2})/)
  if (isoDay) return Number(isoDay[1])
  const ptDay = raw.match(/^(\d{2})\/\d{2}\/\d{4}$/)
  if (ptDay) return Number(ptDay[1])
  return null
}

function formatActionDate(value?: string) {
  if (!value) return 'Data indisponível'
  try {
    const date = new Date(value)
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' })
    }
  } catch {}
  return value
}

function truncateText(value: string, limit: number) {
  if (value.length <= limit) return value
  return `${value.slice(0, Math.max(0, limit - 1))}…`
}

function normalizeMonthKey(value?: string) {
  if (!value) return ''
  const raw = String(value).trim()
  const isoMonth = raw.match(/^(\d{4})-(\d{2})/)
  if (isoMonth) return `${isoMonth[1]}-${isoMonth[2]}`
  const ptMonth = raw.match(/^(\d{2})\/(\d{4})$/)
  if (ptMonth) return `${ptMonth[2]}-${ptMonth[1]}`
  const date = new Date(raw)
  if (!Number.isNaN(date.getTime())) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  }
  return raw
}

function shortMonthLabel(value?: string) {
  const key = normalizeMonthKey(value)
  const match = key.match(/^(\d{4})-(\d{2})$/)
  if (!match) return value || '-'
  const date = new Date(Number(match[1]), Number(match[2]) - 1, 1)
  try {
    return date.toLocaleDateString('pt-PT', { month: 'short', year: '2-digit' }).replace('.', '')
  } catch {
    return key
  }
}

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace('#', '')
  const safe = normalized.length === 3
    ? normalized.split('').map((char) => char + char).join('')
    : normalized
  const value = parseInt(safe, 16)
  const r = (value >> 16) & 255
  const g = (value >> 8) & 255
  const b = value & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (v: number) => (v * Math.PI) / 180
  const radius = 6371000
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return radius * c
}

function IconBack() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconPlus() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5V19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M5 12H19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function IconMonth() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="5" width="16" height="15" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 3V7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M16 3V7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M4 10H20" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

function IconTrend() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 16L10 11L13 14L19 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 8H19V12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconUser() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5 19C6.6 15.9 9 14.5 12 14.5C15 14.5 17.4 15.9 19 19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function IconLocation() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 21C12 21 18 15.4 18 10C18 6.7 15.3 4 12 4C8.7 4 6 6.7 6 10C6 15.4 12 21 12 21Z" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="10" r="2.2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

function IconPin() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 21C12 21 18 15.4 18 10C18 6.7 15.3 4 12 4C8.7 4 6 6.7 6 10C6 15.4 12 21 12 21Z" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

function IconList() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8 7H19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8 12H19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8 17H19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="5" cy="7" r="1" fill="currentColor" />
      <circle cx="5" cy="12" r="1" fill="currentColor" />
      <circle cx="5" cy="17" r="1" fill="currentColor" />
    </svg>
  )
}

const screenHeroStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 16,
  flexWrap: 'wrap',
  padding: '24px 28px',
  borderRadius: 28,
  border: '1px solid rgba(101, 74, 32, 0.14)',
  background: 'linear-gradient(135deg, rgba(255, 253, 248, 0.98) 0%, rgba(243, 233, 214, 0.94) 100%)',
  boxShadow: '0 18px 40px rgba(76, 57, 24, 0.10)',
}

const screenEyebrowStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: '.16em',
  textTransform: 'uppercase',
  color: '#8d4a17',
}

const screenActionRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap',
  justifyContent: 'flex-end',
}

const detailSecondaryActionStyle: React.CSSProperties = {
  minHeight: 46,
  padding: '0 16px',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  borderRadius: 14,
  border: '1px solid rgba(101, 74, 32, 0.16)',
  background: 'linear-gradient(180deg, #fffaf2 0%, #f6ecde 100%)',
  color: '#8d4a17',
  fontWeight: 700,
  boxShadow: '0 10px 24px rgba(76, 57, 24, 0.08)',
  cursor: 'pointer',
}

const detailPrimaryActionStyle: React.CSSProperties = {
  ...detailSecondaryActionStyle,
  border: '1px solid rgba(201, 109, 31, 0.28)',
  background: 'linear-gradient(180deg, #d77a28 0%, #b85d18 100%)',
  color: '#fffaf5',
}

const infoBannerStyle: React.CSSProperties = {
  padding: '14px 16px',
  borderRadius: 16,
  background: 'rgba(255, 252, 246, 0.9)',
  border: '1px solid rgba(101, 74, 32, 0.12)',
  color: '#5f6673',
}

const errorBannerStyle: React.CSSProperties = {
  padding: '14px 16px',
  borderRadius: 16,
  background: '#fff7f6',
  border: '1px solid rgba(180, 35, 24, 0.14)',
  color: '#991b1b',
}

const detailOverviewStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 16,
  flexWrap: 'wrap',
  padding: '18px 20px',
  borderRadius: 22,
  background: 'linear-gradient(135deg, rgba(255, 253, 248, 0.96) 0%, rgba(244, 236, 221, 0.92) 100%)',
  border: '1px solid rgba(101, 74, 32, 0.12)',
}

const detailOverviewEyebrowStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: '.12em',
  textTransform: 'uppercase',
  color: '#8d4a17',
}

const statusPillStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 10,
  minHeight: 54,
  padding: '10px 14px',
  borderRadius: 18,
  background: '#fffdf8',
  border: '1px solid rgba(101, 74, 32, 0.12)',
  boxShadow: '0 10px 24px rgba(76, 57, 24, 0.06)',
}

const statusPillIconStyle: React.CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 12,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(201, 109, 31, 0.12)',
  color: '#8d4a17',
}

const statusPillLabelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: '.08em',
  textTransform: 'uppercase',
  color: '#7b8494',
}

const statusPillValueStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: '#1f2937',
}

const detailSectionCardStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
  padding: 18,
  borderRadius: 20,
  border: '1px solid rgba(101, 74, 32, 0.12)',
  background: '#fffdf8',
}

const detailSectionHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 12,
}

const detailSectionIconStyle: React.CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: 14,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(201, 109, 31, 0.12)',
  color: '#8d4a17',
  flexShrink: 0,
}

const detailSectionItemStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  paddingTop: 10,
  borderTop: '1px solid rgba(101, 74, 32, 0.08)',
}

const detailSectionItemLabelStyle: React.CSSProperties = {
  color: '#7b8494',
  fontSize: 12,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '.06em',
}

const detailSectionItemValueStyle: React.CSSProperties = {
  color: '#1f2937',
  fontSize: 15,
  lineHeight: 1.5,
}

const pairedDetailCardStyle: React.CSSProperties = {
  height: '100%',
}

const mapInfoChipStyle: React.CSSProperties = {
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

const mapContainerStyle: React.CSSProperties = {
  width: '100%',
  height: 360,
  borderRadius: 18,
  overflow: 'hidden',
  border: '1px solid rgba(101, 74, 32, 0.12)',
  background: '#f5efe3',
}

const nearbyPanelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  height: '100%',
}

const nearbyListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  maxHeight: 360,
  overflowY: 'auto',
}

const contextCardStyle: React.CSSProperties = {
  padding: '16px 18px',
  borderRadius: 20,
  border: '1px solid rgba(101, 74, 32, 0.12)',
  background: 'linear-gradient(180deg, rgba(255, 252, 247, 0.96) 0%, rgba(248, 241, 230, 0.90) 100%)',
}

const contextCardIconStyle: React.CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: 16,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(201, 109, 31, 0.12)',
  color: '#8d4a17',
  flexShrink: 0,
}

const nearbySummaryStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
}

const energyCardStyle: React.CSSProperties = {
  height: '100%',
}

const energyHeroStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 14,
  flexWrap: 'wrap',
  padding: '18px 20px',
  borderRadius: 22,
  border: '1px solid rgba(101, 74, 32, 0.12)',
}

const energySignalBadgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  minHeight: 36,
  padding: '0 14px',
  borderRadius: 999,
  border: '1px solid rgba(101, 74, 32, 0.12)',
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: '.08em',
  textTransform: 'uppercase',
}

const tablePanelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  height: '100%',
}

const cardContextStripStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
}

const tableScrollWrapStyle: React.CSSProperties = {
  overflowX: 'auto',
  overflowY: 'auto',
  maxHeight: 420,
  minHeight: 420,
  borderRadius: 18,
  border: '1px solid rgba(101, 74, 32, 0.08)',
  background: '#fffdf8',
}

const mapLegendChipStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  minHeight: 34,
  padding: '0 12px',
  borderRadius: 999,
  background: '#fffdf8',
  border: '1px solid rgba(101, 74, 32, 0.12)',
  color: '#5f6673',
  fontSize: 12,
  fontWeight: 700,
}

const tableHeaderCellStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '12px 8px',
  borderBottom: '1px solid rgba(101, 74, 32, 0.12)',
  color: '#3f4652',
  whiteSpace: 'nowrap',
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: '.04em',
  textTransform: 'uppercase',
}

const tableCellStyle: React.CSSProperties = {
  padding: '12px 8px',
  borderBottom: '1px solid rgba(101, 74, 32, 0.08)',
  color: '#4b5563',
  fontSize: 13,
  lineHeight: 1.5,
}

const emptyTableCellStyle: React.CSSProperties = {
  padding: 16,
  color: '#7b8494',
}

const valueBadgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  minHeight: 32,
  padding: '0 12px',
  borderRadius: 999,
  background: 'rgba(15, 118, 110, 0.10)',
  color: '#0f766e',
  fontSize: 13,
  fontWeight: 800,
}

const consumptionBadgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  minHeight: 32,
  padding: '0 12px',
  borderRadius: 999,
  background: 'rgba(48, 86, 166, 0.08)',
  color: '#3056a6',
  fontSize: 13,
  fontWeight: 800,
}

const emphasisTextStyle: React.CSSProperties = {
  color: '#1f2937',
  fontSize: 13,
  fontWeight: 800,
  letterSpacing: '-0.01em',
}

const secondaryEmphasisTextStyle: React.CSSProperties = {
  color: '#374151',
  fontSize: 12,
  fontWeight: 700,
}
