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
        const { data } = await occurrenceApi.privateOccurrencesGet(authHeader, 1, 10, 'created_at', 'desc', undefined, undefined, undefined, undefined, undefined, undefined, Number(item.lat), Number(item.long))
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
              {(item as any).nivel_confianca != null && <Field label="Nível de confiança" value={`${(Number((item as any).nivel_confianca) * 100).toFixed(1)} %`} />}
            </div>
            {Array.isArray(item.materiais) && item.materiais.length ? (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 12, color: '#6b7280' }}>Materiais</div>
                <Text>{item.materiais.map((m) => m.name || m.id).filter(Boolean).join(', ')}</Text>
              </div>
            ) : null}
          </Card>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(360px, 1.4fr) minmax(280px, 1fr)', gap: 16, alignItems: 'start' }}>
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
            <Card title="Ocorrências próximas">
              {occLoading ? (
                <div style={{ color: '#6b7280' }}>A carregar…</div>
              ) : occError ? (
                <div style={{ background: '#fee2e2', color: '#991b1b', padding: 10, borderRadius: 8 }}>{occError}</div>
              ) : !nearOccurrences.length ? (
                <div style={{ color: '#6b7280' }}>Sem ocorrências próximas.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {nearOccurrences.map((o) => (
                    <div key={o.id} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 12 }}>
                      <div style={{ fontWeight: 600 }}>{o.local || o.id}</div>
                      <div style={{ color: '#6b7280', fontSize: 12, marginTop: 4 }}>Data: {formatDate(o.data_facto)}</div>
                      <div style={{ color: '#6b7280', fontSize: 12, marginTop: 4 }}>Coordenadas: {o.lat != null && o.long != null ? `${Number(o.lat).toFixed(5)}, ${Number(o.long).toFixed(5)}` : '-'}</div>
                      <div style={{ marginTop: 8 }}>
                        <Button variant="secondary" onClick={() => openOccurrenceDetails(o.id)}>Ver detalhes</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
