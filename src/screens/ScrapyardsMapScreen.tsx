import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Card } from '../components'
import { useAuth } from '../contexts/AuthContext'
import { ASCApi, ScrapyardApi, type ModelASC, type ModelScrapyard } from '../services'

declare global {
  interface Window {
    __gmapsLoadingPromise?: Promise<void>
  }
}

function injectScriptOnce(apiKey: string): Promise<void> {
  if ((window as any).google?.maps) return Promise.resolve()
  if (window.__gmapsLoadingPromise) return window.__gmapsLoadingPromise

  const src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly`
  window.__gmapsLoadingPromise = new Promise<void>((resolve, reject) => {
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

  return window.__gmapsLoadingPromise
}

export default function ScrapyardsMapScreen() {
  const { getApiConfig, getAuthorizationHeaderValue, logout } = useAuth()
  const api = useMemo(() => new ScrapyardApi(getApiConfig()), [getApiConfig])
  const authHeader = useMemo(() => getAuthorizationHeaderValue(), [getAuthorizationHeaderValue])

  const [items, setItems] = useState<ModelScrapyard[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ascOptions, setAscOptions] = useState<Array<{ id: string; label: string }>>([])
  const [selectedAsc, setSelectedAsc] = useState('')
  const [search, setSearch] = useState('')
  const [focusedId, setFocusedId] = useState<string | null>(null)

  const mapRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const markersRef = useRef<any[]>([])
  const infoRef = useRef<any>(null)

  const isUnauthorizedBody = (data: any) => {
    try {
      const raw = data?.code ?? data?.error?.code ?? data?.status ?? data?.error?.status ?? data?.error_code
      if (raw === undefined || raw === null) return false
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
      const { data } = await api.privateScrapyardsGet(authHeader, -1, undefined, undefined, undefined, selectedAsc || undefined)
      if (isUnauthorizedBody(data)) {
        logout('Sessão expirada. Inicie sessão novamente.')
        return
      }
      setItems((data as any).items ?? [])
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 401 || isUnauthorizedBody(err?.response?.data)) {
        logout('Sessão expirada. Inicie sessão novamente.')
        return
      }
      setError(!status ? 'Sem ligação ao servidor.' : 'Falha a obter sucatarias.')
    } finally {
      setLoading(false)
    }
  }, [api, authHeader, logout, selectedAsc])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    let cancelled = false
    async function loadASCs() {
      try {
        const apiAsc = new ASCApi(getApiConfig())
        const { data } = await apiAsc.privateAscsGet(authHeader, -1, undefined, 'name', 'asc')
        const list = (data.items ?? []) as ModelASC[]
        if (!cancelled) {
          setAscOptions(list.filter((item) => item.id && item.name).map((item) => ({ id: String(item.id), label: String(item.name) })))
        }
      } catch {
        if (!cancelled) setAscOptions([])
      }
    }
    loadASCs()
    return () => { cancelled = true }
  }, [authHeader, getApiConfig])

  useEffect(() => {
    async function initMap() {
      const key = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY
      if (!key) {
        setError('Google Maps não está configurado (VITE_GOOGLE_MAPS_API_KEY ausente).')
        return
      }
      try {
        await injectScriptOnce(key)
      } catch (err: any) {
        setError(err?.message || 'Falha ao inicializar o mapa.')
        return
      }

      const gmaps = (window as any).google.maps
      mapRef.current = new gmaps.Map(containerRef.current!, {
        center: { lat: -25.965, lng: 32.571 },
        zoom: 7,
        mapTypeControl: false,
        fullscreenControl: false,
        streetViewControl: false,
        styles: DETAIL_MAP_STYLES,
      })
      infoRef.current = new gmaps.InfoWindow()
    }
    initMap()
  }, [])

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase()
    return items.filter((item) => {
      if (item.lat == null || item.long == null) return false
      if (!query) return true
      const fields = [
        item.nome || '',
        item.asc_name || item.asc_id || '',
        (item.materiais ?? []).map((material) => material?.name || material?.id).filter(Boolean).join(', '),
      ]
      return fields.some((value) => value.toLowerCase().includes(query))
    })
  }, [items, search])

  const averageSuspicion = useMemo(() => {
    const valid = filteredItems.map((item) => item.nivel_confianca).filter((value): value is number => typeof value === 'number' && !Number.isNaN(value))
    if (!valid.length) return null
    return valid.reduce((sum, value) => sum + value, 0) / valid.length
  }, [filteredItems])

  useEffect(() => {
    const gmaps = (window as any).google?.maps
    if (!gmaps || !mapRef.current) return

    markersRef.current.forEach((marker) => marker.setMap(null))
    markersRef.current = []

    const escapeHtml = (value: any) => String(value ?? '—')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')

    filteredItems.forEach((item) => {
      const lat = Number(item.lat)
      const lng = Number(item.long)
      const marker = new gmaps.Marker({
        position: { lat, lng },
        map: mapRef.current,
        title: item.nome || '',
        icon: buildFactoryMarkerIcon(item.id === focusedId),
      })

      const materials = item.materiais?.map((material) => material?.name || material?.id).filter(Boolean).join(', ') || '—'
      const html = `<div style="max-width:280px;font-family:Manrope,'Segoe UI',sans-serif;background:linear-gradient(180deg,#fffaf2 0%,#f6ecde 100%);border:1px solid rgba(101,74,32,.14);border-radius:18px;padding:14px;box-shadow:0 14px 28px rgba(76,57,24,.12);color:#1f2937">
        <div style="font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#8d4a17;margin-bottom:6px">Sucataria</div>
        <div style="font-size:16px;font-weight:800;line-height:1.2;margin-bottom:10px">${escapeHtml(item.nome || 'Sucataria')}</div>
        <div style="display:grid;gap:6px;margin-bottom:12px">
          <div style="font-size:12px;color:#5f6673"><strong style="color:#3f4652">ASC:</strong> ${escapeHtml(item.asc_name || item.asc_id || '—')}</div>
          <div style="font-size:12px;color:#5f6673"><strong style="color:#3f4652">Materiais:</strong> ${escapeHtml(materials)}</div>
          <div style="font-size:12px;color:#5f6673"><strong style="color:#3f4652">Desconfiança:</strong> ${typeof item.nivel_confianca === 'number' ? `${(item.nivel_confianca * 100).toFixed(1)} %` : '—'}</div>
        </div>
      </div>`

      marker.addListener('click', () => {
        setFocusedId(item.id || null)
        infoRef.current?.setContent(html)
        infoRef.current?.open({ anchor: marker, map: mapRef.current })
      })

      markersRef.current.push(marker)
    })

    if (filteredItems.length) {
      const sum = filteredItems.reduce<{ lat: number; lng: number }>((acc, item) => ({
        lat: acc.lat + Number(item.lat),
        lng: acc.lng + Number(item.long),
      }), { lat: 0, lng: 0 })
      const center = { lat: sum.lat / filteredItems.length, lng: sum.lng / filteredItems.length }
      mapRef.current.setCenter(center)
      mapRef.current.setZoom(filteredItems.length <= 3 ? 12 : filteredItems.length <= 10 ? 11 : 10)
    }
  }, [filteredItems, focusedId])

  function goBack() {
    if (window.location.pathname !== '/sucatarias') window.history.pushState({}, '', '/sucatarias')
    window.dispatchEvent(new Event('popstate'))
    window.dispatchEvent(new Event('locationchange'))
  }

  function focusItem(item: ModelScrapyard) {
    if (!mapRef.current || item.lat == null || item.long == null) return
    setFocusedId(item.id || null)
    mapRef.current.setCenter({ lat: Number(item.lat), lng: Number(item.long) })
    mapRef.current.setZoom(13)
  }

  function openDetails(id?: string) {
    if (!id) return
    window.history.pushState({}, '', `/sucatarias/${id}`)
    window.dispatchEvent(new Event('locationchange'))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={screenHeroStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={screenEyebrowStyle}>Sucatarias</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <h2 style={{ margin: 0, fontSize: 30, lineHeight: 1.05, color: '#1f2937' }}>Mapa das sucatarias</h2>
            <p style={{ margin: 0, color: '#5f6673', lineHeight: 1.6 }}>
              Explore a distribuição geográfica das sucatarias numa vista mais rica, com lista contextual, filtros e marcadores próprios.
            </p>
          </div>
        </div>
        <div style={screenActionRowStyle}>
          <button type="button" onClick={goBack} style={detailSecondaryActionStyle}>
            <IconBack />
            <span>Voltar à lista</span>
          </button>
        </div>
      </div>

      {error ? <div style={errorBannerStyle}>{error}</div> : null}

      <div style={mapBoardStyle}>
        <div style={contextColumnStyle}>
          <Card title="Contexto" subtitle="Filtre e percorra as sucatarias disponíveis.">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={statsGridStyle}>
                <div style={statCardStyle}>
                  <span style={statLabelStyle}>Sucatarias</span>
                  <strong style={statValueStyle}>{filteredItems.length}</strong>
                </div>
                <div style={statCardStyle}>
                  <span style={statLabelStyle}>Desconfiança média</span>
                  <strong style={statValueStyle}>{averageSuspicion != null ? `${(averageSuspicion * 100).toFixed(1)} %` : '—'}</strong>
                </div>
              </div>

              <div style={filterPanelStyle}>
                <label style={fieldGroupStyle}>
                  <span style={fieldLabelStyle}>ASC</span>
                  <select value={selectedAsc} onChange={(e) => setSelectedAsc(e.target.value)} style={fieldControlStyle}>
                    <option value="">Todas</option>
                    {ascOptions.map((option) => (
                      <option key={option.id} value={option.id}>{option.label}</option>
                    ))}
                  </select>
                </label>

                <label style={fieldGroupStyle}>
                  <span style={fieldLabelStyle}>Pesquisar</span>
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Pesquisar por nome, ASC ou material…"
                    style={fieldControlStyle}
                  />
                </label>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span style={summaryChipStyle}>Resultados: {filteredItems.length}</span>
                  {loading ? <span style={summaryChipStyle}>A carregar…</span> : null}
                  {selectedAsc ? <span style={summaryChipStyle}>ASC filtrada</span> : null}
                </div>
              </div>
            </div>
          </Card>

        </div>

        <div style={listColumnStyle}>
          <Card title="Lista" subtitle="Selecione uma sucataria para focar o mapa.">
            <div style={listPanelStyle}>
              {filteredItems.length ? filteredItems.map((item) => {
                const materials = item.materiais?.map((material) => material?.name || material?.id).filter(Boolean) as string[] || []
                const active = item.id === focusedId
                return (
                  <button key={item.id} type="button" style={listItemButtonStyle} onClick={() => focusItem(item)}>
                    <div style={{ ...listItemCardStyle, ...(active ? listItemCardActiveStyle : null) }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <span style={{ ...listItemIconStyle, ...(active ? listItemIconActiveStyle : null) }}>
                          <IconFactory />
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0, flex: 1 }}>
                          <strong style={{ color: '#1f2937' }}>{item.nome || 'Sem nome'}</strong>
                          <span style={{ color: '#5f6673', fontSize: 13 }}>{item.asc_name || item.asc_id || 'ASC não indicada'}</span>
                          <span style={{ color: '#7b8494', fontSize: 12, overflowWrap: 'anywhere' }}>
                            {materials.length ? materials.join(', ') : 'Sem materiais associados'}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={summaryChipStyle}>Desconfiança: {typeof item.nivel_confianca === 'number' ? `${(item.nivel_confianca * 100).toFixed(1)} %` : '—'}</span>
                        <button
                          type="button"
                          style={inlineLinkButtonStyle}
                          onClick={(event) => {
                            event.stopPropagation()
                            openDetails(item.id)
                          }}
                        >
                          Ver detalhes
                        </button>
                      </div>
                    </div>
                  </button>
                )
              }) : (
                <div style={infoBannerStyle}>Sem sucatarias para mostrar.</div>
              )}
            </div>
          </Card>
        </div>

        <div style={mapColumnStyle}>
          <Card title="Mapa" subtitle="Visualização geográfica com marcadores institucionais de sucatarias.">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={summaryChipStyle}>Marcador principal: sucataria</span>
                <span style={summaryChipStyle}>Ícone industrial personalizado</span>
                <span style={summaryChipStyle}>Base cartográfica quente</span>
              </div>
              <div ref={containerRef} style={mapContainerStyle} />
              <div style={legendPanelStyle}>
                <span style={legendChipStyle}>
                  <span style={legendMarkerShellStyle}>
                    <span style={legendMarkerDotStyle} />
                  </span>
                  Sucataria
                </span>
                <span style={legendChipStyle}>Clique num item da lista para focar o mapa</span>
                <span style={legendChipStyle}>Clique num marcador para contexto rápido</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

function buildWarehouseMarkerIcon(active: boolean) {
  const fill = active ? '#8d4a17' : '#b42318'
  const stroke = active ? '#f8efe2' : '#fffaf2'
  const svg = `
    <svg width="38" height="46" viewBox="0 0 38 46" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M19 1.8C9.7 1.8 2.2 9.3 2.2 18.6C2.2 31.2 17.2 42.7 18.1 43.4C18.6 43.8 19.4 43.8 19.9 43.4C20.8 42.7 35.8 31.2 35.8 18.6C35.8 9.3 28.3 1.8 19 1.8Z" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
      <path d="M10.5 22.5V17.3L19 12.7L27.5 17.3V22.5" stroke="${stroke}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M12.2 22.5V28.5H25.8V22.5" stroke="${stroke}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M17 28.5V23.8H21V28.5" stroke="${stroke}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M9.8 17.8H28.2" stroke="${stroke}" stroke-width="1.4" stroke-linecap="round"/>
    </svg>
  `.trim()
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: { width: 38, height: 46 },
    anchor: { x: 19, y: 43 },
  }
}

function IconBack() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconFactory() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 20V12.5L10.5 16V12.5L17 16V7H20V20H4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M8 20V16.5H11V20" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M16.5 7V4H18.5V7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M7 10.5H7.01M15 11.2H15.01" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  )
}

const DETAIL_MAP_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#f6efe3' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#5f6673' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#fffaf2' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#d9c9af' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#efe4d4' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#dcefe2' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#eadcc6' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#dbeef0' }] },
]

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
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  minHeight: 44,
  padding: '0 18px',
  borderRadius: 16,
  border: '1px solid rgba(101, 74, 32, 0.16)',
  background: 'linear-gradient(180deg, #fffaf2 0%, #f6ecde 100%)',
  color: '#8d4a17',
  fontWeight: 800,
  cursor: 'pointer',
  boxShadow: '0 10px 24px rgba(76, 57, 24, 0.08)',
}

const errorBannerStyle: React.CSSProperties = {
  padding: '14px 16px',
  borderRadius: 18,
  background: '#fff1f1',
  border: '1px solid rgba(200, 60, 60, 0.18)',
  color: '#991b1b',
  fontWeight: 700,
}

function buildFactoryMarkerIcon(active: boolean) {
  const fill = active ? '#8d4a17' : '#b42318'
  const stroke = active ? '#f8efe2' : '#fffaf2'
  const svg = `
    <svg width="38" height="46" viewBox="0 0 38 46" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M19 1.8C9.7 1.8 2.2 9.3 2.2 18.6C2.2 31.2 17.2 42.7 18.1 43.4C18.6 43.8 19.4 43.8 19.9 43.4C20.8 42.7 35.8 31.2 35.8 18.6C35.8 9.3 28.3 1.8 19 1.8Z" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
      <path d="M11 26V20.8L17.2 24.2V20.8L23 24.2V15.2H26V26H11Z" stroke="${stroke}" stroke-width="1.8" stroke-linejoin="round"/>
      <path d="M14.4 26V22.5H17V26" stroke="${stroke}" stroke-width="1.8" stroke-linejoin="round"/>
      <path d="M22.5 15.2V11.8H24.2V15.2" stroke="${stroke}" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M14 18.8H14.01M20 19.5H20.01" stroke="${stroke}" stroke-width="2.3" stroke-linecap="round"/>
    </svg>
  `.trim()
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: { width: 38, height: 46 },
    anchor: { x: 19, y: 43 },
  }
}

const mapBoardStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '320px 360px minmax(0, 1fr)',
  gap: 16,
  alignItems: 'stretch',
}

const contextColumnStyle: React.CSSProperties = {
  minWidth: 0,
}

const listColumnStyle: React.CSSProperties = {
  minWidth: 0,
}

const mapColumnStyle: React.CSSProperties = {
  minWidth: 0,
}

const statsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 10,
}

const statCardStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  padding: '14px 16px',
  borderRadius: 18,
  background: 'linear-gradient(180deg, #fffaf2 0%, #f8efe2 100%)',
  border: '1px solid rgba(101, 74, 32, 0.12)',
}

const statLabelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: '.1em',
  textTransform: 'uppercase',
  color: '#7b8494',
}

const statValueStyle: React.CSSProperties = {
  color: '#1f2937',
  fontSize: 20,
  fontWeight: 800,
}

const filterPanelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
}

const fieldGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
}

const fieldLabelStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#7b8494',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '.06em',
}

const fieldControlStyle: React.CSSProperties = {
  minHeight: 46,
  padding: '0 14px',
  borderRadius: 14,
  border: '1px solid rgba(101, 74, 32, 0.14)',
  background: '#fffdf9',
  color: '#1f2937',
  boxShadow: '0 10px 24px rgba(101, 74, 32, 0.05)',
}

const summaryChipStyle: React.CSSProperties = {
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

const listPanelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  maxHeight: 600,
  overflowY: 'auto',
  paddingRight: 6,
}

const listItemButtonStyle: React.CSSProperties = {
  padding: 0,
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  textAlign: 'left',
}

const listItemCardStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  padding: '16px 18px',
  borderRadius: 20,
  border: '1px solid rgba(101, 74, 32, 0.12)',
  background: 'linear-gradient(180deg, #fffaf2 0%, #f8efe2 100%)',
  transition: 'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
}

const listItemCardActiveStyle: React.CSSProperties = {
  borderColor: 'rgba(201, 109, 31, 0.30)',
  boxShadow: '0 14px 28px rgba(201, 109, 31, 0.14)',
  transform: 'translateY(-1px)',
}

const listItemIconStyle: React.CSSProperties = {
  width: 38,
  height: 38,
  minWidth: 38,
  borderRadius: 14,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(180, 35, 24, 0.12)',
  color: '#b42318',
}

const listItemIconActiveStyle: React.CSSProperties = {
  background: 'rgba(201, 109, 31, 0.16)',
  color: '#8d4a17',
}

const inlineLinkButtonStyle: React.CSSProperties = {
  border: 'none',
  background: 'transparent',
  color: '#8d4a17',
  fontWeight: 800,
  cursor: 'pointer',
  padding: 0,
}

const mapContainerStyle: React.CSSProperties = {
  width: '100%',
  height: 680,
  borderRadius: 24,
  overflow: 'hidden',
  border: '1px solid rgba(101, 74, 32, 0.12)',
  background: '#f3f4f6',
  boxShadow: '0 16px 34px rgba(76, 57, 24, 0.10)',
}

const legendPanelStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
}

const legendChipStyle: React.CSSProperties = {
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

const legendMarkerShellStyle: React.CSSProperties = {
  width: 18,
  height: 18,
  borderRadius: 999,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(180, 35, 24, 0.12)',
}

const legendMarkerDotStyle: React.CSSProperties = {
  width: 10,
  height: 10,
  borderRadius: 999,
  background: '#b42318',
  display: 'inline-block',
}

const infoBannerStyle: React.CSSProperties = {
  padding: '14px 16px',
  borderRadius: 18,
  background: 'rgba(255, 252, 246, 0.92)',
  border: '1px solid rgba(101, 74, 32, 0.12)',
  color: '#5f6673',
  fontWeight: 700,
}
