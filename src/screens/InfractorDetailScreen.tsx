import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Card } from '../components'
import { useAuth } from '../contexts/AuthContext'
import {
  InfractionApi,
  InfractorApi,
  MaterialApi,
  SectorInfracaoApi,
  TipoInfracaoApi,
  type ModelInfraction,
  type ModelInfractor,
  type ModelMaterial,
  type ModelSectorInfracao,
  type ModelTipoInfracao,
} from '../services'

export default function InfractorDetailScreen() {
  const { getApiConfig, getAuthorizationHeaderValue, logout } = useAuth()
  const api = useMemo(() => new InfractorApi(getApiConfig()), [getApiConfig])
  const infractionApi = useMemo(() => new InfractionApi(getApiConfig()), [getApiConfig])
  const sectorApi = useMemo(() => new SectorInfracaoApi(getApiConfig()), [getApiConfig])
  const tipoApi = useMemo(() => new TipoInfracaoApi(getApiConfig()), [getApiConfig])
  const materialApi = useMemo(() => new MaterialApi(getApiConfig()), [getApiConfig])
  const authHeader = useMemo(() => getAuthorizationHeaderValue(), [getAuthorizationHeaderValue])

  const id = useMemo(() => window.location.pathname.split('/').filter(Boolean)[1] || '', [])

  const [item, setItem] = useState<ModelInfractor | null>(null)
  const [infraction, setInfraction] = useState<ModelInfraction | null>(null)
  const [setores, setSetores] = useState<ModelSectorInfracao[]>([])
  const [tipos, setTipos] = useState<ModelTipoInfracao[]>([])
  const [materiais, setMateriais] = useState<ModelMaterial[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
      const [{ data: infractorData }, { data: setoresData }, { data: tiposData }, { data: materiaisData }] = await Promise.all([
        api.privateInfractorsIdGet(id, authHeader),
        sectorApi.privateSectorInfracaoGet(authHeader, -1, undefined, 'name', 'asc'),
        tipoApi.privateTiposInfracaoGet(authHeader, -1, undefined, 'name', 'asc'),
        materialApi.privateMateriaisGet(authHeader, -1, undefined, 'name', 'asc'),
      ])
      if ([infractorData, setoresData, tiposData, materiaisData].some((entry) => isUnauthorizedBody(entry))) {
        logout('Sessão expirada. Inicie sessão novamente.')
        return
      }

      const currentItem = infractorData as ModelInfractor
      setItem(currentItem)
      setSetores((setoresData as any).items ?? [])
      setTipos((tiposData as any).items ?? [])
      setMateriais((materiaisData as any).items ?? [])

      if (currentItem.infraction_id) {
        const { data: infractionData } = await infractionApi.privateInfractionsIdGet(currentItem.infraction_id, authHeader)
        if (isUnauthorizedBody(infractionData)) {
          logout('Sessão expirada. Inicie sessão novamente.')
          return
        }
        setInfraction(infractionData as ModelInfraction)
      } else {
        setInfraction(null)
      }
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 401 || isUnauthorizedBody(err?.response?.data)) {
        logout('Sessão expirada. Inicie sessão novamente.')
        return
      }
      setError(!status ? 'Sem ligação ao servidor.' : 'Falha a obter infractor.')
    } finally {
      setLoading(false)
    }
  }, [api, authHeader, id, infractionApi, logout, materialApi, sectorApi, tipoApi])

  useEffect(() => { load() }, [load])

  const resolveNome = (arr: { id?: string; name?: string }[], currentId?: string) => {
    if (!currentId) return '-'
    const found = arr.find((entry) => entry.id === currentId)
    return found?.name || currentId
  }

  const materialLabel = useMemo(() => {
    if (!infraction) return '-'
    const materialId = (infraction as any).material_id
    const fromRelation = (infraction as any).material?.name
    if (fromRelation) return fromRelation
    if (materialId) {
      const material = materiais.find((entry) => entry.id === materialId)
      if (material?.name) return material.name
    }
    return (infraction as any).tipo_material || materialId || '-'
  }, [infraction, materiais])

  function voltar() {
    if (window.location.pathname !== '/infractores') window.history.pushState({}, '', '/infractores')
    window.dispatchEvent(new Event('locationchange'))
  }

  function editar() {
    if (!id) return
    window.history.pushState({}, '', `/infractores/${id}/editar`)
    window.dispatchEvent(new Event('locationchange'))
  }

  function abrirInfracao() {
    if (!item?.infraction_id) return
    window.history.pushState({}, '', `/infracoes/${item.infraction_id}`)
    window.dispatchEvent(new Event('locationchange'))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={screenHeroStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={screenEyebrowStyle}>Infractores</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <h2 style={{ margin: 0, fontSize: 30, lineHeight: 1.05, color: '#1f2937' }}>Detalhe do infractor</h2>
            <p style={{ margin: 0, color: '#5f6673', lineHeight: 1.6 }}>
              Consulte a identificação do infractor, o enquadramento do registo e a infração associada.
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
            <span>Editar infractor</span>
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
                  <div style={detailOverviewEyebrowStyle}>Infractor</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <strong style={{ fontSize: 28, lineHeight: 1.05, color: '#1f2937' }}>
                      {item.nome || '-'}
                    </strong>
                    <span style={{ color: '#5f6673', lineHeight: 1.6 }}>
                      {item.tipo_identificacao || 'Tipo de identificação não indicado'} · {item.nr_identificacao || 'Documento não indicado'}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <StatusPill icon={<IconClock />} label="Criado em" value={formatDateTime(item.created_at)} />
                  <StatusPill icon={<IconRefresh />} label="Atualizado em" value={formatDateTime(item.updated_at)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                <DetailSectionCard
                  icon={<IconUser />}
                  title="Identificação"
                  description="Elementos pessoais principais usados no registo."
                  items={[
                    { label: 'Nome', value: item.nome || '-' },
                    { label: 'ID do registo', value: item.id || '-' },
                    { label: 'Ligação à infração', value: item.infraction_id || 'Sem associação' },
                  ]}
                />
                <DetailSectionCard
                  icon={<IconDocument />}
                  title="Documento"
                  description="Metadados do documento apresentado no processo."
                  items={[
                    { label: 'Tipo', value: item.tipo_identificacao || '-' },
                    { label: 'Número', value: item.nr_identificacao || '-' },
                    { label: 'Estado', value: item.nr_identificacao ? 'Documentado' : 'Sem documento' },
                  ]}
                />
                <DetailSectionCard
                  icon={<IconLink />}
                  title="Registo"
                  description="Informação cronológica e referência operacional."
                  items={[
                    { label: 'Criado em', value: formatDateTime(item.created_at) },
                    { label: 'Atualizado em', value: formatDateTime(item.updated_at) },
                    { label: 'Contexto', value: item.infraction_id ? 'Associado a uma infração' : 'Registo isolado' },
                  ]}
                />
              </div>
            </div>
          </Card>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1.1fr) minmax(280px, 0.9fr)', gap: 16 }}>
            <Card title="Infração associada" subtitle="Resumo do registo de infração ligado a este infractor." style={pairedDetailCardStyle}>
              {infraction ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={contextCardStyle}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <span style={contextCardIconStyle}>
                        <IconAlert />
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <strong style={{ color: '#1f2937', fontSize: 18 }}>
                          {resolveNome(tipos, infraction.tipo_infracao_id)}
                        </strong>
                        <span style={{ color: '#5f6673', lineHeight: 1.6 }}>
                          {resolveNome(setores, infraction.sector_infracao_id)} · {materialLabel}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
                    <Field label="Quantidade" value={infraction.quantidade != null ? String(infraction.quantidade) : '-'} />
                    <Field label="Valor" value={infraction.valor != null ? formatMoney(infraction.valor) : '-'} />
                    <Field label="Criada em" value={formatDateTime(infraction.created_at)} />
                    <Field label="Material" value={materialLabel} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <button type="button" onClick={abrirInfracao} style={detailSecondaryActionStyle}>
                      <IconOpen />
                      <span>Abrir infração</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div style={infoBannerStyle}>Sem infração associada a este infractor.</div>
              )}
            </Card>

            <Card title="Leitura rápida" subtitle="Resumo imediato dos elementos mais relevantes." style={pairedDetailCardStyle}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <span style={summaryChipStyle}>Tipo doc.: {item.tipo_identificacao || '-'}</span>
                <span style={summaryChipStyle}>Documento: {item.nr_identificacao || '-'}</span>
                <span style={summaryChipStyle}>Associação: {item.infraction_id ? 'Com infração' : 'Sem infração'}</span>
                <span style={summaryChipStyle}>Criado: {formatDateTime(item.created_at)}</span>
                <span style={summaryChipStyle}>Atualizado: {formatDateTime(item.updated_at)}</span>
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

function IconOpen() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M14 5H19V10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 14L19 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 14V18C19 18.6 18.6 19 18 19H6C5.4 19 5 18.6 5 18V6C5 5.4 5.4 5 6 5H10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
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

function IconRefresh() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M19 8V4M19 4H15M19 4L14.8 8.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 12C19 15.9 15.9 19 12 19C8.1 19 5 15.9 5 12C5 8.1 8.1 5 12 5C13.8 5 15.5 5.7 16.7 6.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconUser() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5 19C6.7 16.7 9 15.5 12 15.5C15 15.5 17.3 16.7 19 19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function IconDocument() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 4.5H14.5L18 8V19.5H7V4.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M14 4.5V8.5H18" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9.5 12H15.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M9.5 15.5H13.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function IconLink() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M10 14L14 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8 16H7C5.3 16 4 14.7 4 13C4 11.3 5.3 10 7 10H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M16 8H17C18.7 8 20 9.3 20 11C20 12.7 18.7 14 17 14H15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function IconAlert() {
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

const detailPrimaryActionStyle: React.CSSProperties = {
  ...detailSecondaryActionStyle,
  border: '1px solid rgba(201, 109, 31, 0.20)',
  background: 'linear-gradient(180deg, #d77a28 0%, #b85d18 100%)',
  color: '#fffaf5',
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

const fieldCardStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  minWidth: 0,
  padding: '14px 16px',
  borderRadius: 18,
  border: '1px solid rgba(101, 74, 32, 0.10)',
  background: '#fffdf8',
}

const fieldLabelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: '.1em',
  textTransform: 'uppercase',
  color: '#7b8494',
}

const fieldValueStyle: React.CSSProperties = {
  color: '#1f2937',
  fontSize: 14,
  fontWeight: 700,
  overflowWrap: 'anywhere',
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
