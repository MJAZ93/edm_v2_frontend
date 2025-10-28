import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Card, Heading, Text } from '../components'
import { MapPicker } from '../components/ui/MapPicker'
import { useAuth } from '../contexts/AuthContext'
import { ScrapyardApi, OccurrenceApi, type ModelScrapyard, type ModelOccurrence } from '../services'

export default function ScrapyardDetailScreen() {
  const { getApiConfig, getAuthorizationHeaderValue, logout } = useAuth()
  const scrapyardApi = useMemo(() => new ScrapyardApi(getApiConfig()), [getApiConfig])
  const occurrenceApi = useMemo(() => new OccurrenceApi(getApiConfig()), [getApiConfig])
  const authHeader = useMemo(() => getAuthorizationHeaderValue(), [getAuthorizationHeaderValue])

  const id = useMemo(() => {
    const parts = window.location.pathname.split('/').filter(Boolean)
    return parts[1] || ''
  }, [])

  const [item, setItem] = useState<ModelScrapyard | null>(null)
  const [nearOccurrences, setNearOccurrences] = useState<ModelOccurrence[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [occLoading, setOccLoading] = useState(false)
  const [occError, setOccError] = useState<string | null>(null)

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

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const { data } = await scrapyardApi.privateScrapyardsIdGet(id, authHeader)
      if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      setItem(data as any)
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 401 || isUnauthorizedBody(err?.response?.data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      setError(!status ? 'Sem ligação ao servidor.' : status >= 500 ? 'Erro do servidor ao carregar sucataria.' : 'Falha a obter sucataria.')
    } finally { setLoading(false) }
  }, [scrapyardApi, authHeader, id])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    (async () => {
      if (!item || item.lat == null || item.long == null) return
      setOccLoading(true); setOccError(null)
      try {
        const { data } = await occurrenceApi.privateOccurrencesGet(authHeader, 1, 10, 'created_at', 'desc', undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, Number(item.lat), Number(item.long))
        if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
        setNearOccurrences(((data as any).items ?? []) as ModelOccurrence[])
      } catch (err: any) {
        const status = err?.response?.status
        if (status === 401 || isUnauthorizedBody(err?.response?.data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
        setOccError(!status ? 'Sem ligação ao servidor.' : 'Falha a obter ocorrências próximas.')
      } finally { setOccLoading(false) }
    })()
  }, [item?.lat, item?.long, occurrenceApi, authHeader])

  function voltar() {
    if (window.location.pathname !== '/sucatarias') window.history.pushState({}, '', '/sucatarias')
    window.dispatchEvent(new Event('locationchange'))
  }

  function openOccurrenceDetails(occId?: string) {
    if (!occId) return
    window.history.pushState({}, '', `/ocorrencias/${occId}`)
    window.dispatchEvent(new Event('locationchange'))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Heading level={2}>Detalhes da sucataria</Heading>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" onClick={voltar}>Voltar</Button>
        </div>
      </div>

      {loading && <div style={{ color: '#6b7280' }}>A carregar…</div>}
      {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: 10, borderRadius: 8 }}>{error}</div>}

      {!loading && !error && item && (
        <>
          <Card title="Dados da sucataria">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              <Field label="Nome" value={item.nome || item.id || '-'} />
              <Field label="ASC" value={(item as any).asc_name || item.asc_id || '-'} />
              <Field label="Latitude" value={item.lat != null ? String(item.lat) : '-'} />
              <Field label="Longitude" value={item.long != null ? String(item.long) : '-'} />
              {(item as any).nivel_confianca != null && <Field label="Nível de desconfiança" value={`${(Number((item as any).nivel_confianca) * 100).toFixed(1)} %`} />}
            </div>
            {Array.isArray(item.materiais) && item.materiais.length ? (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 12, color: '#6b7280' }}>Materiais</div>
                <Text>{item.materiais.map((m) => m.name || m.id).filter(Boolean).join(', ')}</Text>
              </div>
            ) : null}
          </Card>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'minmax(360px, 1.4fr) minmax(320px, 1fr)', 
            gap: 24, 
            alignItems: 'start',
            '@media (max-width: 768px)': {
              gridTemplateColumns: '1fr',
              gap: 16
            }
          }}>
            <Card title="Localização">
              {(item.lat != null && item.long != null) ? (
                <MapPicker
                  value={{ lat: Number(item.lat), lng: Number(item.long) }}
                  onChange={() => {}}
                  height={360}
                  disabled
                  extraMarkers={nearOccurrences
                    .filter((o) => o.lat != null && o.long != null)
                    .map((o) => ({
                      lat: Number(o.lat),
                      lng: Number(o.long),
                      title: (o.local || o.id || 'Ocorrência') as string,
                      color: '#16a34a',
                      infoHtml: `<div style=\"min-width:180px\"><div style=\"font-weight:600\">${((o.local || o.id || 'Ocorrência') as string).toString().replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div><div style=\"color:#6b7280;font-size:12px\">Data: ${formatDate(o.data_facto)}</div></div>`
                    }))}
                />
              ) : (
                <div style={{ color: '#6b7280' }}>Sem coordenadas da sucataria.</div>
              )}
            </Card>
            <Card title="Ocorrências próximas" style={{ height: 'fit-content' }}>
              <div style={{ 
                height: 360, 
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}>
                {occLoading ? (
                  <div style={{ 
                    color: '#6b7280', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    height: '100%'
                  }}>
                    A carregar…
                  </div>
                ) : occError ? (
                  <div style={{ 
                    background: '#fee2e2', 
                    color: '#991b1b', 
                    padding: 16, 
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    textAlign: 'center'
                  }}>
                    {occError}
                  </div>
                ) : !nearOccurrences.length ? (
                  <div style={{ 
                    color: '#6b7280',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    textAlign: 'center',
                    fontSize: 15
                  }}>
                    Sem ocorrências próximas encontradas.
                  </div>
                ) : (
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: 12,
                    overflowY: 'auto',
                    paddingRight: 8,
                    height: '100%'
                  }}>
                    {nearOccurrences.map((o) => (
                      <div 
                        key={o.id} 
                        style={{ 
                          border: '1px solid #e5e7eb', 
                          borderRadius: 12, 
                          padding: 16,
                          background: '#fafafa',
                          transition: 'all 0.2s ease-in-out',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#ea580c'
                          e.currentTarget.style.background = '#fff7ed'
                          e.currentTarget.style.transform = 'translateY(-2px)'
                          e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#e5e7eb'
                          e.currentTarget.style.background = '#fafafa'
                          e.currentTarget.style.transform = 'translateY(0)'
                          e.currentTarget.style.boxShadow = 'none'
                        }}
                      >
                        <div style={{ 
                          fontWeight: 600, 
                          fontSize: 15,
                          color: '#18181b',
                          marginBottom: 8,
                          lineHeight: 1.4
                        }}>
                          {o.local || o.id}
                        </div>
                        
                        <div style={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          gap: 6,
                          marginBottom: 12
                        }}>
                          <div style={{ 
                            color: '#6b7280', 
                            fontSize: 13,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6
                          }}>
                            <span style={{ 
                              width: 12, 
                              height: 12, 
                              background: '#16a34a', 
                              borderRadius: '50%',
                              display: 'inline-block'
                            }} />
                            Data: {formatDate(o.data_facto)}
                          </div>
                          
                          {o.lat != null && o.long != null && (
                            <div style={{ 
                              color: '#6b7280', 
                              fontSize: 13,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6
                            }}>
                              <span style={{ fontSize: 12 }}>📍</span>
                              {`${Number(o.lat).toFixed(5)}, ${Number(o.long).toFixed(5)}`}
                            </div>
                          )}
                        </div>
                        
                        <Button 
                          variant="secondary" 
                          size="sm"
                          onClick={() => openOccurrenceDetails(o.id)}
                          style={{ width: '100%' }}
                        >
                          Ver detalhes
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
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

function formatDate(iso?: string) {
  if (!iso) return '-'
  try { const d = new Date(iso); if (Number.isNaN(d.getTime())) return '-'; return d.toLocaleString('pt-PT') } catch { return '-' }
}
