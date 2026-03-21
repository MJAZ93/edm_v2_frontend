import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Card } from '../components'
import { MapPicker } from '../components/ui/MapPicker'
import { useAuth } from '../contexts/AuthContext'
import { OccurrenceApi, ScrapyardApi, type ModelOccurrence, type ModelScrapyard } from '../services'

export default function ScrapyardDetailScreen() {
  const { getApiConfig, getAuthorizationHeaderValue, logout } = useAuth()
  const scrapyardApi = useMemo(() => new ScrapyardApi(getApiConfig()), [getApiConfig])
  const occurrenceApi = useMemo(() => new OccurrenceApi(getApiConfig()), [getApiConfig])
  const authHeader = useMemo(() => getAuthorizationHeaderValue(), [getAuthorizationHeaderValue])

  const id = useMemo(() => window.location.pathname.split('/').filter(Boolean)[1] || '', [])

  const [item, setItem] = useState<ModelScrapyard | null>(null)
  const [nearOccurrences, setNearOccurrences] = useState<ModelOccurrence[]>([])
  const [nearScrapyards, setNearScrapyards] = useState<ModelScrapyard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [occLoading, setOccLoading] = useState(false)
  const [occError, setOccError] = useState<string | null>(null)
  const [nearScrapyardsLoading, setNearScrapyardsLoading] = useState(false)

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
      const { data } = await scrapyardApi.privateScrapyardsIdGet(id, authHeader)
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
      setError(!status ? 'Sem ligação ao servidor.' : status >= 500 ? 'Erro do servidor ao carregar sucataria.' : 'Falha a obter sucataria.')
    } finally {
      setLoading(false)
    }
  }, [authHeader, id, logout, scrapyardApi])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    ;(async () => {
      if (!item || item.lat == null || item.long == null) return
      setOccLoading(true)
      setOccError(null)
      try {
        const { data } = await occurrenceApi.privateOccurrencesGet(
          authHeader,
          1,
          10,
          'created_at',
          'desc',
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          Number(item.lat),
          Number(item.long)
        )
        if (isUnauthorizedBody(data)) {
          logout('Sessão expirada. Inicie sessão novamente.')
          return
        }
        setNearOccurrences(((data as any).items ?? []) as ModelOccurrence[])
      } catch (err: any) {
        const status = err?.response?.status
        if (status === 401 || isUnauthorizedBody(err?.response?.data)) {
          logout('Sessão expirada. Inicie sessão novamente.')
          return
        }
        setOccError(!status ? 'Sem ligação ao servidor.' : 'Falha a obter ocorrências próximas.')
      } finally {
        setOccLoading(false)
      }
    })()
  }, [authHeader, item?.lat, item?.long, logout, occurrenceApi])

  useEffect(() => {
    ;(async () => {
      if (!item || item.lat == null || item.long == null) return
      setNearScrapyardsLoading(true)
      try {
        const { data } = await scrapyardApi.privateScrapyardsGet(
          authHeader,
          1,
          10,
          'nome',
          'asc',
          undefined,
          undefined,
          undefined,
          undefined,
          Number(item.lat),
          Number(item.long)
        )
        if (isUnauthorizedBody(data)) {
          logout('Sessão expirada. Inicie sessão novamente.')
          return
        }
        setNearScrapyards((((data as any).items ?? []) as ModelScrapyard[]).filter((candidate) => candidate.id !== item.id))
      } catch {
        setNearScrapyards([])
      } finally {
        setNearScrapyardsLoading(false)
      }
    })()
  }, [authHeader, item?.id, item?.lat, item?.long, logout, scrapyardApi])

  function voltar() {
    if (window.location.pathname !== '/sucatarias') window.history.pushState({}, '', '/sucatarias')
    window.dispatchEvent(new Event('locationchange'))
  }

  function openOccurrenceDetails(occId?: string) {
    if (!occId) return
    window.history.pushState({}, '', `/ocorrencias/${occId}`)
    window.dispatchEvent(new Event('locationchange'))
  }

  const materialNames = useMemo(() => {
    if (!item?.materiais?.length) return []
    return item.materiais.map((material) => material.name || material.id).filter(Boolean) as string[]
  }, [item?.materiais])

  const nearOccurrencesWithDistance = useMemo(() => {
    if (!item || item.lat == null || item.long == null) {
      return nearOccurrences.map((occurrence) => ({ occurrence, distanceMeters: null as number | null }))
    }
    return nearOccurrences.map((occurrence) => {
      if (occurrence.lat == null || occurrence.long == null) {
        return { occurrence, distanceMeters: null as number | null }
      }
      return {
        occurrence,
        distanceMeters: haversineMeters(Number(item.lat), Number(item.long), Number(occurrence.lat), Number(occurrence.long)),
      }
    })
  }, [item, nearOccurrences])

  const nearScrapyardsWithDistance = useMemo(() => {
    if (!item || item.lat == null || item.long == null) {
      return nearScrapyards.map((scrapyard) => ({ scrapyard, distanceMeters: null as number | null }))
    }
    return nearScrapyards.map((scrapyard) => {
      if (scrapyard.lat == null || scrapyard.long == null) {
        return { scrapyard, distanceMeters: null as number | null }
      }
      return {
        scrapyard,
        distanceMeters: haversineMeters(Number(item.lat), Number(item.long), Number(scrapyard.lat), Number(scrapyard.long)),
      }
    }).sort((a, b) => {
      if (a.distanceMeters == null && b.distanceMeters == null) return 0
      if (a.distanceMeters == null) return 1
      if (b.distanceMeters == null) return -1
      return a.distanceMeters - b.distanceMeters
    })
  }, [item, nearScrapyards])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={screenHeroStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={screenEyebrowStyle}>Sucatarias</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <h2 style={{ margin: 0, fontSize: 30, lineHeight: 1.05, color: '#1f2937' }}>Detalhe da sucataria</h2>
            <p style={{ margin: 0, color: '#5f6673', lineHeight: 1.6 }}>
              Consulte os dados da sucataria, os materiais associados, a localização no mapa e as ocorrências próximas.
            </p>
          </div>
        </div>
        <div style={screenActionRowStyle}>
          <button type="button" onClick={voltar} style={detailSecondaryActionStyle}>
            <IconBack />
            <span>Voltar</span>
          </button>
        </div>
      </div>

      {loading ? <div style={infoBannerStyle}>A carregar…</div> : null}
      {error ? <div style={errorBannerStyle}>{error}</div> : null}

      {!loading && !error && item ? (
        <>
          <Card title="Dados gerais">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={detailOverviewStyle}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0, flex: 1 }}>
                  <div style={detailOverviewEyebrowStyle}>Sucataria</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <strong style={{ fontSize: 28, lineHeight: 1.05, color: '#1f2937' }}>
                      {item.nome || item.id || '-'}
                    </strong>
                    <span style={{ color: '#5f6673', lineHeight: 1.6 }}>
                      {item.asc_name || item.asc_id || 'ASC não indicada'} · {materialNames.length} material{materialNames.length === 1 ? '' : 'ais'} associado{materialNames.length === 1 ? '' : 's'}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <StatusPill icon={<IconClock />} label="Criada em" value={formatDateTime(item.created_at)} />
                  <StatusPill icon={<IconShield />} label="Desconfiança" value={formatPercent(item.nivel_confianca)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                <DetailSectionCard
                  icon={<IconFactory />}
                  iconStyle={scrapyardSectionIconStyle}
                  title="Enquadramento"
                  description="Informação base da sucataria e da ASC associada."
                  items={[
                    { label: 'Nome', value: item.nome || item.id || '-' },
                    { label: 'ASC', value: item.asc_name || item.asc_id || '-' },
                    { label: 'ID do registo', value: item.id || '-' },
                  ]}
                />
                <DetailSectionCard
                  icon={<IconPinpoint />}
                  title="Georreferenciação"
                  description="Ponto geográfico usado para mapa e deteção de proximidade."
                  items={[
                    { label: 'Latitude', value: item.lat != null ? String(item.lat) : '-' },
                    { label: 'Longitude', value: item.long != null ? String(item.long) : '-' },
                    { label: 'Criada em', value: formatDateTime(item.created_at) },
                  ]}
                />
                <DetailSectionCard
                  icon={<IconBox />}
                  title="Materiais"
                  description="Materiais associados à leitura operacional da sucataria."
                  items={[
                    { label: 'Total', value: String(materialNames.length) },
                    { label: 'Principal', value: materialNames[0] || '-' },
                    { label: 'Desconfiança', value: formatPercent(item.nivel_confianca) },
                  ]}
                />
              </div>
            </div>
          </Card>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(360px, 1.4fr) minmax(320px, 1fr)', gap: 16, alignItems: 'stretch' }}>
            <Card title="Localização" subtitle="Posição geográfica da sucataria e ocorrências próximas no mapa." style={pairedDetailCardStyle}>
              {item.lat != null && item.long != null ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span style={summaryChipStyle}>Ponto base: sucataria</span>
                  <span style={summaryChipStyle}>Ocorrências próximas: {nearOccurrences.length}</span>
                  <span style={summaryChipStyle}>Sucatarias próximas: {nearScrapyardsLoading ? '…' : nearScrapyardsWithDistance.length}</span>
                </div>
                <MapPicker
                  markerKind="scrapyard"
                  value={{ lat: Number(item.lat), lng: Number(item.long) }}
                  onChange={() => {}}
                  height={360}
                  disabled
                  extraMarkers={[
                    ...nearOccurrencesWithDistance
                      .filter(({ occurrence }) => occurrence.lat != null && occurrence.long != null)
                      .map(({ occurrence, distanceMeters }) => ({
                        lat: Number(occurrence.lat),
                        lng: Number(occurrence.long),
                        title: (occurrence.local || occurrence.id || 'Ocorrência') as string,
                        markerKind: 'infraction' as const,
                        infoHtml: `<div style=\"min-width:190px\"><div style=\"font-weight:700;color:#1f2937\">${String(occurrence.local || occurrence.id || 'Ocorrência').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div><div style=\"color:#5f6673;font-size:12px;margin-top:6px\">Data: ${formatDateTime(occurrence.data_facto)}</div><div style=\"color:#5f6673;font-size:12px;margin-top:4px\">Distância: ${formatDistance(distanceMeters)}</div></div>`,
                      })),
                    ...nearScrapyardsWithDistance
                      .filter(({ scrapyard }) => scrapyard.lat != null && scrapyard.long != null)
                      .map(({ scrapyard, distanceMeters }) => ({
                        lat: Number(scrapyard.lat),
                        lng: Number(scrapyard.long),
                        title: (scrapyard.nome || scrapyard.id || 'Sucataria') as string,
                        markerKind: 'scrapyard' as const,
                        color: '#8fb3f4',
                        infoHtml: `<div style=\"min-width:190px\"><div style=\"font-weight:700;color:#1f2937\">${String(scrapyard.nome || scrapyard.id || 'Sucataria').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div><div style=\"color:#3056a6;font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;margin-top:4px\">Sucataria próxima</div><div style=\"color:#5f6673;font-size:12px;margin-top:6px\">Distância: ${formatDistance(distanceMeters)}</div></div>`,
                      })),
                  ]}
                />
                </div>
              ) : (
                <div style={infoBannerStyle}>Sem coordenadas da sucataria.</div>
              )}
            </Card>

            <Card title="Ocorrências próximas" subtitle="Lista de ocorrências encontradas junto à sucataria." style={pairedDetailCardStyle}>
              <div style={nearbyPanelStyle}>
                {occLoading ? (
                  <div style={infoBannerStyle}>A carregar…</div>
                ) : occError ? (
                  <div style={errorBannerStyle}>{occError}</div>
                ) : !nearOccurrences.length ? (
                  <div style={infoBannerStyle}>Sem ocorrências próximas encontradas.</div>
                ) : (
                  <div style={nearbyListStyle}>
                    {nearOccurrencesWithDistance.map(({ occurrence, distanceMeters }) => (
                      <button
                        key={occurrence.id}
                        type="button"
                        style={contextCardButtonStyle}
                        onClick={() => openOccurrenceDetails(occurrence.id)}
                      >
                        <div style={contextCardStyle}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                            <span style={contextCardIconStyle}>
                              <IconOccurrence />
                            </span>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                              <strong style={{ color: '#1f2937' }}>{occurrence.local || occurrence.id || '-'}</strong>
                              <span style={{ color: '#5f6673', fontSize: 13 }}>{formatDateTime(occurrence.data_facto)}</span>
                              <span style={contextCardMetaStyle}>{formatDistance(distanceMeters)} da sucataria</span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
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
  iconStyle,
}: {
  icon: React.ReactNode
  title: string
  description: string
  items: Array<{ label: string; value: string }>
  iconStyle?: React.CSSProperties
}) {
  return (
    <div style={detailSectionCardStyle}>
      <div style={detailSectionHeaderStyle}>
        <span style={{ ...detailSectionIconStyle, ...iconStyle }}>{icon}</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <strong style={{ color: '#1f2937', fontSize: 16 }}>{title}</strong>
          <span style={{ color: '#5f6673', fontSize: 13, lineHeight: 1.5 }}>{description}</span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map((item) => (
          <div key={item.label} style={detailSectionItemStyle}>
            <span style={detailSectionItemLabelStyle}>{item.label}</span>
            <strong style={detailSectionItemValueStyle}>{item.value || '-'}</strong>
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

function formatDateTime(iso?: string) {
  if (!iso) return '-'
  try {
    const date = new Date(iso)
    if (Number.isNaN(date.getTime())) return '-'
    return date.toLocaleString('pt-PT')
  } catch {
    return '-'
  }
}

function formatPercent(value?: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—'
  return `${(value * 100).toFixed(1)} %`
}

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const earthRadius = 6371000
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return earthRadius * c
}

function formatDistance(distanceMeters: number | null) {
  if (distanceMeters == null || Number.isNaN(distanceMeters)) return 'Distância indisponível'
  if (distanceMeters < 1000) return `${Math.round(distanceMeters)} m`
  return `${(distanceMeters / 1000).toFixed(2).replace('.', ',')} km`
}

function IconBack() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
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

function IconShield() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3L19 6V11.5C19 16.1 16 19.9 12 21C8 19.9 5 16.1 5 11.5V6L12 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  )
}

function IconWarehouse() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 10L12 4L20 10V19H4V10Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9 19V13H15V19" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
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

function IconPinpoint() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 20C15.5 16.4 18 13.7 18 10.5C18 6.9 15.3 4 12 4C8.7 4 6 6.9 6 10.5C6 13.7 8.5 16.4 12 20Z" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="10.5" r="2.2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

function IconBox() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3.8L19 7.8V16.2L12 20.2L5 16.2V7.8L12 3.8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M12 12L19 7.8" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M12 12L5 7.8" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M12 12V20.2" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  )
}

function IconOccurrence() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 4L20 18H4L12 4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M12 9V13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="16.2" r="0.8" fill="currentColor" />
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

const infoBannerStyle: React.CSSProperties = {
  padding: '14px 16px',
  borderRadius: 18,
  background: 'rgba(255, 252, 246, 0.92)',
  border: '1px solid rgba(101, 74, 32, 0.12)',
  color: '#5f6673',
  fontWeight: 700,
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
  gap: 14,
  flexWrap: 'wrap',
  padding: '18px 20px',
  borderRadius: 22,
  border: '1px solid rgba(101, 74, 32, 0.10)',
  background: 'linear-gradient(135deg, rgba(255, 252, 247, 0.98) 0%, rgba(246, 237, 222, 0.9) 100%)',
}

const detailOverviewEyebrowStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '.14em',
  color: '#8d4a17',
}

const statusPillStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 10,
  minHeight: 52,
  padding: '10px 14px',
  borderRadius: 18,
  background: '#fffdf8',
  border: '1px solid rgba(101, 74, 32, 0.12)',
  boxShadow: '0 12px 30px rgba(76, 57, 24, 0.08)',
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
  letterSpacing: '.10em',
  textTransform: 'uppercase',
  color: '#7b8494',
}

const statusPillValueStyle: React.CSSProperties = {
  color: '#1f2937',
  fontSize: 14,
  fontWeight: 800,
}

const detailSectionCardStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
  minWidth: 0,
  padding: '18px 18px 16px',
  borderRadius: 20,
  border: '1px solid rgba(101, 74, 32, 0.12)',
  background: '#fffdf8',
  boxShadow: '0 12px 30px rgba(76, 57, 24, 0.06)',
}

const detailSectionHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 10,
}

const detailSectionIconStyle: React.CSSProperties = {
  width: 38,
  height: 38,
  minWidth: 38,
  borderRadius: 14,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(201, 109, 31, 0.12)',
  color: '#8d4a17',
}

const scrapyardSectionIconStyle: React.CSSProperties = {
  background: 'rgba(48, 86, 166, 0.12)',
  color: '#3056a6',
}

const detailSectionItemStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  paddingBottom: 10,
  borderBottom: '1px solid rgba(101, 74, 32, 0.08)',
}

const detailSectionItemLabelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: '.1em',
  textTransform: 'uppercase',
  color: '#7b8494',
}

const detailSectionItemValueStyle: React.CSSProperties = {
  color: '#1f2937',
  fontSize: 14,
  fontWeight: 700,
  overflowWrap: 'anywhere',
}

const pairedDetailCardStyle: React.CSSProperties = {
  height: '100%',
}

const summaryChipStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  minHeight: 38,
  padding: '0 14px',
  borderRadius: 999,
  background: 'linear-gradient(180deg, #faf1e3 0%, #f5ead9 100%)',
  border: '1px solid rgba(101, 74, 32, 0.14)',
  color: '#5f6673',
  fontSize: 13,
  fontWeight: 700,
}

const nearbyPanelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  height: 360,
}

const nearbyListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  height: '100%',
  overflowY: 'auto',
  paddingRight: 6,
}

const contextCardButtonStyle: React.CSSProperties = {
  padding: 0,
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  textAlign: 'left',
}

const contextCardStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  padding: '16px 18px',
  borderRadius: 20,
  border: '1px solid rgba(101, 74, 32, 0.12)',
  background: 'linear-gradient(180deg, #fffaf2 0%, #f8efe2 100%)',
}

const contextCardIconStyle: React.CSSProperties = {
  width: 38,
  height: 38,
  minWidth: 38,
  borderRadius: 14,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(201, 109, 31, 0.16)',
  color: '#8d4a17',
}

const contextCardMetaStyle: React.CSSProperties = {
  color: '#8d4a17',
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: '.04em',
}
