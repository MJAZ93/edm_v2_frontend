import React, { useEffect, useRef, useState } from 'react'

type LatLng = { lat: number; lng: number }
type MarkerKind = 'default' | 'occurrence' | 'scrapyard' | 'infraction' | 'client'

type Props = {
  value?: Partial<LatLng>
  focusCenter?: Partial<LatLng>
  onChange?: (pos: LatLng) => void
  height?: number
  zoom?: number
  apiKey?: string
  disabled?: boolean
  markerKind?: MarkerKind
  extraMarkers?: Array<{ lat: number; lng: number; title?: string; color?: string; infoHtml?: string; markerKind?: MarkerKind }>
}

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

export function MapPicker({ value, focusCenter, onChange, height = 260, zoom = 8, apiKey, disabled = false, markerKind = 'default', extraMarkers = [] }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const extraMarkersRef = useRef<any[]>([])
  const infoWindowRef = useRef<any>(null)
  const [error, setError] = useState<string | null>(null)

  const effectiveKey = apiKey || (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY
  const center: LatLng = {
    lat: typeof value?.lat === 'number' ? (value!.lat as number) : -25.965,
    lng: typeof value?.lng === 'number' ? (value!.lng as number) : 32.571
  }

  useEffect(() => {
    let cancelled = false
    async function setup() {
      setError(null)
      if (!effectiveKey) {
        setError('Google Maps não está configurado (VITE_GOOGLE_MAPS_API_KEY ausente).')
        return
      }
      try {
        await injectScriptOnce(effectiveKey)
        if (cancelled) return
        const gmaps = (window as any).google.maps
        const map = new gmaps.Map(containerRef.current!, {
          center,
          zoom,
          disableDefaultUI: false,
          styles: disabled ? DETAIL_MAP_STYLES : undefined,
        })
        mapRef.current = map
        const marker = new gmaps.Marker({
          position: center,
          map,
          draggable: !disabled,
          icon: buildPinIcon(gmaps, markerKind, '#0f766e', '#ffffff', 1.5),
          zIndex: 999,
        })
        markerRef.current = marker
        // Add extra markers (read-only visual)
        extraMarkersRef.current.forEach((m) => m.setMap(null))
        // Prettier pin icon for extra markers (e.g., sucatarias)
        extraMarkersRef.current = (extraMarkers || []).map((m) => {
          const marker = new gmaps.Marker({
            position: { lat: m.lat, lng: m.lng },
            title: m.title,
            map,
            icon: buildPinIcon(gmaps, m.markerKind || 'default', m.color || '#ea580c', '#7c2d12', 1.2),
          })
          marker.addListener('click', () => {
            try { infoWindowRef.current?.close() } catch {}
            infoWindowRef.current = new gmaps.InfoWindow({ content: m.infoHtml || `<div><strong>${m.title || ''}</strong></div>` })
            infoWindowRef.current.open(map, marker)
          })
          return marker
        })

        map.addListener('click', (e: any) => {
          if (disabled) return
          const pos = { lat: e.latLng.lat(), lng: e.latLng.lng() }
          marker.setPosition(pos)
          onChange?.(pos)
        })
        marker.addListener('dragend', () => {
          if (disabled) return
          const pos = marker.getPosition()
          const next = { lat: pos.lat(), lng: pos.lng() }
          onChange?.(next)
        })
        // Fit bounds to include markers apenas quando há posição inicial explícita ou marcadores extra
        try {
          const hasInitialPos = typeof value?.lat === 'number' && typeof value?.lng === 'number'
          const hasExtras = (extraMarkersRef.current || []).length > 0
          if (hasInitialPos || hasExtras) {
            const bounds = new gmaps.LatLngBounds()
            const pos = marker.getPosition()
            if (pos) bounds.extend(pos)
            extraMarkersRef.current.forEach((m) => { const p = m.getPosition(); if (p) bounds.extend(p) })
            if (!bounds.isEmpty()) map.fitBounds(bounds)
          }
        } catch {}
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Falha ao inicializar o mapa.')
      }
    }
    setup()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Atualiza marker/centro quando value muda externamente
  useEffect(() => {
    const gmaps = (window as any).google?.maps
    if (!gmaps || !mapRef.current || !markerRef.current) return
    const lat = typeof value?.lat === 'number' ? value!.lat : undefined
    const lng = typeof value?.lng === 'number' ? value!.lng : undefined
    if (typeof lat === 'number' && typeof lng === 'number') {
      const pos = { lat, lng }
      markerRef.current.setPosition(pos)
      mapRef.current.setCenter(pos)
    }
  }, [value?.lat, value?.lng])

  useEffect(() => {
    const gmaps = (window as any).google?.maps
    if (!gmaps || !mapRef.current) return
    const lat = typeof focusCenter?.lat === 'number' ? focusCenter.lat : undefined
    const lng = typeof focusCenter?.lng === 'number' ? focusCenter.lng : undefined
    if (typeof lat === 'number' && typeof lng === 'number') {
      const pos = { lat, lng }
      mapRef.current.panTo(pos)
      if (disabled) {
        try { mapRef.current.setZoom(Math.max(Number(mapRef.current.getZoom?.() || zoom), 15)) } catch {}
      }
    }
  }, [focusCenter?.lat, focusCenter?.lng, disabled, zoom])

  // Atualiza extra markers quando prop muda
  useEffect(() => {
    const gmaps = (window as any).google?.maps
    if (!gmaps || !mapRef.current) return
    // cleanup existing
    extraMarkersRef.current.forEach((m) => m.setMap(null))
    const gmap = mapRef.current
    extraMarkersRef.current = (extraMarkers || []).map((m) => {
      const marker = new gmaps.Marker({
        position: { lat: m.lat, lng: m.lng },
        title: m.title,
        map: gmap,
        icon: buildPinIcon(gmaps, m.markerKind || 'default', m.color || '#ea580c', '#7c2d12', 1.2),
      })
      marker.addListener('click', () => {
        try { infoWindowRef.current?.close() } catch {}
        infoWindowRef.current = new gmaps.InfoWindow({ content: m.infoHtml || `<div><strong>${m.title || ''}</strong></div>` })
        infoWindowRef.current.open(gmap, marker)
      })
      return marker
    })
    // try to fit bounds when disabled (view mode)
    try {
      if (disabled) {
        const bounds = new gmaps.LatLngBounds()
        const pos = markerRef.current?.getPosition()
        if (pos) bounds.extend(pos)
        extraMarkersRef.current.forEach((m) => { const p = m.getPosition(); if (p) bounds.extend(p) })
        if (!bounds.isEmpty()) mapRef.current.fitBounds(bounds)
      }
    } catch {}
  }, [extraMarkers.map((m) => `${m.lat},${m.lng},${m.markerKind || 'default'}`).join('|'), disabled])

  return (
    <div>
      <div ref={containerRef} style={{ width: '100%', height, borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(101, 74, 32, 0.12)', background: 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(250,246,239,0.92) 100%)', boxShadow: '0 14px 28px rgba(101, 74, 32, 0.06)' }} />
      {error ? <div style={{ color: '#991b1b', background: '#fee2e2', padding: 8, borderRadius: 8, marginTop: 8 }}>{error}</div> : null}
      {!error && !disabled && (
        <div style={{ color: '#6b7280', marginTop: 6, fontSize: 12 }}>
          Clique no mapa para definir a localização. Pode arrastar o marcador.
        </div>
      )}
    </div>
  )
}

function buildPinIcon(gmaps: any, kind: MarkerKind, fillColor: string, strokeColor: string, scale: number) {
  const glyph = markerGlyph(kind, strokeColor)
  const svg = `
    <svg width="36" height="44" viewBox="0 0 36 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 2C10.3 2 4 8.3 4 16C4 26.2 15.5 35.5 17.1 36.8C17.6 37.2 18.4 37.2 18.9 36.8C20.5 35.5 32 26.2 32 16C32 8.3 25.7 2 18 2Z" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2"/>
      ${glyph}
    </svg>
  `.trim()
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new gmaps.Size(36 * scale, 44 * scale),
    anchor: new gmaps.Point(18 * scale, 37 * scale),
  }
}

function markerGlyph(kind: MarkerKind, color: string) {
  switch (kind) {
    case 'occurrence':
      return `<path d="M18 10L23 19H13L18 10Z" stroke="${color}" stroke-width="1.8" stroke-linejoin="round"/><path d="M18 13.8V16.8" stroke="${color}" stroke-width="1.8" stroke-linecap="round"/><circle cx="18" cy="18.6" r="0.9" fill="${color}"/>`
    case 'scrapyard':
      return `<path d="M11 21V16.8L17.2 13L23 15.6V21" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M23 21V12L27 9.8V21" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 17.8H14.01M17.6 17.8H17.61M21.2 17.8H21.21" stroke="${color}" stroke-width="2.4" stroke-linecap="round"/>`
    case 'infraction':
      return `<path d="M12 20L24 12" stroke="${color}" stroke-width="1.8" stroke-linecap="round"/><path d="M11 12H25" stroke="${color}" stroke-width="1.8" stroke-linecap="round"/><path d="M14 12L12.2 8.8" stroke="${color}" stroke-width="1.8" stroke-linecap="round"/><path d="M22 12L23.8 8.8" stroke="${color}" stroke-width="1.8" stroke-linecap="round"/><path d="M18 12V21" stroke="${color}" stroke-width="1.8" stroke-linecap="round"/>`
    case 'client':
      return `<path d="M11 21V12.5L18 9L25 12.5V21" stroke="${color}" stroke-width="1.8" stroke-linejoin="round"/><path d="M15 15H15.01M21 15H21.01M15 18.5H15.01M21 18.5H21.01" stroke="${color}" stroke-width="2.4" stroke-linecap="round"/><path d="M17 21V17.5H19V21" stroke="${color}" stroke-width="1.8" stroke-linejoin="round"/>`
    default:
      return `<circle cx="18" cy="16" r="4.5" stroke="${color}" stroke-width="2"/><circle cx="18" cy="16" r="1.2" fill="${color}"/>`
  }
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
