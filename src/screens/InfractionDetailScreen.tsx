import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Card, Heading, Text } from '../components'
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

  const isUnauthorizedBody = (data: any) => { try { const raw = data?.code ?? data?.error?.code ?? data?.status ?? data?.error?.status ?? data?.error_code; if (raw == null) return false; const num = Number(raw); if (!Number.isNaN(num) && num === 401) return true; const code = String(raw).toUpperCase(); return code === 'UNAUTHORIZED' || code === 'UNAUTHENTICATED' } catch { return false } }

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [{ data: d1 }, { data: d2 }, { data: d3 }, { data: d4 }] = await Promise.all([
        api.privateInfractionsIdGet(id, authHeader),
        sectorApi.privateSectorInfracaoGet(authHeader, -1, undefined, 'name', 'asc'),
        tipoApi.privateTiposInfracaoGet(authHeader, -1, undefined, 'name', 'asc'),
        materialApi.privateMateriaisGet(authHeader, -1, undefined, 'name', 'asc')
      ])
      if ([d1, d2, d3, d4].some((x) => isUnauthorizedBody(x))) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      setItem(d1 as any)
      setSetores((d2 as any).items ?? [])
      setTipos((d3 as any).items ?? [])
      setMateriais((d4 as any).items ?? [])
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 401 || isUnauthorizedBody(err?.response?.data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      setError(!status ? 'Sem ligação ao servidor.' : 'Falha a obter infração.')
    } finally { setLoading(false) }
  }, [api, authHeader, id])

  useEffect(() => { load() }, [load])

  // Carrega sucatarias próximas à infração
  useEffect(() => {
    (async () => {
      if (!item || item.lat == null || item.long == null) return
      setScrapyardsLoading(true); setScrapyardsError(null)
      try {
        const { data } = await scrapyardApi.privateScrapyardsGet(authHeader, 1, 10, 'nome', 'asc', undefined, undefined, undefined, undefined, Number(item.lat), Number(item.long))
        setScrapyards(((data as any).items ?? []) as ModelScrapyard[])
      } catch (err: any) {
        const status = err?.response?.status
        setScrapyardsError(!status ? 'Sem ligação ao servidor.' : 'Falha a obter sucatarias próximas.')
      } finally { setScrapyardsLoading(false) }
    })()
  }, [scrapyardApi, authHeader, item?.lat, item?.long])

  // Teclas para navegação no lightbox
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

  const resolveNome = (arr: { id?: string; name?: string }[], id?: string) => { if (!id) return '-'; const it = arr.find((x) => x.id === id); return it?.name || id }

  function voltar() {
    if (window.location.pathname !== '/infracoes') window.history.pushState({}, '', '/infracoes')
    window.dispatchEvent(new Event('locationchange'))
  }
  function editar() {
    if (id) { window.history.pushState({}, '', `/infracoes/${id}/editar`); window.dispatchEvent(new Event('locationchange')) }
  }

  const fotos = useMemo(() => {
    const csv = ((item as any)?.fotografias || '').trim()
    return csv ? csv.split(',').map((s: string) => s.trim()).filter(Boolean) : []
  }, [item?.fotografias])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Heading level={2}>Detalhes da infração</Heading>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" onClick={voltar}>Voltar</Button>
        </div>
      </div>

      {loading && <div style={{ color: '#6b7280' }}>A carregar…</div>}
      {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: 10, borderRadius: 8 }}>{error}</div>}
      {!loading && !error && item && (
        <Card title="Dados da infração">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            <Field label="Criado em" value={formatDate(item.created_at)} />
            <Field label="Sector" value={resolveNome(setores, item.sector_infracao_id)} />
            <Field label="Tipo" value={resolveNome(tipos, item.tipo_infracao_id)} />
            <Field label="Material" value={(item as any).material?.name || (item as any).material_id || item.tipo_material || '-'} />
            <Field label="Quantidade" value={item.quantidade != null ? String(item.quantidade) : '-'} />
            <Field label="Valor" value={item.valor != null ? formatMoney(item.valor) : '-'} />
            <Field label="Latitude" value={item.lat != null ? String(item.lat) : '-'} />
            <Field label="Longitude" value={item.long != null ? String(item.long) : '-'} />
          </div>
          {fotos.length ? (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Fotografias</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {fotos.map((img, i) => {
                  const url = `${apiBase}/public/images/${img}`
                  return (
                    <img key={i} src={url} alt="Foto" style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 8, border: '1px solid #e5e7eb', cursor: 'zoom-in' }} onClick={() => setLightbox({ images: fotos.map((f) => `${apiBase}/public/images/${f}`), index: i })} />
                  )
                })}
              </div>
            </div>
          ) : null}
        </Card>
      )}
      {/* Localização e sucatarias (lado a lado) */}
      {!loading && !error && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(360px, 1.4fr) minmax(280px, 1fr)', gap: 16, alignItems: 'start' }}>
          <Card title="Localização">
            {item && (item.lat != null && item.long != null) ? (
              <MapPicker
                value={{ lat: Number(item.lat), lng: Number(item.long) }}
                onChange={() => {}}
                height={360}
                disabled
                extraMarkers={scrapyards
                  .filter((s) => s.lat != null && s.long != null)
                  .map((s) => ({
                    lat: Number(s.lat),
                    lng: Number(s.long),
                    title: s.nome || s.id || 'Sucataria',
                    color: '#2563eb',
                    infoHtml: `<div style=\"min-width:180px\"><div style=\"font-weight:600\">${(s.nome || s.id || 'Sucataria').toString().replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div><div style=\"color:#6b7280;font-size:12px\">ASC: ${(s.asc_name || s.asc_id || '-').toString().replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div><div style=\"color:#6b7280;font-size:12px\">Coord.: ${s.lat != null && s.long != null ? `${Number(s.lat).toFixed(5)}, ${Number(s.long).toFixed(5)}` : '-'}</div></div>`
                  }))}
              />
            ) : (
              <div style={{ color: '#6b7280' }}>Sem coordenadas da infração.</div>
            )}
          </Card>
          <Card title="Sucatarias próximas">
            {scrapyardsLoading ? (
              <div style={{ color: '#6b7280' }}>A carregar…</div>
            ) : scrapyardsError ? (
              <div style={{ background: '#fee2e2', color: '#991b1b', padding: 10, borderRadius: 8 }}>{scrapyardsError}</div>
            ) : !scrapyards.length ? (
              <div style={{ color: '#6b7280' }}>Sem sucatarias próximas.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {scrapyards.map((s) => (
                  <div key={s.id} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 12 }}>
                    <div style={{ fontWeight: 600 }}>{s.nome || s.id}</div>
                    <div style={{ color: '#6b7280', fontSize: 12, marginTop: 4 }}>ASC: {s.asc_name || s.asc_id || '-'}</div>
                    <div style={{ color: '#6b7280', fontSize: 12, marginTop: 4 }}>Coordenadas: {s.lat != null && s.long != null ? `${s.lat.toFixed(5)}, ${s.long.toFixed(5)}` : '-'}</div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
      {lightbox && (
        <div role="dialog" aria-modal="true" onClick={() => setLightbox(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <img src={lightbox.images[lightbox.index]} alt={`Foto ${lightbox.index + 1}`} style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 10, boxShadow: '0 10px 25px rgba(0,0,0,.5)' }} />
            <button type="button" aria-label="Fechar" onClick={() => setLightbox(null)} style={{ position: 'absolute', top: -12, right: -12, background: '#111827', color: '#fff', border: 'none', borderRadius: '9999px', width: 36, height: 36, cursor: 'pointer' }}>×</button>
            {lightbox.images.length > 1 && (
              <>
                <button type="button" aria-label="Anterior" onClick={() => setLightbox((lb) => (lb ? { ...lb, index: (lb.index - 1 + lb.images.length) % lb.images.length } : lb))} style={{ position: 'absolute', top: '50%', left: -52, transform: 'translateY(-50%)', background: '#111827', color: '#fff', border: 'none', borderRadius: 8, width: 40, height: 40, cursor: 'pointer' }}>‹</button>
                <button type="button" aria-label="Seguinte" onClick={() => setLightbox((lb) => (lb ? { ...lb, index: (lb.index + 1) % lb.images.length } : lb))} style={{ position: 'absolute', top: '50%', right: -52, transform: 'translateY(-50%)', background: '#111827', color: '#fff', border: 'none', borderRadius: 8, width: 40, height: 40, cursor: 'pointer' }}>›</button>
              </>
            )}
          </div>
        </div>
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

function formatDate(iso?: string) { if (!iso) return '-'; try { const d = new Date(iso); if (Number.isNaN(d.getTime())) return '-'; return d.toLocaleString('pt-PT') } catch { return '-' } }
function formatMoney(n?: number) { if (typeof n !== 'number' || Number.isNaN(n)) return '-'; try { return `${n.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT` } catch { return `${n.toFixed(2)} MT` } }
