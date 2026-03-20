import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Card, Text } from '../components'
import { MapPicker } from '../components/ui/MapPicker'
import { OccurrenceApi, RegiaoApi, ASCApi, FormaConhecimentoApi, SectorInfracaoApi, TipoInfracaoApi, MaterialApi, ScrapyardApi, DirecaoTransportesApi, type ModelOccurrence, type ModelRegiao, type ModelASC, type ModelFormaConhecimento, type ModelSectorInfracao, type ModelTipoInfracao, type ModelMaterial, type ModelScrapyard, type ModelDirecaoTransportes } from '../services'
import { useAuth } from '../contexts/AuthContext'

export default function OcorrenciaDetailScreen() {
  const { getApiConfig, getAuthorizationHeaderValue, logout } = useAuth()
  const api = useMemo(() => new OccurrenceApi(getApiConfig()), [getApiConfig])
  const regiaoApi = useMemo(() => new RegiaoApi(getApiConfig()), [getApiConfig])
  const ascApi = useMemo(() => new ASCApi(getApiConfig()), [getApiConfig])
  const formaApi = useMemo(() => new FormaConhecimentoApi(getApiConfig()), [getApiConfig])
  const sectorApi = useMemo(() => new SectorInfracaoApi(getApiConfig()), [getApiConfig])
  const tipoApi = useMemo(() => new TipoInfracaoApi(getApiConfig()), [getApiConfig])
  const materialApi = useMemo(() => new MaterialApi(getApiConfig()), [getApiConfig])
  const scrapyardApi = useMemo(() => new ScrapyardApi(getApiConfig()), [getApiConfig])
  const authHeader = useMemo(() => getAuthorizationHeaderValue(), [getAuthorizationHeaderValue])
  const direcaoApi = useMemo(() => new DirecaoTransportesApi(getApiConfig()), [getApiConfig])

  const id = useMemo(() => {
    const parts = window.location.pathname.split('/').filter(Boolean)
    // /ocorrencias/:id
    return parts[1] || ''
  }, [])

  const [item, setItem] = useState<ModelOccurrence | null>(null)
  const [regioes, setRegioes] = useState<ModelRegiao[]>([])
  const [ascs, setAscs] = useState<ModelASC[]>([])
  const [formas, setFormas] = useState<ModelFormaConhecimento[]>([])
  const [setores, setSetores] = useState<ModelSectorInfracao[]>([])
  const [tiposInf, setTiposInf] = useState<ModelTipoInfracao[]>([])
  const [materiais, setMateriais] = useState<ModelMaterial[]>([])
  const [direcoes, setDirecoes] = useState<ModelDirecaoTransportes[]>([])
  const [scrapyards, setScrapyards] = useState<ModelScrapyard[]>([])
  const [scrapyardsLoading, setScrapyardsLoading] = useState(false)
  const [scrapyardsError, setScrapyardsError] = useState<string | null>(null)
  const [nearOccurrences, setNearOccurrences] = useState<ModelOccurrence[]>([])
  const [nearOccLoading, setNearOccLoading] = useState(false)
  const [nearOccError, setNearOccError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const apiBase = (import.meta as any).env?.VITE_API_BASE_URL || '/api'
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null)

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
      const [{ data: d1 }, { data: d2 }, { data: d3 }, { data: d4 }, { data: d5 }, { data: d6 }, { data: d7 }, { data: d8 }] = await Promise.all([
        api.privateOccurrencesIdGet(id, authHeader),
        regiaoApi.privateRegioesGet(authHeader, 1, 200, 'name', 'asc'),
        ascApi.privateAscsGet(authHeader, 1, 200, 'name', 'asc'),
        formaApi.privateFormaConhecimentosGet(authHeader, 1, 200, 'name', 'asc'),
        sectorApi.privateSectorInfracaoGet(authHeader, -1, undefined, 'name', 'asc'),
        tipoApi.privateTiposInfracaoGet(authHeader, -1, undefined, 'name', 'asc'),
        materialApi.privateMateriaisGet(authHeader, -1, undefined, 'name', 'asc'),
        direcaoApi.privateDirecaoTransportesGet(authHeader, 1, 200, 'name', 'asc')
      ])
      if ([d1, d2, d3, d4, d5, d6, d7, d8].some((x) => isUnauthorizedBody(x))) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      setItem(d1 as any)
      setRegioes((d2 as any).items ?? [])
      setAscs((d3 as any).items ?? [])
      setFormas((d4 as any).items ?? [])
      setSetores((d5 as any).items ?? [])
      setTiposInf((d6 as any).items ?? [])
      setMateriais((d7 as any).items ?? [])
      setDirecoes((d8 as any).items ?? [])
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 401 || isUnauthorizedBody(err?.response?.data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      setError(!status ? 'Sem ligação ao servidor.' : status >= 500 ? 'Erro do servidor ao carregar.' : 'Falha a obter ocorrência.')
    } finally { setLoading(false) }
  }, [api, regiaoApi, ascApi, formaApi, authHeader, id])

  // Carrega sucatarias próximas quando item com lat/long está disponível
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

  // Carrega ocorrências próximas quando item com lat/long está disponível
  useEffect(() => {
    (async () => {
      if (!item || item.lat == null || item.long == null) return
      setNearOccLoading(true); setNearOccError(null)
      try {
        const { data } = await api.privateOccurrencesGet(
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
          Number(item.lat),
          Number(item.long)
        )
        setNearOccurrences(((data as any).items ?? []) as ModelOccurrence[])
      } catch (err: any) {
        const status = err?.response?.status
        setNearOccError(!status ? 'Sem ligação ao servidor.' : 'Falha a obter ocorrências próximas.')
      } finally { setNearOccLoading(false) }
    })()
  }, [api, authHeader, item?.lat, item?.long])

  useEffect(() => { load() }, [load])

  const resolveNome = (arr: { id?: string; name?: string }[], id?: string) => {
    if (!id) return '-'
    const it = arr.find((x) => x.id === id)
    return it?.name || id
  }

  function voltar() {
    const search = window.location.search || ''
    if (window.location.pathname !== '/ocorrencias' || search) window.history.pushState({}, '', `/ocorrencias${search}`)
    window.dispatchEvent(new Event('locationchange'))
  }
  function editar() {
    if (id) {
      window.history.pushState({}, '', `/ocorrencias/${id}/editar${window.location.search}`)
      window.dispatchEvent(new Event('locationchange'))
    }
  }

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

  const sectorNameById = useMemo(() => Object.fromEntries(setores.map((s) => [s.id, s.name || s.id])), [setores]) as Record<string, string>
  const tipoNameById = useMemo(() => Object.fromEntries(tiposInf.map((t) => [t.id, t.name || t.id])), [tiposInf]) as Record<string, string>
  const materialNameById = useMemo(() => Object.fromEntries(materiais.map((m) => [m.id, m.name || m.id])), [materiais]) as Record<string, string>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={screenHeroStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={screenEyebrowStyle}>Ocorrências</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <h2 style={{ margin: 0, fontSize: 30, lineHeight: 1.05, color: '#1f2937' }}>Detalhe da ocorrência</h2>
            <p style={{ margin: 0, color: '#5f6673', lineHeight: 1.6 }}>
              Consulte o contexto territorial, localização, infrações registadas e entidades próximas.
            </p>
          </div>
        </div>
        <div style={screenActionRowStyle}>
          <Button variant="secondary" onClick={voltar}>Voltar</Button>
          <Button onClick={editar}>Editar ocorrência</Button>
        </div>
      </div>

      {loading && <div style={infoBannerStyle}>A carregar…</div>}
      {error && <div style={errorBannerStyle}>{error}</div>}
      {!loading && !error && item && (
        <>
          <Card title="Dados gerais">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              <Field label="Local" value={item.local || '-'} />
              <Field label="Região" value={resolveNome(regioes, item.regiao_id)} />
              <Field label="ASC" value={resolveNome(ascs, item.asc_id)} />
              <Field label="Forma de conhecimento" value={resolveNome(formas, item.forma_conhecimento_id)} />
              <Field label="Direção de Transporte" value={resolveNome(direcoes, item.direcao_transportes_id)} />
              <Field label="Data do facto" value={formatDateTime(item.data_facto)} />
              <Field label="Criado em" value={formatDateTime(item.created_at)} />
              <Field label="Latitude" value={item.lat != null ? String(item.lat) : '-'} />
              <Field label="Longitude" value={item.long != null ? String(item.long) : '-'} />
              <Field label="Processo criminal aberto" value={(item as any).processo_criminal_aberto ? 'Sim' : 'Não'} />
              {(item as any).nr_detidos != null && <Field label="Nr. detidos" value={String((item as any).nr_detidos)} />}
              {(item as any).precision != null && <Field label="Precisão" value={String((item as any).precision)} />}
              {((item as any).later_update != null) && <Field label="Atualização posterior" value={(item as any).later_update ? 'Sim' : 'Não'} />}
            </div>
            {(item as any).caracteristica_local_vandalizacao ? (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 12, color: '#6b7280' }}>Característica do local</div>
                <Text>{(item as any).caracteristica_local_vandalizacao}</Text>
              </div>
            ) : null}
            {((item as any).auto || (item as any).auto_image) && (
              <div style={{ marginTop: 12, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                {(item as any).auto ? <div><div style={{ fontSize: 12, color: '#6b7280' }}>Auto</div><div style={{ fontWeight: 500 }}>{(item as any).auto}</div></div> : null}
                {(item as any).auto_image ? (
                  <div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>Anexo do auto</div>
                    <img src={`${apiBase}/public/images/${(item as any).auto_image}`} alt="Auto" style={{ width: 220, height: 160, objectFit: 'cover', borderRadius: 8, border: '1px solid #e5e7eb' }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '0.3' }} />
                  </div>
                ) : null}
        </div>
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
                extraMarkers={[
                  // sucatarias (azul)
                  ...scrapyards
                    .filter((s) => s.lat != null && s.long != null)
                    .map((s) => ({
                      lat: Number(s.lat),
                      lng: Number(s.long),
                      title: s.nome || s.id || 'Sucataria',
                      color: '#2563eb',
                      infoHtml: `<div style=\"min-width:180px\"><div style=\"font-weight:600\">${(s.nome || s.id || 'Sucataria').toString().replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div><div style=\"color:#6b7280;font-size:12px\">ASC: ${(s.asc_name || s.asc_id || '-').toString().replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div><div style=\"color:#6b7280;font-size:12px\">Coord.: ${s.lat != null && s.long != null ? `${Number(s.lat).toFixed(5)}, ${Number(s.long).toFixed(5)}` : '-'}</div></div>`
                    })),
                  // ocorrências próximas (verde), exceto a atual
                  ...nearOccurrences
                    .filter((o) => o.id !== id && o.lat != null && o.long != null)
                    .map((o) => ({
                      lat: Number(o.lat),
                      lng: Number(o.long),
                      title: (o.local || o.id || 'Ocorrência') as string,
                      color: '#16a34a',
                      infoHtml: `<div style=\"min-width:180px\"><div style=\"font-weight:600\">${((o.local || o.id || 'Ocorrência') as string).toString().replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div><div style=\"color:#6b7280;font-size:12px\">Data: ${formatDateTime(o.data_facto)}</div></div>`
                    })),
                ]}
              />
            ) : (
              <div style={{ color: '#6b7280' }}>Sem coordenadas da ocorrência.</div>
            )}
          </Card>
          <Card title="Sucatarias próximas">
            {scrapyardsLoading ? (
              <div style={infoBannerStyle}>A carregar…</div>
            ) : scrapyardsError ? (
              <div style={errorBannerStyle}>{scrapyardsError}</div>
            ) : !scrapyards.length ? (
              <div style={infoBannerStyle}>Sem sucatarias próximas.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {scrapyards.map((s) => (
                  <div key={s.id} style={contextCardStyle}>
                    <div style={{ fontWeight: 600 }}>{s.nome || s.id}</div>
                    <div style={{ color: '#6b7280', fontSize: 12, marginTop: 4 }}>ASC: {s.asc_name || s.asc_id || '-'}</div>
                    <div style={{ color: '#6b7280', fontSize: 12, marginTop: 4 }}>Coordenadas: {s.lat != null && s.long != null ? `${s.lat.toFixed(5)}, ${s.long.toFixed(5)}` : '-'}</div>
                    {Array.isArray(s.materiais) && s.materiais.length ? (
                      <div style={{ color: '#6b7280', fontSize: 12, marginTop: 4 }}>Materiais: {s.materiais.map((m) => m.name || m.id).filter(Boolean).join(', ')}</div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
            {item.descricao ? (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 12, color: '#6b7280' }}>Descrição</div>
                <Text>{item.descricao}</Text>
              </div>
            ) : null}
          </Card>

          <Card title="Infrações">
            {!(item.infractions ?? []).length ? (
              <div style={infoBannerStyle}>Sem infrações.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {(item.infractions ?? []).map((inf, i) => {
                  const fotosCsv = ((inf as any).fotografias || '').trim()
                  const fotos = fotosCsv ? fotosCsv.split(',').map((s: string) => s.trim()).filter(Boolean) : []
                  const infractors = (inf as any).infractors || []
                  const sectorId = (inf as any).sector_infracao_id
                  const tipoId = (inf as any).tipo_infracao_id
                  const matId = (inf as any).material_id
                  const sectorLabel = sectorId ? (sectorNameById[sectorId] || (inf as any).sector_infracao?.name || sectorId) : ((inf as any).sector_infracao?.name || '-')
                  const tipoLabel = tipoId ? (tipoNameById[tipoId] || (inf as any).tipo_infracao?.name || tipoId) : ((inf as any).tipo_infracao?.name || '-')
                  const materialLabel = matId ? (materialNameById[matId] || (inf as any).material?.name || matId) : (((inf as any).material?.name) || (inf as any).tipo_material || '-')
                  return (
                    <div key={i} style={contextCardStyle}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8 }}>
                        <Field label="Sector" value={sectorLabel} />
                        <Field label="Tipo" value={tipoLabel} />
                        <Field label="Material" value={materialLabel} />
                        <Field label="Quantidade" value={inf.quantidade != null ? String(inf.quantidade) : '-'} />
                        <Field label="Valor" value={inf.valor != null ? formatMoney(inf.valor) : '-'} />
                        <Field label="Latitude" value={inf.lat != null ? String(inf.lat) : '-'} />
                        <Field label="Longitude" value={inf.long != null ? String(inf.long) : '-'} />
                      </div>
                      {fotos.length ? (
                        <div style={{ marginTop: 8 }}>
                          <div style={{ fontWeight: 600, marginBottom: 6 }}>Fotografias</div>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {fotos.map((img: string, k: number) => {
                              const url = `${apiBase}/public/images/${img}`
                              return (
                                <img
                                  key={k}
                                  src={url}
                                  alt="Foto"
                                  style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 8, border: '1px solid #e5e7eb', cursor: 'zoom-in' }}
                                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '0.3' }}
                                  onClick={() => setLightbox({ images: fotos.map((f) => `${apiBase}/public/images/${f}`), index: k })}
                                />
                              )
                            })}
                          </div>
                        </div>
                      ) : null}
                      {Array.isArray(infractors) && infractors.length ? (
                        <div style={{ marginTop: 10 }}>
                          <div style={{ fontWeight: 600, marginBottom: 6 }}>Infractores</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {infractors.map((x: any, idx: number) => (
                              <div key={idx} style={innerDashedCardStyle}>
                                <Field label="Nome" value={x.nome || '-'} />
                                <Field label="Documento" value={x.nr_identificacao || '-'} />
                                <Field label="Tipo de identificação" value={x.tipo_identificacao || '-'} />
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </>
      )}
      {lightbox && (
      <div
        role="dialog"
        aria-modal="true"
        onClick={() => setLightbox(null)}
        style={{ position: 'fixed', inset: 0, background: 'rgba(24, 31, 42, 0.76)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      >
        <div onClick={(e) => e.stopPropagation()} style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
          <img src={lightbox.images[lightbox.index]} alt={`Foto ${lightbox.index + 1}`} style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 22, boxShadow: '0 30px 70px rgba(0,0,0,.42)' }} />
          <button
            type="button"
            aria-label="Fechar"
            onClick={() => setLightbox(null)}
            style={lightboxCloseButtonStyle}
          >×</button>
          {lightbox.images.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Anterior"
                onClick={() => setLightbox((lb) => (lb ? { ...lb, index: (lb.index - 1 + lb.images.length) % lb.images.length } : lb))}
                style={{ ...lightboxNavButtonStyle, left: -56 }}
              >‹</button>
              <button
                type="button"
                aria-label="Seguinte"
                onClick={() => setLightbox((lb) => (lb ? { ...lb, index: (lb.index + 1) % lb.images.length } : lb))}
                style={{ ...lightboxNavButtonStyle, right: -56 }}
              >›</button>
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
    <div style={fieldCardStyle}>
      <div style={fieldLabelStyle}>{label}</div>
      <div style={fieldValueStyle}>{value || '-'}</div>
    </div>
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

const contextCardStyle: React.CSSProperties = {
  border: '1px solid rgba(101, 74, 32, 0.12)',
  borderRadius: 20,
  padding: 14,
  background: 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(250,246,239,0.92) 100%)',
  boxShadow: '0 14px 28px rgba(101, 74, 32, 0.06)',
}

const innerDashedCardStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
  gap: 8,
  padding: 10,
  borderRadius: 16,
  border: '1px dashed rgba(101, 74, 32, 0.18)',
  background: 'rgba(255, 252, 246, 0.9)',
}

const lightboxCloseButtonStyle: React.CSSProperties = {
  position: 'absolute',
  top: -14,
  right: -14,
  width: 42,
  height: 42,
  border: '1px solid rgba(255,255,255,0.16)',
  borderRadius: '9999px',
  background: 'rgba(24, 31, 42, 0.88)',
  color: '#fff',
  cursor: 'pointer',
  boxShadow: '0 16px 32px rgba(0,0,0,.3)',
}

const lightboxNavButtonStyle: React.CSSProperties = {
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  width: 44,
  height: 44,
  border: '1px solid rgba(255,255,255,0.16)',
  borderRadius: 14,
  background: 'rgba(24, 31, 42, 0.88)',
  color: '#fff',
  cursor: 'pointer',
  boxShadow: '0 16px 32px rgba(0,0,0,.3)',
}

function formatDateTime(iso?: string) {
  if (!iso) return '-'
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return '-'
    return d.toLocaleString('pt-PT')
  } catch { return '-' }
}

function formatMoney(n?: number) {
  if (typeof n !== 'number' || Number.isNaN(n)) return '-'
  try {
    return `${n.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT`
  } catch {
    return `${n.toFixed(2)} MT`
  }
}
