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
  const infractionSummaries = useMemo(() => (
    (item?.infractions ?? []).map((inf, index) => {
      const sectorId = (inf as any).sector_infracao_id
      const tipoId = (inf as any).tipo_infracao_id
      const matId = (inf as any).material_id
      const fotosCsv = ((inf as any).fotografias || '').trim()
      const fotos = fotosCsv ? fotosCsv.split(',').map((entry: string) => entry.trim()).filter(Boolean) : []
      const infractors = Array.isArray((inf as any).infractors) ? ((inf as any).infractors as any[]) : []
      return {
        key: `${sectorId || 'inf'}-${tipoId || index}-${index}`,
        index,
        sectorLabel: sectorId ? (sectorNameById[sectorId] || (inf as any).sector_infracao?.name || sectorId) : ((inf as any).sector_infracao?.name || '-'),
        tipoLabel: tipoId ? (tipoNameById[tipoId] || (inf as any).tipo_infracao?.name || tipoId) : ((inf as any).tipo_infracao?.name || '-'),
        materialLabel: matId ? (materialNameById[matId] || (inf as any).material?.name || matId) : (((inf as any).material?.name) || (inf as any).tipo_material || '-'),
        quantidade: inf.quantidade != null ? String(inf.quantidade) : '-',
        valor: inf.valor != null ? formatMoney(inf.valor) : '-',
        coordinates: inf.lat != null && inf.long != null ? `${inf.lat}, ${inf.long}` : '-',
        fotos,
        infractors,
      }
    })
  ), [item, materialNameById, sectorNameById, tipoNameById])
  const occurrenceInfractors = useMemo(() => (
    infractionSummaries.flatMap((inf) => (
      inf.infractors.map((person, personIndex) => ({
        key: `${inf.key}-person-${personIndex}`,
        infractionLabel: `${inf.sectorLabel} · ${inf.tipoLabel}`,
        nome: person.nome || '-',
        documento: person.nr_identificacao || '-',
        tipoIdentificacao: person.tipo_identificacao || '-',
      }))
    ))
  ), [infractionSummaries])

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
          <button type="button" onClick={voltar} style={detailSecondaryActionStyle}>
            <IconBack />
            <span>Voltar</span>
          </button>
          <button type="button" onClick={editar} style={detailPrimaryActionStyle}>
            <IconEdit />
            <span>Editar ocorrência</span>
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
                  <div style={detailOverviewEyebrowStyle}>Ocorrência</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <strong style={{ fontSize: 28, lineHeight: 1.05, color: '#1f2937' }}>{item.local || 'Local por identificar'}</strong>
                    <span style={{ color: '#5f6673', lineHeight: 1.6 }}>
                      {resolveNome(regioes, item.regiao_id)} · {resolveNome(ascs, item.asc_id)} · {resolveNome(formas, item.forma_conhecimento_id)}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <StatusPill icon={<IconClock />} label="Data do facto" value={formatDateTime(item.data_facto)} />
                  <StatusPill icon={<IconShield />} label="Processo criminal" value={(item as any).processo_criminal_aberto ? 'Aberto' : 'Não'} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr .9fr .9fr', gap: 14 }}>
                <DetailSectionCard
                  icon={<IconMapPin />}
                  title="Contexto territorial"
                  items={[
                    { label: 'Região', value: resolveNome(regioes, item.regiao_id) },
                    { label: 'ASC', value: resolveNome(ascs, item.asc_id) },
                    { label: 'Forma de conhecimento', value: resolveNome(formas, item.forma_conhecimento_id) },
                    { label: 'Direção de Transporte', value: resolveNome(direcoes, item.direcao_transportes_id) },
                  ]}
                />
                <DetailSectionCard
                  icon={<IconPinpoint />}
                  title="Georreferenciação"
                  items={[
                    { label: 'Latitude', value: item.lat != null ? String(item.lat) : '-' },
                    { label: 'Longitude', value: item.long != null ? String(item.long) : '-' },
                    { label: 'Precisão', value: (item as any).precision != null ? String((item as any).precision) : '-' },
                  ]}
                />
                <DetailSectionCard
                  icon={<IconClipboard />}
                  title="Registo"
                  items={[
                    { label: 'Criado em', value: formatDateTime(item.created_at) },
                    { label: 'Nr. detidos', value: (item as any).nr_detidos != null ? String((item as any).nr_detidos) : '-' },
                    { label: 'Atualização posterior', value: ((item as any).later_update != null) ? ((item as any).later_update ? 'Sim' : 'Não') : '-' },
                  ]}
                />
              </div>
              {(item as any).caracteristica_local_vandalizacao ? (
                <div style={detailTextPanelStyle}>
                  <div style={detailTextPanelTitleStyle}>
                    <IconInfo />
                    <span>Característica do local</span>
                  </div>
                  <Text>{(item as any).caracteristica_local_vandalizacao}</Text>
                </div>
              ) : null}
              {((item as any).auto || (item as any).auto_image) && (
                <div style={{ display: 'flex', gap: 16, alignItems: 'stretch', flexWrap: 'wrap' }}>
                  {(item as any).auto ? (
                    <div style={detailAutoTextCardStyle}>
                      <div style={detailTextPanelTitleStyle}>
                        <IconClipboard />
                        <span>Auto</span>
                      </div>
                      <div style={{ fontWeight: 700, color: '#1f2937', lineHeight: 1.5 }}>{(item as any).auto}</div>
                    </div>
                  ) : null}
                  {(item as any).auto_image ? (
                    <div style={detailAutoImageCardStyle}>
                      <div style={detailTextPanelTitleStyle}>
                        <IconCamera />
                        <span>Anexo do auto</span>
                      </div>
                      <img src={`${apiBase}/public/images/${(item as any).auto_image}`} alt="Auto" style={{ width: 220, height: 160, objectFit: 'cover', borderRadius: 12, border: '1px solid rgba(101, 74, 32, 0.12)' }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '0.3' }} />
                    </div>
                  ) : null}
                </div>
              )}
              {item.descricao ? (
                <div style={{ marginTop: 4 }}>
                  <div style={detailTextPanelTitleStyle}>
                    <IconInfo />
                    <span>Descrição</span>
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <Text>{item.descricao}</Text>
                  </div>
                </div>
              ) : null}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={detailTextPanelTitleStyle}>
                  <IconLayers />
                  <span>Infrações registadas</span>
                </div>
                {!infractionSummaries.length ? (
                  <div style={infoBannerStyle}>Sem infrações registadas.</div>
                ) : (
                  <div style={detailInfractionSummaryGridStyle}>
                    {infractionSummaries.map((inf) => (
                      <div key={inf.key} style={detailInfractionSummaryCardStyle}>
                        <div style={detailInfractionSummaryHeaderStyle}>
                          <span style={detailInfractionSummaryIconStyle}>
                            <IconAlert />
                          </span>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <strong style={{ color: '#1f2937', fontSize: 16 }}>{inf.tipoLabel}</strong>
                            <span style={{ color: '#8d4a17', fontSize: 12, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase' }}>
                              {inf.sectorLabel}
                            </span>
                          </div>
                        </div>
                        <div style={detailInfractionMetaGridStyle}>
                          <Field label="Material" value={inf.materialLabel} />
                          <Field label="Quantidade" value={inf.quantidade} />
                          <Field label="Valor" value={inf.valor} />
                          <Field label="Coordenadas" value={inf.coordinates} />
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <MiniBadge icon={<IconCamera />} label={`${inf.fotos.length} fotografia${inf.fotos.length === 1 ? '' : 's'}`} />
                          <MiniBadge icon={<IconPeople />} label={`${inf.infractors.length} infractor${inf.infractors.length === 1 ? '' : 'es'}`} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>
          {/* Localização e sucatarias (lado a lado) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(360px, 1.4fr) minmax(280px, 1fr)', gap: 16, alignItems: 'stretch' }}>
            <Card title="Localização">
              {item && (item.lat != null && item.long != null) ? (
                <MapPicker
                  value={{ lat: Number(item.lat), lng: Number(item.long) }}
                  onChange={() => {}}
                  height={360}
                  disabled
                  extraMarkers={[
                    ...scrapyards
                      .filter((s) => s.lat != null && s.long != null)
                      .map((s) => ({
                        lat: Number(s.lat),
                        lng: Number(s.long),
                        title: s.nome || s.id || 'Sucataria',
                        color: '#2563eb',
                        infoHtml: `<div style=\"min-width:180px\"><div style=\"font-weight:600\">${(s.nome || s.id || 'Sucataria').toString().replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div><div style=\"color:#6b7280;font-size:12px\">ASC: ${(s.asc_name || s.asc_id || '-').toString().replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div><div style=\"color:#6b7280;font-size:12px\">Coord.: ${s.lat != null && s.long != null ? `${Number(s.lat).toFixed(5)}, ${Number(s.long).toFixed(5)}` : '-'}</div></div>`
                      })),
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: 360, overflowY: 'auto', paddingRight: 4 }}>
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

          <Card title="Infractores da ocorrência">
            {!occurrenceInfractors.length ? (
              <div style={infoBannerStyle}>Sem infractores associados.</div>
            ) : (
              <div style={detailPeopleGridStyle}>
                {occurrenceInfractors.map((person) => (
                  <div key={person.key} style={detailPersonCardStyle}>
                    <div style={detailPersonHeaderStyle}>
                      <span style={detailPersonIconStyle}>
                        <IconPeople />
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <strong style={{ color: '#1f2937', fontSize: 16 }}>{person.nome}</strong>
                        <span style={{ color: '#8d4a17', fontSize: 12, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase' }}>
                          {person.infractionLabel}
                        </span>
                      </div>
                    </div>
                    <div style={detailPersonMetaGridStyle}>
                      <Field label="Documento" value={person.documento} />
                      <Field label="Tipo de identificação" value={person.tipoIdentificacao} />
                    </div>
                  </div>
                ))}
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

function StatusPill({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={statusPillStyle}>
      <span style={statusPillIconStyle}>{icon}</span>
      <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={statusPillLabelStyle}>{label}</span>
        <strong style={statusPillValueStyle}>{value}</strong>
      </span>
    </div>
  )
}

function DetailSectionCard({ icon, title, items }: { icon: React.ReactNode; title: string; items: Array<{ label: string; value: string }> }) {
  return (
    <div style={detailSectionCardStyle}>
      <div style={detailSectionHeaderStyle}>
        <span style={detailSectionIconStyle}>{icon}</span>
        <strong style={{ color: '#1f2937', fontSize: 16 }}>{title}</strong>
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

function MiniBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span style={miniBadgeStyle}>
      <span style={miniBadgeIconStyle}>{icon}</span>
      <span>{label}</span>
    </span>
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
  alignItems: 'center',
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

const detailTextPanelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  padding: 16,
  borderRadius: 20,
  border: '1px solid rgba(101, 74, 32, 0.12)',
  background: 'rgba(255,255,255,0.92)',
}

const detailTextPanelTitleStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  color: '#8d4a17',
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: '.08em',
  textTransform: 'uppercase',
}

const detailAutoTextCardStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  minWidth: 220,
  padding: 16,
  borderRadius: 20,
  border: '1px solid rgba(101, 74, 32, 0.12)',
  background: 'rgba(255,255,255,0.92)',
}

const detailAutoImageCardStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  padding: 16,
  borderRadius: 20,
  border: '1px solid rgba(101, 74, 32, 0.12)',
  background: 'rgba(255,255,255,0.92)',
}

const detailInfractionSummaryGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: 14,
}

const detailInfractionSummaryCardStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
  padding: 16,
  borderRadius: 20,
  border: '1px solid rgba(101, 74, 32, 0.12)',
  background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(250,246,239,0.94) 100%)',
  boxShadow: '0 16px 30px rgba(101, 74, 32, 0.07)',
}

const detailInfractionSummaryHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
}

const detailInfractionSummaryIconStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 38,
  height: 38,
  borderRadius: 14,
  background: 'rgba(168, 113, 51, 0.12)',
  color: '#8d4a17',
}

const detailInfractionMetaGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 10,
}

const miniBadgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  minHeight: 34,
  padding: '0 12px',
  borderRadius: 999,
  background: 'rgba(255, 249, 240, 0.96)',
  border: '1px solid rgba(101, 74, 32, 0.12)',
  color: '#8d4a17',
  fontSize: 12,
  fontWeight: 700,
}

const miniBadgeIconStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const detailPeopleGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: 14,
}

const detailPersonCardStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
  padding: 16,
  borderRadius: 20,
  border: '1px solid rgba(101, 74, 32, 0.12)',
  background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(250,246,239,0.94) 100%)',
  boxShadow: '0 16px 30px rgba(101, 74, 32, 0.07)',
}

const detailPersonHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
}

const detailPersonIconStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 40,
  height: 40,
  borderRadius: 14,
  background: 'rgba(168, 113, 51, 0.12)',
  color: '#8d4a17',
}

const detailPersonMetaGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 10,
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

function DetailIconBase({ children }: { children: React.ReactNode }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  )
}

function IconBack() {
  return <DetailIconBase><path d="M15 18 9 12l6-6" /><path d="M9 12h10" /></DetailIconBase>
}

function IconEdit() {
  return <DetailIconBase><path d="M4 20 7.8 19.2 18.4 8.6c.8-.8.8-2 0-2.8l-.2-.2c-.8-.8-2-.8-2.8 0L4.8 16.2 4 20Z" /><path d="m13.8 7.2 3 3" /></DetailIconBase>
}

function IconClock() {
  return <DetailIconBase><circle cx="12" cy="12" r="8" /><path d="M12 8v4.5l3 1.5" /></DetailIconBase>
}

function IconShield() {
  return <DetailIconBase><path d="M12 4 18 6.5V12c0 3.4-2.3 6.4-6 8-3.7-1.6-6-4.6-6-8V6.5L12 4Z" /></DetailIconBase>
}

function IconInfo() {
  return <DetailIconBase><circle cx="12" cy="12" r="8" /><path d="M12 10v5" /><circle cx="12" cy="7.5" r=".6" fill="currentColor" stroke="none" /></DetailIconBase>
}

function IconMapPin() {
  return <DetailIconBase><path d="M12 20s6-5.4 6-10a6 6 0 1 0-12 0c0 4.6 6 10 6 10Z" /><circle cx="12" cy="10" r="2.2" /></DetailIconBase>
}

function IconPinpoint() {
  return <DetailIconBase><circle cx="12" cy="12" r="7" /><circle cx="12" cy="12" r="2.2" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2" /></DetailIconBase>
}

function IconClipboard() {
  return <DetailIconBase><rect x="7" y="5" width="10" height="15" rx="2" /><path d="M10 5.5h4M10 10h4M10 13.5h4" /><path d="M9.5 3.5h5" /></DetailIconBase>
}

function IconCamera() {
  return <DetailIconBase><path d="M5 8h14v10H5z" /><path d="M9 8 10.5 6h3L15 8" /><circle cx="12" cy="13" r="2.8" /></DetailIconBase>
}

function IconLayers() {
  return <DetailIconBase><rect x="5" y="5" width="6" height="6" rx="1.4" /><rect x="13" y="5" width="6" height="6" rx="1.4" /><rect x="5" y="13" width="6" height="6" rx="1.4" /><rect x="13" y="13" width="6" height="6" rx="1.4" /></DetailIconBase>
}

function IconAlert() {
  return <DetailIconBase><path d="M12 4 4 19h16L12 4Z" /><path d="M12 10v4" /><circle cx="12" cy="16.5" r=".6" fill="currentColor" stroke="none" /></DetailIconBase>
}

function IconPeople() {
  return <DetailIconBase><path d="M16 19v-1.4A3.6 3.6 0 0 0 12.4 14H8.6A3.6 3.6 0 0 0 5 17.6V19" /><circle cx="10.5" cy="8.5" r="2.5" /><path d="M15.5 10.2a2.3 2.3 0 1 0 0-4.6" /><path d="M18.6 18.8v-1.2A3 3 0 0 0 16 14.7" /></DetailIconBase>
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
