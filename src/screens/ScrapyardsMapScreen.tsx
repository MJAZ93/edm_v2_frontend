import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Card, Heading, Button } from '../components'
import { PRIMARY_COLOR } from '../utils/theme'
import { ScrapyardApi, ASCApi, type ModelScrapyard, type ModelASC } from '../services'
import { useAuth } from '../contexts/AuthContext'

declare global {
  interface Window {
    __gmapsLoadingPromise?: Promise<void>
  }
}

function injectScriptOnce(apiKey: string): Promise<void> {
  if ((window as any).google && (window as any).google.maps) return Promise.resolve()
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
  const [items, setItems] = useState<ModelScrapyard[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ascOptions, setAscOptions] = useState<Array<{ id: string; label: string }>>([])
  const [selectedAsc, setSelectedAsc] = useState<string>('')
  const [search, setSearch] = useState('')

  const api = useMemo(() => new ScrapyardApi(getApiConfig()), [getApiConfig])
  const authHeader = useMemo(() => getAuthorizationHeaderValue(), [getAuthorizationHeaderValue])

  const mapRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const markersRef = useRef<any[]>([])

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
      // page = -1 para obter todos; filtra por ASC quando selecionado
      const { data } = await api.privateScrapyardsGet(
        authHeader,
        -1,
        undefined,
        undefined,
        undefined,
        selectedAsc || undefined
      )
      if (isUnauthorizedBody(data)) {
        logout('Sessão expirada. Inicie sessão novamente.')
        return
      }
      setItems(data.items ?? [])
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
  }, [api, authHeader, selectedAsc])

  useEffect(() => { load() }, [load])

  // Carregar lista de ASCs para filtro
  useEffect(() => {
    let cancelled = false
    async function loadASCs() {
      try {
        const apiAsc = new ASCApi(getApiConfig())
        const { data } = await apiAsc.privateAscsGet(authHeader, -1, undefined, 'name', 'asc')
        const list = (data.items ?? []) as ModelASC[]
        if (!cancelled) setAscOptions(list.filter((i) => i.id && i.name).map((i) => ({ id: String(i.id), label: i.name! })))
      } catch {
        if (!cancelled) setAscOptions([])
      }
    }
    loadASCs()
    return () => { cancelled = true }
  }, [getApiConfig, authHeader])

  useEffect(() => {
    async function initMap() {
      const key = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY
      if (!key) {
        setError('Google Maps não está configurado (VITE_GOOGLE_MAPS_API_KEY ausente).')
        return
      }
      try {
        await injectScriptOnce(key)
      } catch (e: any) {
        setError(e?.message || 'Falha ao inicializar o mapa.')
        return
      }

      const gmaps = (window as any).google.maps
      const center = { lat: -25.965, lng: 32.571 }
      const map = new gmaps.Map(containerRef.current!, { center, zoom: 7, disableDefaultUI: false })
      mapRef.current = map
    }
    initMap()
  }, [])

  useEffect(() => {
    const gmaps = (window as any).google?.maps
    if (!gmaps || !mapRef.current) return

    // limpa marcadores antigos
    markersRef.current.forEach((m) => m.setMap(null))
    markersRef.current = []

    const valid = (items || [])
      .filter((s) => typeof s.lat === 'number' && typeof (s as any).long === 'number')
      .filter((s) => !search.trim() || (s.nome || '').toLowerCase().includes(search.toLowerCase()))
    // adiciona marcadores
    valid.forEach((s) => {
      const lat = s.lat as number
      const lng = (s as any).long as number
      const pos = { lat, lng }
      const marker = new gmaps.Marker({ position: pos, map: mapRef.current, title: s.nome || '' })
      const materiais = Array.isArray(s.materiais) && s.materiais.length
        ? (s.materiais.map((m: any) => m?.name).filter(Boolean).join(', '))
        : '—'
      const html = `<div style="max-width:260px">
        <strong>${s.nome || 'Sem nome'}</strong><br/>
        ASC: ${(s as any).asc_name || '—'}<br/>
        Materiais: ${materiais}
      </div>`
      const info = new gmaps.InfoWindow({ content: html })
      marker.addListener('click', () => info.open({ anchor: marker, map: mapRef.current }))
      markersRef.current.push(marker)
    })

    // centro no centróide das sucatarias (sem ajustar o zoom)
    if (valid.length > 0) {
      const sum = valid.reduce((acc, s) => {
        acc.lat += (s.lat as number)
        acc.lng += ((s as any).long as number)
        return acc
      }, { lat: 0, lng: 0 })
      const center = { lat: sum.lat / valid.length, lng: sum.lng / valid.length }
      mapRef.current.setCenter(center)
      // zoom adaptativo simples: menos itens -> mais zoom
      const zoom = valid.length <= 3 ? 12 : valid.length <= 10 ? 11 : 10
      mapRef.current.setZoom(zoom)
    }
  }, [items, search])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Heading level={2}>Sucatarias · Mapa</Heading>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            variant="secondary"
            onClick={() => {
              if (window.location.pathname !== '/sucatarias') window.history.pushState({}, '', '/sucatarias')
              window.dispatchEvent(new Event('popstate'))
              window.dispatchEvent(new Event('locationchange'))
            }}
          >
            Voltar à lista
          </Button>
        </div>
      </div>

      {error ? <div style={{ background: '#fef3c7', color: '#92400e', padding: 10, borderRadius: 8 }}>{error}</div> : null}

      <Card>
        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 13, color: '#374151' }}>ASC</span>
              <select
                value={selectedAsc}
                onChange={(e) => setSelectedAsc(e.target.value)}
                style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db', background: '#fff' }}
              >
                <option value="">— Todas —</option>
                {ascOptions.map((o) => (
                  <option key={o.id} value={o.id}>{o.label}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 13, color: '#374151' }}>Pesquisar</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pesquisar por nome"
                style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db' }}
              />
            </div>

            <div style={{ height: 520, overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: 12, background: '#fff' }}>
              {(items || [])
                .filter((s) => !search.trim() || (s.nome || '').toLowerCase().includes(search.toLowerCase()))
                .map((s) => {
                  const names = Array.isArray(s.materiais) ? s.materiais.map((m: any) => m?.name).filter(Boolean) as string[] : []
                  const summary = names.length === 0 ? '—' : names.join(', ')
                  const display = summary.length > 90 ? summary.slice(0, 87) + '…' : summary
                  return (
                    <button
                      key={s.id}
                      onClick={() => {
                        const gmaps = (window as any).google?.maps
                        if (!gmaps || !mapRef.current) return
                        const lat = s.lat as number | undefined
                        const lng = (s as any).long as number | undefined
                        if (typeof lat === 'number' && typeof lng === 'number') {
                          mapRef.current.setCenter({ lat, lng })
                          mapRef.current.setZoom(13)
                        }
                      }}
                      title={summary}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        background: '#fff',
                        border: 'none',
                        borderBottom: '1px solid #f3f4f6',
                        padding: '12px 12px',
                        cursor: 'pointer',
                        display: 'grid',
                        gridTemplateColumns: '20px 1fr',
                        gap: 10
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span aria-hidden style={{ fontSize: 14 }}>📍</span>
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{s.nome || 'Sem nome'}</div>
                        <div style={{ color: '#6b7280', fontSize: 12, marginTop: 2 }}>ASC: {(s as any).asc_name || '—'} · Nível: {s.nivel_confianca ?? '—'}</div>
                        <div style={{ color: '#374151', fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 4 }}>
                          {display}
                        </div>
                        {names.length > 0 && (
                          <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {names.slice(0, 3).map((n) => (
                              <span key={n} style={{ background: '#eff6ff', color: '#1d4ed8', border: `1px solid #dbeafe`, padding: '2px 8px', borderRadius: 999, fontSize: 11 }}>{n}</span>
                            ))}
                            {names.length > 3 && <span style={{ color: '#6b7280', fontSize: 11 }}>+{names.length - 3}</span>}
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}
              {(!items || items.length === 0) && (
                <div style={{ padding: 12, color: '#6b7280' }}>Sem sucatarias.</div>
              )}
            </div>
          </div>

          <div>
            <div ref={containerRef} style={{ width: '100%', height: 520, borderRadius: 12, overflow: 'hidden', border: '1px solid #e5e7eb', background: '#f3f4f6' }} />
            <div style={{ color: '#6b7280', marginTop: 6, fontSize: 12 }}>Clique num marcador para ver detalhes.</div>
          </div>
        </div>
      </Card>
    </div>
  )
}
