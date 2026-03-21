import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Card, Text } from '../components'
import { useAuth } from '../contexts/AuthContext'
import { MapPicker } from '../components/ui/MapPicker'
import { InfractionApi, SectorInfracaoApi, TipoInfracaoApi, MaterialApi, ScrapyardApi, type ModelInfraction, type ModelSectorInfracao, type ModelTipoInfracao, type ModelMaterial, type ModelScrapyard } from '../services'

export default function InfractionDetailScreen() {
  const { getApiConfig, getAuthorizationHeaderValue, logout } = useAuth()
  const api = useMemo(() => new InfractionApi(getApiConfig()), [getApiConfig])
  const sectorApi = useMemo(() => new SectorInfracaoApi(getApiConfig()), [getApiConfig])
  const tipoApi = useMemo(() => new TipoInfracaoApi(getApiConfig()), [getApiConfig])
  const materialApi = useMemo(() => new MaterialApi(getApiConfig()), [getApiConfig])
  const scrapyardApi = useMemo(() => new ScrapyardApi(getApiConfig()), [getApiConfig])
  const authHeader = useMemo(() => getAuthorizationHeaderValue(), [getAuthorizationHeaderValue])

  const id = useMemo(() => window.location.pathname.split('/').filter(Boolean)[1] || '', [])

  const [item, setItem] = useState<ModelInfraction | null>(null)
  const [setores, setSetores] = useState<ModelSectorInfracao[]>([])
  const [tipos, setTipos] = useState<ModelTipoInfracao[]>([])
  const [materiais, setMateriais] = useState<ModelMaterial[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const apiBase = (import.meta as any).env?.VITE_API_BASE_URL || '/api'
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null)
  const [scrapyards, setScrapyards] = useState<ModelScrapyard[]>([])
  const [scrapyardsLoading, setScrapyardsLoading] = useState(false)
  const [scrapyardsError, setScrapyardsError] = useState<string | null>(null)
  const [mapFocus, setMapFocus] = useState<{ lat: number; lng: number } | null>(null)

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
      const [{ data: d1 }, { data: d2 }, { data: d3 }, { data: d4 }] = await Promise.all([
        api.privateInfractionsIdGet(id, authHeader),
        sectorApi.privateSectorInfracaoGet(authHeader, -1, undefined, 'name', 'asc'),
        tipoApi.privateTiposInfracaoGet(authHeader, -1, undefined, 'name', 'asc'),
        materialApi.privateMateriaisGet(authHeader, -1, undefined, 'name', 'asc'),
      ])
      if ([d1, d2, d3, d4].some((x) => isUnauthorizedBody(x))) {
        logout('Sessão expirada. Inicie sessão novamente.')
        return
      }
      setItem(d1 as any)
      setSetores((d2 as any).items ?? [])
      setTipos((d3 as any).items ?? [])
      setMateriais((d4 as any).items ?? [])
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 401 || isUnauthorizedBody(err?.response?.data)) {
        logout('Sessão expirada. Inicie sessão novamente.')
        return
      }
      setError(!status ? 'Sem ligação ao servidor.' : 'Falha a obter infração.')
    } finally {
      setLoading(false)
    }
  }, [api, authHeader, id, logout, materialApi, sectorApi, tipoApi])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    ;(async () => {
      if (!item || item.lat == null || item.long == null) return
      setScrapyardsLoading(true)
      setScrapyardsError(null)
      try {
        const { data } = await scrapyardApi.privateScrapyardsGet(authHeader, 1, 10, 'nome', 'asc', undefined, undefined, undefined, undefined, Number(item.lat), Number(item.long))
        setScrapyards(((data as any).items ?? []) as ModelScrapyard[])
      } catch (err: any) {
        const status = err?.response?.status
        setScrapyardsError(!status ? 'Sem ligação ao servidor.' : 'Falha a obter sucatarias próximas.')
      } finally {
        setScrapyardsLoading(false)
      }
    })()
  }, [authHeader, item?.lat, item?.long, scrapyardApi])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!lightbox) return
      if (e.key === 'Escape') setLightbox(null)
      if (e.key === 'ArrowRight') setLightbox((lb) => (lb ? { ...lb, index: (lb.index + 1) % lb.images.length } : lb))
      if (e.key === 'ArrowLeft') setLightbox((lb) => (lb ? { ...lb, index: (lb.index - 1 + lb.images.length) % lb.images.length } : lb))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox])

  const resolveNome = (arr: { id?: string; name?: string }[], currentId?: string) => {
    if (!currentId) return '-'
    const found = arr.find((x) => x.id === currentId)
    return found?.name || currentId
  }

  function voltar() {
    if (window.location.pathname !== '/infracoes') window.history.pushState({}, '', '/infracoes')
    window.dispatchEvent(new Event('locationchange'))
  }

  function editar() {
    if (id) {
      window.history.pushState({}, '', `/infracoes/${id}/editar`)
      window.dispatchEvent(new Event('locationchange'))
    }
  }

  const fotos = useMemo(() => {
    const csv = ((item as any)?.fotografias || '').trim()
    return csv ? csv.split(',').map((s: string) => s.trim()).filter(Boolean) : []
  }, [item?.fotografias])

  const materialLabel = useMemo(() => {
    if (!item) return '-'
    const materialId = (item as any).material_id
    const fromRelation = (item as any).material?.name
    if (fromRelation) return fromRelation
    if (materialId) {
      const material = materiais.find((m) => m.id === materialId)
      if (material?.name) return material.name
    }
    return (item as any).tipo_material || materialId || '-'
  }, [item, materiais])

  const scrapyardsWithDistance = useMemo(() => {
    if (!item || item.lat == null || item.long == null) {
      return scrapyards.map((s) => ({ scrapyard: s, distanceMeters: null as number | null }))
    }
    return scrapyards.map((s) => {
      if (s.lat == null || s.long == null) return { scrapyard: s, distanceMeters: null as number | null }
      return {
        scrapyard: s,
        distanceMeters: haversineMeters(Number(item.lat), Number(item.long), Number(s.lat), Number(s.long)),
      }
    }).sort((a, b) => {
      if (a.distanceMeters == null && b.distanceMeters == null) return 0
      if (a.distanceMeters == null) return 1
      if (b.distanceMeters == null) return -1
      return a.distanceMeters - b.distanceMeters
    })
  }, [item, scrapyards])

  const maxDistanceMeters = useMemo(() => {
    const distances = scrapyardsWithDistance.map((entry) => entry.distanceMeters).filter((value): value is number => value != null && !Number.isNaN(value))
    return distances.length ? Math.max(...distances) : null
  }, [scrapyardsWithDistance])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={screenHeroStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={screenEyebrowStyle}>Infrações</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <h2 style={{ margin: 0, fontSize: 30, lineHeight: 1.05, color: '#1f2937' }}>Detalhe da infração</h2>
            <p style={{ margin: 0, color: '#5f6673', lineHeight: 1.6 }}>
              Consulte o enquadramento da infração, os dados do material, a localização registada e as sucatarias próximas.
            </p>
          </div>
        </div>
        <div style={screenActionRowStyle}>
          <button type="button" onClick={voltar} style={detailSecondaryActionStyle}>
            <IconBack />
            <span>Voltar</span>
          </button>
          <button type="button" onClick={editar} style={detailPrimaryActionStyle}>
            <IconEdit />
            <span>Editar infração</span>
          </button>
        </div>
      </div>

      {loading && <div style={infoBannerStyle}>A carregar…</div>}
      {error && <div style={errorBannerStyle}>{error}</div>}

      {!loading && !error && item && (
        <>
          <Card title="Dados gerais">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={detailOverviewStyle}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0, flex: 1 }}>
                  <div style={detailOverviewEyebrowStyle}>Infração</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <strong style={{ fontSize: 28, lineHeight: 1.05, color: '#1f2937' }}>
                      {resolveNome(tipos, item.tipo_infracao_id)}
                    </strong>
                    <span style={{ color: '#5f6673', lineHeight: 1.6 }}>
                      {resolveNome(setores, item.sector_infracao_id)} · {materialLabel}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <StatusPill icon={<IconClock />} label="Criado em" value={formatDateTime(item.created_at)} />
                  <StatusPill icon={<IconMoney />} label="Valor" value={item.valor != null ? formatMoney(item.valor) : '-'} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.15fr .95fr .95fr', gap: 14 }}>
                <DetailSectionCard
                  icon={<IconAlert />}
                  title="Classificação"
                  description="Tipologia e enquadramento operacional da infração."
                  items={[
                    { label: 'Sector', value: resolveNome(setores, item.sector_infracao_id) },
                    { label: 'Tipo', value: resolveNome(tipos, item.tipo_infracao_id) },
                    { label: 'Material', value: materialLabel },
                  ]}
                />
                <DetailSectionCard
                  icon={<IconBox />}
                  title="Quantificação"
                  description="Medidas registadas no auto da infração."
                  items={[
                    { label: 'Quantidade', value: item.quantidade != null ? String(item.quantidade) : '-' },
                    { label: 'Valor', value: item.valor != null ? formatMoney(item.valor) : '-' },
                    { label: 'Fotografias', value: `${fotos.length} ficheiro${fotos.length === 1 ? '' : 's'}` },
                  ]}
                />
                <DetailSectionCard
                  icon={<IconPinpoint />}
                  title="Georreferenciação"
                  description="Ponto geográfico usado para localização e contexto."
                  items={[
                    { label: 'Latitude', value: item.lat != null ? String(item.lat) : '-' },
                    { label: 'Longitude', value: item.long != null ? String(item.long) : '-' },
                    { label: 'ID do registo', value: item.id || '-' },
                  ]}
                />
              </div>

              {fotos.length ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={detailTextPanelTitleStyle}>
                    <IconCamera />
                    <span>Fotografias</span>
                  </div>
                  <p style={{ margin: 0, color: '#5f6673', lineHeight: 1.6 }}>
                    Evidências visuais associadas à infração. Selecione uma miniatura para ampliar.
                  </p>
                  <div style={photoGridStyle}>
                    {fotos.map((img, index) => {
                      const url = `${apiBase}/public/images/${img}`
                      return (
                        <button
                          key={img}
                          type="button"
                          onClick={() => setLightbox({ images: fotos.map((f) => `${apiBase}/public/images/${f}`), index })}
                          style={photoButtonStyle}
                        >
                          <img src={url} alt={`Fotografia ${index + 1}`} style={photoImageStyle} />
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div style={infoBannerStyle}>Sem fotografias associadas a esta infração.</div>
              )}
            </div>
          </Card>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(360px, 1.4fr) minmax(280px, 1fr)', gap: 16, alignItems: 'stretch' }}>
            <Card title="Localização" subtitle="Posição geográfica da infração e entidades próximas no mapa." style={pairedDetailCardStyle}>
              {item.lat != null && item.long != null ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span style={mapInfoChipStyle}>Ponto base: infração</span>
                    <span style={mapInfoChipStyle}>Sucatarias próximas: {scrapyardsWithDistance.length}</span>
                    {mapFocus ? <span style={mapInfoChipStyle}>Foco ativo no mapa</span> : null}
                  </div>
                  <MapPicker
                    markerKind="infraction"
                    value={{ lat: Number(item.lat), lng: Number(item.long) }}
                    focusCenter={mapFocus ?? undefined}
                    onChange={() => {}}
                    height={360}
                    disabled
                    extraMarkers={scrapyardsWithDistance
                      .filter(({ scrapyard: s }) => s.lat != null && s.long != null)
                      .map(({ scrapyard: s, distanceMeters }) => ({
                        lat: Number(s.lat),
                        lng: Number(s.long),
                        title: s.nome || s.id || 'Sucataria',
                        color: colorForDistance(distanceMeters, maxDistanceMeters),
                        markerKind: 'scrapyard' as const,
                        infoHtml: `<div style=\"min-width:200px\"><div style=\"font-weight:700;color:#1f2937\">${(s.nome || s.id || 'Sucataria').toString().replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div><div style=\"color:#8d4a17;font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;margin-top:4px\">Sucataria próxima</div><div style=\"color:#5f6673;font-size:12px;margin-top:6px\">Distância: ${formatDistance(distanceMeters)}</div></div>`,
                      }))}
                  />
                  <div style={mapLegendPanelStyle}>
                    <span style={mapLegendChipStyle}>
                      <span style={{ width: 10, height: 10, borderRadius: 999, background: '#0f766e', display: 'inline-block' }} />
                      Infração
                    </span>
                    <span style={mapLegendChipStyle}>
                      <span style={{ width: 10, height: 10, borderRadius: 999, background: '#f97316', display: 'inline-block' }} />
                      Mais distante
                    </span>
                    <span style={mapLegendChipStyle}>
                      <span style={{ width: 10, height: 10, borderRadius: 999, background: '#dc2626', display: 'inline-block' }} />
                      Mais próxima
                    </span>
                  </div>
                </div>
              ) : (
                <div style={infoBannerStyle}>Sem coordenadas da infração.</div>
              )}
            </Card>

            <Card title="Sucatarias próximas" subtitle="Lista de entidades próximas ao ponto da infração." style={pairedDetailCardStyle}>
              <div style={nearbyPanelStyle}>
              {scrapyardsLoading ? (
                <div style={infoBannerStyle}>A carregar…</div>
              ) : scrapyardsError ? (
                <div style={errorBannerStyle}>{scrapyardsError}</div>
              ) : !scrapyards.length ? (
                <div style={infoBannerStyle}>Sem sucatarias próximas.</div>
              ) : (
                <>
                  <div style={nearbyListStyle}>
                    {scrapyardsWithDistance.map(({ scrapyard: s, distanceMeters }) => (
                      <button
                        key={s.id}
                        type="button"
                        style={contextCardButtonStyle}
                        onClick={() => {
                          if (s.lat != null && s.long != null) {
                            setMapFocus({ lat: Number(s.lat), lng: Number(s.long) })
                          }
                        }}
                      >
                        <div style={contextCardStyle}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                            <span style={contextCardIconStyle}>
                              <IconWarehouse />
                            </span>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                              <strong style={{ color: '#1f2937' }}>{s.nome || s.id}</strong>
                              <span style={{ color: '#8d4a17', fontSize: 12, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase' }}>
                                {formatDistance(distanceMeters)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                  <div style={nearbySummaryStyle}>
                    <span style={mapLegendChipStyle}>Total: {scrapyardsWithDistance.length}</span>
                    <span style={mapLegendChipStyle}>Mais próxima: {formatDistance(scrapyardsWithDistance[0]?.distanceMeters ?? null)}</span>
                    <span style={mapLegendChipStyle}>Mais distante: {formatDistance(scrapyardsWithDistance[scrapyardsWithDistance.length - 1]?.distanceMeters ?? null)}</span>
                  </div>
                </>
              )}
              </div>
            </Card>
          </div>
        </>
      )}

      {lightbox ? (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setLightbox(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(24, 31, 42, 0.76)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <img src={lightbox.images[lightbox.index]} alt={`Foto ${lightbox.index + 1}`} style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 22, boxShadow: '0 30px 70px rgba(0,0,0,.42)' }} />
            <button type="button" aria-label="Fechar" onClick={() => setLightbox(null)} style={lightboxCloseButtonStyle}>×</button>
            {lightbox.images.length > 1 ? (
              <>
                <button type="button" aria-label="Anterior" onClick={() => setLightbox((lb) => (lb ? { ...lb, index: (lb.index - 1 + lb.images.length) % lb.images.length } : lb))} style={lightboxNavLeftStyle}>‹</button>
                <button type="button" aria-label="Seguinte" onClick={() => setLightbox((lb) => (lb ? { ...lb, index: (lb.index + 1) % lb.images.length } : lb))} style={lightboxNavRightStyle}>›</button>
              </>
            ) : null}
          </div>
        </div>
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

function StatusPill({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <span style={statusPillStyle}>
      <span style={statusPillIconStyle}>{icon}</span>
      <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={statusPillLabelStyle}>{label}</span>
        <span style={statusPillValueStyle}>{value || '-'}</span>
      </span>
    </span>
  )
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div style={fieldCardStyle}>
      <div style={fieldLabelStyle}>{label}</div>
      <div style={fieldValueStyle}>{value || '-'}</div>
    </div>
  )
}

function formatDateTime(iso?: string) {
  if (!iso) return '-'
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return '-'
    return d.toLocaleString('pt-PT')
  } catch {
    return '-'
  }
}

function formatMoney(n?: number) {
  if (typeof n !== 'number' || Number.isNaN(n)) return '-'
  try {
    return `${n.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT`
  } catch {
    return `${n.toFixed(2)} MT`
  }
}

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (v: number) => (v * Math.PI) / 180
  const r = 6371000
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return r * c
}

function formatDistance(distanceMeters: number | null) {
  if (distanceMeters == null || Number.isNaN(distanceMeters)) return 'Distância indisponível'
  if (distanceMeters < 1000) return `${Math.round(distanceMeters)} m`
  return `${(distanceMeters / 1000).toFixed(2).replace('.', ',')} km`
}

function colorForDistance(distanceMeters: number | null, maxDistanceMeters: number | null) {
  if (distanceMeters == null || maxDistanceMeters == null || maxDistanceMeters <= 0) return '#f97316'
  const ratio = Math.max(0, Math.min(1, distanceMeters / maxDistanceMeters))
  const start = { r: 220, g: 38, b: 38 }
  const end = { r: 249, g: 115, b: 22 }
  const r = Math.round(start.r + (end.r - start.r) * ratio)
  const g = Math.round(start.g + (end.g - start.g) * ratio)
  const b = Math.round(start.b + (end.b - start.b) * ratio)
  return `rgb(${r}, ${g}, ${b})`
}

function IconBack() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconEdit() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 20L7.8 19.2L18.4 8.6C19.2 7.8 19.2 6.6 18.4 5.8L18.2 5.6C17.4 4.8 16.2 4.8 15.4 5.6L4.8 16.2L4 20Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.8 7.2L16.8 10.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconClock() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 8V12L14.8 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconMoney() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7.5C4 6.67 4.67 6 5.5 6H18.5C19.33 6 20 6.67 20 7.5V16.5C20 17.33 19.33 18 18.5 18H5.5C4.67 18 4 17.33 4 16.5V7.5Z" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="2.8" stroke="currentColor" strokeWidth="1.8" />
      <path d="M7 9H7.01" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M17 15H17.01" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}

function IconAlert() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 8V12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 16H12.01" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M10.3 4.8L3.5 16.4C2.8 17.6 3.67 19 5.05 19H18.95C20.33 19 21.2 17.6 20.5 16.4L13.7 4.8C13.01 3.62 10.99 3.62 10.3 4.8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  )
}

function IconBox() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3L19 7V17L12 21L5 17V7L12 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M5 7L12 11L19 7" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M12 11V21" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  )
}

function IconPinpoint() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 20C15.5 16.4 18 13.5 18 10.5C18 7.19 15.31 4.5 12 4.5C8.69 4.5 6 7.19 6 10.5C6 13.5 8.5 16.4 12 20Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="12" cy="10.5" r="2.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

function IconCamera() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 8.5C4 7.67 4.67 7 5.5 7H7.8L9.1 5.5H14.9L16.2 7H18.5C19.33 7 20 7.67 20 8.5V16.5C20 17.33 19.33 18 18.5 18H5.5C4.67 18 4 17.33 4 16.5V8.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="12" cy="12.5" r="3.2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

function IconWarehouse() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 10L12 4L20 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 9.5V19H18V9.5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9 19V13H15V19" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  )
}

const screenHeroStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'space-between',
  gap: 16,
  flexWrap: 'wrap',
  padding: 24,
  borderRadius: 28,
  background: 'linear-gradient(135deg, rgba(255, 249, 240, 0.98) 0%, rgba(247, 237, 222, 0.96) 100%)',
  border: '1px solid rgba(101, 74, 32, 0.12)',
  boxShadow: '0 24px 44px rgba(101, 74, 32, 0.08)',
}

const screenEyebrowStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  width: 'fit-content',
  minHeight: 30,
  padding: '0 12px',
  borderRadius: 999,
  background: 'rgba(168, 113, 51, 0.1)',
  color: '#8d4a17',
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: '.12em',
  textTransform: 'uppercase',
}

const screenActionRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap',
}

const detailSecondaryActionStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  minHeight: 46,
  padding: '0 18px',
  borderRadius: 16,
  border: '1px solid rgba(101, 74, 32, 0.16)',
  background: 'linear-gradient(180deg, #fffaf2 0%, #f6ecde 100%)',
  color: '#8d4a17',
  fontSize: 14,
  fontWeight: 800,
  boxShadow: '0 12px 24px rgba(76, 57, 24, 0.08)',
  cursor: 'pointer',
}

const detailPrimaryActionStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  minHeight: 46,
  padding: '0 18px',
  borderRadius: 16,
  border: '1px solid rgba(201, 109, 31, 0.18)',
  background: 'linear-gradient(135deg, #c96d1f 0%, #a85c1c 100%)',
  color: '#fff8ef',
  fontSize: 14,
  fontWeight: 800,
  letterSpacing: '.01em',
  boxShadow: '0 18px 34px rgba(201, 109, 31, 0.22)',
  cursor: 'pointer',
}

const infoBannerStyle: React.CSSProperties = {
  padding: '14px 16px',
  borderRadius: 18,
  background: 'rgba(255, 249, 240, 0.92)',
  border: '1px solid rgba(101, 74, 32, 0.12)',
  color: '#6b7280',
  fontWeight: 600,
}

const errorBannerStyle: React.CSSProperties = {
  padding: '14px 16px',
  borderRadius: 18,
  background: '#fff1f1',
  border: '1px solid rgba(200, 60, 60, 0.18)',
  color: '#991b1b',
  fontWeight: 700,
}

const detailOverviewStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 16,
  flexWrap: 'wrap',
  padding: 18,
  borderRadius: 22,
  background: 'linear-gradient(135deg, rgba(255, 249, 240, 0.98) 0%, rgba(247, 237, 222, 0.96) 100%)',
  border: '1px solid rgba(101, 74, 32, 0.12)',
}

const detailOverviewEyebrowStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  width: 'fit-content',
  minHeight: 28,
  padding: '0 10px',
  borderRadius: 999,
  background: 'rgba(168, 113, 51, 0.1)',
  color: '#8d4a17',
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: '.12em',
  textTransform: 'uppercase',
}

const statusPillStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 10,
  minHeight: 52,
  padding: '0 14px',
  borderRadius: 18,
  background: 'rgba(255,255,255,0.76)',
  border: '1px solid rgba(101, 74, 32, 0.10)',
}

const statusPillIconStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 30,
  height: 30,
  borderRadius: 12,
  background: 'rgba(168, 113, 51, 0.1)',
  color: '#8d4a17',
}

const statusPillLabelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: '.12em',
  textTransform: 'uppercase',
  color: '#8d4a17',
}

const statusPillValueStyle: React.CSSProperties = {
  color: '#1f2937',
  fontSize: 14,
}

const detailSectionCardStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
  padding: 16,
  borderRadius: 20,
  border: '1px solid rgba(101, 74, 32, 0.12)',
  background: 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(250,246,239,0.92) 100%)',
  boxShadow: '0 14px 28px rgba(101, 74, 32, 0.06)',
}

const detailSectionHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 10,
}

const detailSectionIconStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 34,
  height: 34,
  borderRadius: 12,
  background: 'rgba(168, 113, 51, 0.1)',
  color: '#8d4a17',
  flexShrink: 0,
}

const detailSectionItemStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
}

const detailSectionItemLabelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: '.08em',
  textTransform: 'uppercase',
  color: '#8d4a17',
}

const detailSectionItemValueStyle: React.CSSProperties = {
  color: '#1f2937',
  lineHeight: 1.45,
}

const detailTextPanelTitleStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 10,
  color: '#1f2937',
  fontWeight: 800,
}

const photoGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(104px, 132px))',
  gap: 10,
}

const photoButtonStyle: React.CSSProperties = {
  padding: 0,
  border: '1px solid rgba(101, 74, 32, 0.12)',
  borderRadius: 18,
  overflow: 'hidden',
  cursor: 'zoom-in',
  background: 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(250,246,239,0.92) 100%)',
  boxShadow: '0 14px 28px rgba(101, 74, 32, 0.06)',
}

const photoImageStyle: React.CSSProperties = {
  width: '100%',
  height: 104,
  objectFit: 'cover',
  display: 'block',
}

const fieldCardStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  minHeight: 72,
  padding: '14px 16px',
  borderRadius: 18,
  background: 'linear-gradient(180deg, rgba(255,255,255,0.94) 0%, rgba(250,246,239,0.92) 100%)',
  border: '1px solid rgba(101, 74, 32, 0.12)',
}

const fieldLabelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: '.1em',
  textTransform: 'uppercase',
  color: '#8d4a17',
}

const fieldValueStyle: React.CSSProperties = {
  color: '#1f2937',
  fontWeight: 700,
  lineHeight: 1.45,
}

const nearbyListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  flex: 1,
  minHeight: 0,
  maxHeight: 470,
  overflowY: 'auto',
  paddingRight: 4,
}

const nearbyPanelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: 550,
  minHeight: 550,
  maxHeight: 550,
  overflow: 'hidden',
  gap: 12,
  paddingBottom: 8,
}

const nearbySummaryStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  marginTop: 'auto',
  paddingTop: 2,
}

const mapInfoChipStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  minHeight: 32,
  padding: '0 12px',
  borderRadius: 999,
  background: 'linear-gradient(180deg, #faf1e3 0%, #f5ead9 100%)',
  border: '1px solid rgba(101, 74, 32, 0.14)',
  color: '#5f6673',
  fontSize: 12,
  fontWeight: 700,
}

const mapLegendPanelStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
  padding: '10px 12px',
  borderRadius: 18,
  background: 'rgba(255, 249, 240, 0.92)',
  border: '1px solid rgba(101, 74, 32, 0.12)',
}

const mapLegendChipStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  minHeight: 30,
  padding: '0 12px',
  borderRadius: 999,
  background: 'rgba(255,255,255,0.82)',
  border: '1px solid rgba(101, 74, 32, 0.12)',
  color: '#5f6673',
  fontSize: 12,
  fontWeight: 700,
}

const pairedDetailCardStyle: React.CSSProperties = {
  height: 670,
}

const contextCardStyle: React.CSSProperties = {
  border: '1px solid rgba(101, 74, 32, 0.12)',
  borderRadius: 20,
  padding: 14,
  background: 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(250,246,239,0.92) 100%)',
  boxShadow: '0 14px 28px rgba(101, 74, 32, 0.06)',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  textAlign: 'left',
}

const contextCardButtonStyle: React.CSSProperties = {
  padding: 0,
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
}

const contextCardIconStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 36,
  height: 36,
  borderRadius: 12,
  background: 'rgba(168, 113, 51, 0.1)',
  color: '#8d4a17',
  flexShrink: 0,
}

const lightboxCloseButtonStyle: React.CSSProperties = {
  position: 'absolute',
  top: -14,
  right: -14,
  width: 40,
  height: 40,
  borderRadius: 999,
  border: 'none',
  background: '#111827',
  color: '#fff',
  boxShadow: '0 12px 24px rgba(0,0,0,.28)',
  cursor: 'pointer',
  fontSize: 24,
  lineHeight: 1,
}

const lightboxNavButtonBaseStyle: React.CSSProperties = {
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  width: 42,
  height: 42,
  borderRadius: 14,
  border: 'none',
  background: '#111827',
  color: '#fff',
  boxShadow: '0 12px 24px rgba(0,0,0,.28)',
  cursor: 'pointer',
  fontSize: 28,
  lineHeight: 1,
}

const lightboxNavLeftStyle: React.CSSProperties = {
  ...lightboxNavButtonBaseStyle,
  left: -56,
}

const lightboxNavRightStyle: React.CSSProperties = {
  ...lightboxNavButtonBaseStyle,
  right: -56,
}
