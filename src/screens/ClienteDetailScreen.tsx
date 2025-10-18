import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button, Card, Heading } from '../components'
import { useAuth } from '../contexts/AuthContext'
import { InstallationsApi, RegiaoApi, ComprasApi, EquipamentosApi, InstalacaoAccoesApi, type ModelInstallation, type ModelCompras, type ModelEquipamentos, type ModelInstalacaoAccoes } from '../services'

export default function ClienteDetailScreen() {
  const { getApiConfig, getAuthorizationHeaderValue, logout } = useAuth()
  const api = useMemo(() => new InstallationsApi(getApiConfig()), [getApiConfig])
  const regiaoApi = useMemo(() => new RegiaoApi(getApiConfig()), [getApiConfig])
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

  const isUnauthorizedBody = (data: any) => { try { const raw = data?.code ?? data?.error?.code ?? data?.status ?? data?.error?.status ?? data?.error_code; if (raw == null) return false; const num = Number(raw); if (!Number.isNaN(num) && num === 401) return true; const code = String(raw).toUpperCase(); return code === 'UNAUTHORIZED' || code === 'UNAUTHENTICATED' } catch { return false } }

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const { data } = await api.privateInstallationsPfGet(pf, mes, authHeader)
      if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      setItem(data as any)
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 401 || isUnauthorizedBody(err?.response?.data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      setError(!status ? 'Sem ligação ao servidor.' : 'Falha a obter instalação.')
    } finally { setLoading(false) }
  }, [api, authHeader, pf, mes])

  useEffect(() => { if (pf && mes) load() }, [load, pf, mes])

  useEffect(() => {
    (async () => {
      if (!item?.regiao_id) { setRegiaoName(''); return }
      try {
        const { data } = await regiaoApi.privateRegioesIdGet(item.regiao_id, authHeader)
        setRegiaoName((data as any)?.name || '')
      } catch { setRegiaoName('') }
    })()
  }, [item?.regiao_id, regiaoApi, authHeader])

  const injectScriptOnce = (apiKey: string): Promise<void> => {
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

  function scoreToPct(s?: number): number | null {
    if (typeof s !== 'number' || Number.isNaN(s)) return null
    return Math.max(0, Math.min(100, s * 100))
  }
  function scoreColor(pct: number): string {
    if (pct >= 80) return '#16a34a'
    if (pct >= 60) return '#22c55e'
    if (pct >= 40) return '#eab308'
    if (pct >= 20) return '#f59e0b'
    return '#ef4444'
  }
  function buildScoreSvg(pct: number | null, main: boolean): string {
    const size = main ? 36 : 28
    const r = size / 2
    const fill = pct == null ? '#9ca3af' : scoreColor(pct)
    const text = pct == null ? '?' : String(Math.round(pct))
    const fontSize = main ? 12 : 10
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 ${size} ${size}'>
      <circle cx='${r}' cy='${r}' r='${r - 1}' fill='${fill}' stroke='#ffffff' stroke-width='2'/>
      <text x='50%' y='50%' dominant-baseline='central' text-anchor='middle' font-family='Inter, system-ui, sans-serif' font-size='${fontSize}' font-weight='800' fill='#ffffff'>${text}</text>
    </svg>`
    return `data:image/svg+xml;utf8,` + encodeURIComponent(svg)
  }
  function makeGIcon(g: any, pct: number | null, main: boolean): any {
    const url = buildScoreSvg(pct, main)
    const size = main ? 36 : 28
    return { url, scaledSize: new g.Size(size, size), anchor: new g.Point(size / 2, size / 2) }
  }

  useEffect(() => {
    (async () => {
      const lat = Number(item?.lat)
      const lng = Number((item as any)?.long)
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return
      const key = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY
      if (!key) return
      try { await injectScriptOnce(key) } catch { return }
      const g = (window as any).google?.maps
      const center = { lat, lng }
      gmapRef.current = new g.Map(mapRef.current, { center, zoom: 14, mapTypeControl: false, fullscreenControl: false, streetViewControl: false })
      const mainIcon: any = makeGIcon(g, scoreToPct(item?.score as any), true)
      if (mainMarkerRef.current) { try { mainMarkerRef.current.setMap(null) } catch {} }
      mainMarkerRef.current = new g.Marker({ position: center, map: gmapRef.current, title: item?.nome || 'Cliente', icon: mainIcon })
      // init single InfoWindow
      try { infoRef.current = new g.InfoWindow() } catch { infoRef.current = null }
      // bind main marker click
      if (infoRef.current && mainMarkerRef.current) {
        const compras = formatKwh(item?.compras_6_meses)
        const consumo = formatKwh((item as any)?.equipamentos_6_meses)
        const html = `<div style="max-width:260px">
          <strong>${item?.nome || item?.pf || 'Cliente'}</strong><br/>
          PF: ${item?.pf || '—'}<br/>
          Compras (6m): ${compras}<br/>
          Consumo calc. (6m): ${consumo}
        </div>`
        mainMarkerRef.current.addListener('click', () => {
          try { infoRef.current.setContent(html); infoRef.current.open({ anchor: mainMarkerRef.current, map: gmapRef.current }) } catch {}
        })
      }
      setMapReady(true)
    })()
  }, [item?.lat, (item as any)?.long])

  useEffect(() => {
    (async () => {
      const lat = Number(item?.lat)
      const lng = Number((item as any)?.long)
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) { setNearby([]); return }
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
        setNearby(Array.isArray(list) ? list.filter((x: any) => x?.pf !== item?.pf || x?.mes !== item?.mes) : [])
      } catch (e: any) {
        setNearby([])
        setNearbyError('Falha ao carregar instalações próximas.')
      }
    })()
  }, [item?.lat, (item as any)?.long, item?.pf, item?.mes, api, authHeader])

  // Load compras and equipamentos for this installation
  useEffect(() => {
    (async () => {
      setComprasError(null); setEquipError(null)
      try {
        const pfv = item?.pf
        if (pfv) {
          const comprasApi = new ComprasApi((api as any).configuration)
          const { data } = await comprasApi.privateComprasPfGet(pfv, authHeader)
          setCompras(((data as any)?.items) ?? [])
        } else setCompras([])
      } catch { setComprasError('Falha ao carregar compras.'); setCompras([]) }
      try {
        const inspId = (item as any)?.inspecao_id
        if (inspId) {
          const equipApi = new EquipamentosApi((api as any).configuration)
          const { data } = await equipApi.privateEquipamentosInspeccaoIdGet(inspId, authHeader)
          setEquipamentos(((data as any)?.items) ?? [])
        } else setEquipamentos([])
      } catch { setEquipError('Falha ao carregar equipamentos.'); setEquipamentos([]) }
      try {
        setAcoesError(null)
        const pf2 = item?.pf
        if (pf2) {
          const accApi = new InstalacaoAccoesApi((api as any).configuration)
          const { data } = await accApi.privateInstalacaoAccoesGet(authHeader, -1, undefined, 'created_at', 'desc', pf2)
          setAcoes(((data as any)?.items) ?? [])
        } else setAcoes([])
      } catch { setAcoesError('Falha ao carregar ações desta instalação.'); setAcoes([]) }
    })()
  }, [item?.pf, (item as any)?.inspecao_id, api, authHeader])

  // Render markers for nearby on the map
  useEffect(() => {
    const g = (window as any).google?.maps
    if (!g || !gmapRef.current || !mapReady) return
    // clear previous nearby markers
    nearbyMarkersRef.current.forEach((m) => { try { m.setMap(null) } catch {} })
    nearbyMarkersRef.current = []
    const bounds = new g.LatLngBounds()
    const lat = Number(item?.lat)
    const lng = Number((item as any)?.long)
    if (Number.isFinite(lat) && Number.isFinite(lng)) bounds.extend({ lat, lng })
    ;(nearby || [])
      .map((n) => ({ ...n, __lat: Number((n as any).lat), __lng: Number((n as any).long) }))
      .filter((n) => Number.isFinite((n as any).__lat) && Number.isFinite((n as any).__lng))
      .forEach((n) => {
        const pos = { lat: (n as any).__lat, lng: (n as any).__lng }
        const icon = makeGIcon(g, scoreToPct((n as any)?.score as any), false)
        const marker = new g.Marker({ position: pos, map: gmapRef.current, title: n.nome || n.pf || 'Cliente próximo', icon })
        if (infoRef.current) {
          const compras = formatKwh(n.compras_6_meses)
          const consumo = formatKwh((n as any).equipamentos_6_meses)
          const html = `<div style="max-width:260px">
            <strong>${n.nome || n.pf || 'Cliente'}</strong><br/>
            PF: ${n.pf || '—'}<br/>
            Compras (6m): ${compras}<br/>
            Consumo calc. (6m): ${consumo}
          </div>`
          marker.addListener('click', () => {
            try { infoRef.current.setContent(html); infoRef.current.open({ anchor: marker, map: gmapRef.current }) } catch {}
          })
        }
        nearbyMarkersRef.current.push(marker)
        bounds.extend(pos)
      })
    try { if (!bounds.isEmpty()) gmapRef.current.fitBounds(bounds) } catch {}
  }, [nearby, item?.lat, (item as any)?.long, mapReady])

  function voltar() {
    if (window.location.pathname !== '/instalacoes') window.history.pushState({}, '', '/instalacoes')
    window.dispatchEvent(new Event('locationchange'))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Heading level={2}>Detalhes da instalação</Heading>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" onClick={voltar}>Voltar</Button>
          <Button onClick={() => { const sp = new URLSearchParams(); sp.set('pf', pf); sp.set('novo', '1'); window.history.pushState({}, '', `/instalacoes/accoes?${sp.toString()}`); window.dispatchEvent(new Event('locationchange')) }}>Adicionar ação</Button>
        </div>
      </div>

      {!pf || !mes ? (
        <div style={{ background: '#fef3c7', color: '#92400e', padding: 10, borderRadius: 8 }}>Parâmetros inválidos. Falta PF ou mês.</div>
      ) : null}

      {loading && <div style={{ color: '#6b7280' }}>A carregar…</div>}
      {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: 10, borderRadius: 8 }}>{error}</div>}
      {!loading && !error && item && (
        <>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>Cliente</div>
                <div style={{ fontSize: 22, fontWeight: 800 }}>{item.nome || item.pf || '—'}</div>
                <div style={{ color: '#6b7280', marginTop: 4 }}>Mês: {formatMonth(item.mes)} · PF: {item.pf || '—'}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))', gap: 10, minWidth: 280 }}>
                <Kpi label="Compras (6m)" value={formatKwh(item.compras_6_meses)} color="#0ea5e9" />
                <Kpi label="Consumo calc. (6m)" value={formatKwh(item.equipamentos_6_meses)} color="#6366f1" />
                <Kpi label="Score" value={formatPercent(item.score)} color="#10b981" />
                <Kpi label="Tendência" value={formatTendencia(item.tendencia_compras)} color="#6b7280" />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginTop: 12 }}>
              <Field label="ASC" value={(item as any).asc_name || (item as any).asc_id || '-'} />
              <Field label="Região" value={regiaoName || item.regiao_id || '-'} />
              <Field label="PT" value={item.pt_name || item.pt_id || '-'} />
              <Field label="Localização" value={formatLatLng(item.lat, (item as any)?.long)} />
            </div>
          </Card>

          <Card title="Localização">
            <div ref={mapRef} style={{ width: '100%', height: 320, borderRadius: 12, overflow: 'hidden', border: '1px solid #e5e7eb', background: '#f3f4f6' }} />
          </Card>

          <Card title="Histórico de ações">
            {acoesError ? <div style={{ background: '#fef3c7', color: '#92400e', padding: 10, borderRadius: 8 }}>{acoesError}</div> : null}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ color: '#6b7280' }}>Total: {acoes.length}</div>
              <Button variant="secondary" onClick={() => { const sp = new URLSearchParams(); if (item?.pf) sp.set('pf', item.pf); window.history.pushState({}, '', `/instalacoes/accoes?${sp.toString()}`); window.dispatchEvent(new Event('locationchange')) }}>Gerir ações</Button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '10px 8px', borderBottom: '1px solid #e5e7eb' }}>Criado em</th>
                    <th style={{ textAlign: 'left', padding: '10px 8px', borderBottom: '1px solid #e5e7eb' }}>Execução</th>
                    <th style={{ textAlign: 'left', padding: '10px 8px', borderBottom: '1px solid #e5e7eb' }}>Tipo</th>
                    <th style={{ textAlign: 'left', padding: '10px 8px', borderBottom: '1px solid #e5e7eb' }}>Marcação</th>
                    <th style={{ textAlign: 'left', padding: '10px 8px', borderBottom: '1px solid #e5e7eb' }}>Análise</th>
                    <th style={{ textAlign: 'left', padding: '10px 8px', borderBottom: '1px solid #e5e7eb' }}>Tendência</th>
                    <th style={{ textAlign: 'left', padding: '10px 8px', borderBottom: '1px solid #e5e7eb' }}>Valor recuperado</th>
                  </tr>
                </thead>
                <tbody>
                  {acoes.length === 0 ? (
                    <tr><td colSpan={7} style={{ padding: 12, color: '#6b7280' }}>Sem ações registadas para esta instalação.</td></tr>
                  ) : acoes.map((a, i) => (
                    <tr key={a.id ?? i}>
                      <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6' }}>{formatDate(a.created_at)}</td>
                      <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6' }}>{formatDate(a.data_execucao)}</td>
                      <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6' }}>{(a as any).accao_tipo?.nome || (a as any).accao_tipo_id || '-'}</td>
                      <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6' }}>{a.marcacao_status || '-'}</td>
                      <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6' }}>{a.analise_status || '-'}</td>
                      <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6' }}>{formatTendencia(a.tendencia_compras)}</td>
                      <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6' }}>{formatMoney(a.valor_recuperado)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="Equipamentos (inspeção)">
            {equipError ? <div style={{ background: '#fef3c7', color: '#92400e', padding: 10, borderRadius: 8 }}>{equipError}</div> : null}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '10px 8px', borderBottom: '1px solid #e5e7eb' }}>Equipamento</th>
                    <th style={{ textAlign: 'left', padding: '10px 8px', borderBottom: '1px solid #e5e7eb' }}>Qtd</th>
                    <th style={{ textAlign: 'left', padding: '10px 8px', borderBottom: '1px solid #e5e7eb' }}>Potência</th>
                    <th style={{ textAlign: 'left', padding: '10px 8px', borderBottom: '1px solid #e5e7eb' }}>Horas/dia</th>
                    <th style={{ textAlign: 'left', padding: '10px 8px', borderBottom: '1px solid #e5e7eb' }}>Dias/mês</th>
                    <th style={{ textAlign: 'left', padding: '10px 8px', borderBottom: '1px solid #e5e7eb' }}>Índice uso</th>
                    <th style={{ textAlign: 'left', padding: '10px 8px', borderBottom: '1px solid #e5e7eb' }}>Consumo estimado</th>
                  </tr>
                </thead>
                <tbody>
                  {equipamentos.length === 0 ? (
                    <tr><td colSpan={7} style={{ padding: 12, color: '#6b7280' }}>Sem equipamentos.</td></tr>
                  ) : equipamentos.map((e, i) => (
                    <tr key={e.id ?? i}>
                      <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6' }}>{e.nome || '-'}</td>
                      <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6' }}>{fmtInt(e.quantidade)}</td>
                      <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6' }}>{fmtNum(e.potencia)}</td>
                      <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6' }}>{fmtNum(e.horas)}</td>
                      <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6' }}>{fmtInt(e.dias)}</td>
                      <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6' }}>{fmtNum(e.indice_uso)}</td>
                      <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6' }}>{formatKwh(e.consumo_estimado)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="Compras (PF)">
            {comprasError ? <div style={{ background: '#fef3c7', color: '#92400e', padding: 10, borderRadius: 8 }}>{comprasError}</div> : null}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '10px 8px', borderBottom: '1px solid #e5e7eb' }}>Período</th>
                    <th style={{ textAlign: 'left', padding: '10px 8px', borderBottom: '1px solid #e5e7eb' }}>Unidades</th>
                    <th style={{ textAlign: 'left', padding: '10px 8px', borderBottom: '1px solid #e5e7eb' }}>Valor</th>
                    <th style={{ textAlign: 'left', padding: '10px 8px', borderBottom: '1px solid #e5e7eb' }}>Nº compras</th>
                  </tr>
                </thead>
                <tbody>
                  {compras.length === 0 ? (
                    <tr><td colSpan={4} style={{ padding: 12, color: '#6b7280' }}>Sem compras.</td></tr>
                  ) : compras.map((c, i) => (
                    <tr key={c.id ?? i}>
                      <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6' }}>{c.periodo || '-'}</td>
                      <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6' }}>{formatKwh(c.trn_units)}</td>
                      <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6' }}>{formatMoney(c.trn_amount)}</td>
                      <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6' }}>{fmtInt(c.no_compras)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="Clientes próximos">
            {nearbyError ? <div style={{ background: '#fef3c7', color: '#92400e', padding: 10, borderRadius: 8 }}>{nearbyError}</div> : null}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '10px 8px', borderBottom: '1px solid #e5e7eb' }}>PF</th>
                    <th style={{ textAlign: 'left', padding: '10px 8px', borderBottom: '1px solid #e5e7eb' }}>Nome</th>
                    <th style={{ textAlign: 'left', padding: '10px 8px', borderBottom: '1px solid #e5e7eb' }}>ASC</th>
                    <th style={{ textAlign: 'left', padding: '10px 8px', borderBottom: '1px solid #e5e7eb' }}>Compras (6m)</th>
                    <th style={{ textAlign: 'left', padding: '10px 8px', borderBottom: '1px solid #e5e7eb' }}>Consumo calc. (6m)</th>
                  </tr>
                </thead>
                <tbody>
                  {nearby.length === 0 ? (
                    <tr><td colSpan={5} style={{ padding: 12, color: '#6b7280' }}>Sem instalações próximas.</td></tr>
                  ) : nearby.map((n, i) => (
                    <tr key={`${n.pf}-${n.mes}-${i}`}>
                      <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6' }}>{n.pf || '-'}</td>
                      <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6' }}>{n.nome || '-'}</td>
                      <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6' }}>{(n as any).asc_name || '-'}</td>
                      <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6' }}>{formatKwh(n.compras_6_meses)}</td>
                      <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6' }}>{formatKwh((n as any).equipamentos_6_meses)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: '#6b7280' }}>{label}</div>
      <div style={{ fontWeight: 500 }}>{value || '-'}</div>
    </div>
  )
}

function Kpi({ label, value, color = '#111827' }: { label: string; value?: string; color?: string }) {
  return (
    <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: 10, minWidth: 140 }}>
      <div style={{ fontSize: 12, color: '#6b7280' }}>{label}</div>
      <div style={{ fontWeight: 800, fontSize: 18, color }}>{value || '-'}</div>
    </div>
  )
}

function formatNumber(n?: number) { return typeof n === 'number' && !Number.isNaN(n) ? String(n) : '-' }
function formatKwh(n?: number) { if (typeof n !== 'number' || Number.isNaN(n)) return '-'; try { return `${n.toLocaleString('pt-PT')} kWh` } catch { return `${n} kWh` } }
function formatPercent(n?: number) { if (typeof n !== 'number' || Number.isNaN(n)) return '-'; const v = n * 100; try { return `${v.toLocaleString('pt-PT', { maximumFractionDigits: 1 })}%` } catch { return `${v.toFixed(1)}%` } }
function formatMoney(n?: number) { if (typeof n !== 'number' || Number.isNaN(n)) return '-'; try { return `${n.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT` } catch { return `${n.toFixed(2)} MT` } }
function formatDate(iso?: string) { if (!iso) return '-'; try { const d = new Date(iso as any); if (Number.isNaN(d.getTime())) return '-'; return d.toLocaleDateString('pt-PT') } catch { return '-' } }
function fmtInt(n?: number) { return typeof n === 'number' && Number.isFinite(n) ? String(Math.round(n)) : '-' }
function fmtNum(n?: number) { return typeof n === 'number' && Number.isFinite(n) ? String(n) : '-' }
function formatMonth(iso?: string) { if (!iso) return '-'; try { const d = new Date(iso as any); if (Number.isNaN(d.getTime())) return '-'; return d.toLocaleDateString('pt-PT', { year: 'numeric', month: '2-digit' }) } catch { return '-' } }
function formatTendencia(t?: any) {
  const v = String(t || '')
  switch (v) {
    case 'CRESCENTE': return 'Crescente'
    case 'MUITO_CRESCENTE': return 'Muito crescente'
    case 'NORMAL': return 'Normal'
    case 'DECRESCENTE': return 'Decrescente'
    case 'MUITO_DECRESCENTE': return 'Muito decrescente'
    case 'SEM_COMPRAS': return 'Sem compras'
    default: return '-'
  }
}
function formatLatLng(lat?: number, lng?: number) {
  const a = (typeof lat === 'number' && !Number.isNaN(lat)) ? lat.toFixed(5) : '-'
  const b = (typeof lng === 'number' && !Number.isNaN(lng)) ? lng.toFixed(5) : '-'
  return a === '-' && b === '-' ? '-' : `${a}, ${b}`
}
