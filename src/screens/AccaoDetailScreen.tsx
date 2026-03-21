import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Card } from '../components'
import { useAuth } from '../contexts/AuthContext'
import { ASCApi, AccoesApi, MaterialApi, type ModelASC, type ModelAccoes, type ModelMaterial } from '../services'

export default function AccaoDetailScreen() {
  const { getApiConfig, getAuthorizationHeaderValue, logout } = useAuth()
  const api = useMemo(() => new AccoesApi(getApiConfig()), [getApiConfig])
  const ascApi = useMemo(() => new ASCApi(getApiConfig()), [getApiConfig])
  const materialApi = useMemo(() => new MaterialApi(getApiConfig()), [getApiConfig])
  const authHeader = useMemo(() => getAuthorizationHeaderValue(), [getAuthorizationHeaderValue])
  const id = useMemo(() => window.location.pathname.split('/').filter(Boolean)[1] || '', [])

  const [accao, setAccao] = useState<ModelAccoes | null>(null)
  const [ascs, setAscs] = useState<ModelASC[]>([])
  const [materials, setMaterials] = useState<ModelMaterial[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [beforeCount, setBeforeCount] = useState<number | null>(null)
  const [afterCount, setAfterCount] = useState<number | null>(null)
  const [beforeAmount, setBeforeAmount] = useState<number | null>(null)
  const [afterAmount, setAfterAmount] = useState<number | null>(null)

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
      const [{ data: actionData }, { data: ascsData }, { data: materialsData }] = await Promise.all([
        api.privateAccoesIdGet(id, authHeader),
        ascApi.privateAscsGet(authHeader, -1, undefined, 'name', 'asc'),
        materialApi.privateMateriaisGet(authHeader, -1, undefined, 'name', 'asc'),
      ])
      if ([actionData, ascsData, materialsData].some((entry) => isUnauthorizedBody(entry))) {
        logout('Sessão expirada. Inicie sessão novamente.')
        return
      }
      const payload: any = actionData as any
      const current = normalizeAccaoPayload(payload) as ModelAccoes
      setAccao(current)
      setBeforeCount(typeof payload?.before_count === 'number' ? payload.before_count : null)
      setAfterCount(typeof payload?.after_count === 'number' ? payload.after_count : null)
      setBeforeAmount(typeof payload?.before_amount === 'number' ? payload.before_amount : null)
      setAfterAmount(typeof payload?.after_amount === 'number' ? payload.after_amount : null)
      setAscs((ascsData as any).items ?? [])
      setMaterials((materialsData as any).items ?? [])
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 401 || isUnauthorizedBody(err?.response?.data)) {
        logout('Sessão expirada. Inicie sessão novamente.')
        return
      }
      setError(!status ? 'Sem ligação ao servidor.' : 'Falha a obter ação.')
    } finally {
      setLoading(false)
    }
  }, [api, ascApi, authHeader, id, logout, materialApi])

  useEffect(() => { load() }, [load])

  function voltar() {
    window.history.pushState({}, '', '/accoes')
    window.dispatchEvent(new Event('locationchange'))
  }

  function editar() {
    window.history.pushState({}, '', `/accoes/${id}/editar`)
    window.dispatchEvent(new Event('locationchange'))
  }

  const resolveAsc = useCallback((currentId?: string) => {
    const item = ascs.find((entry) => entry.id === currentId)
    return item?.name || currentId || '-'
  }, [ascs])

  const actionMaterials = useMemo(() => {
    const attached = (accao as any)?.materiais
    if (Array.isArray(attached) && attached.length) return attached as ModelMaterial[]
    return []
  }, [accao])

  const materialNames = useMemo(() => {
    if (actionMaterials.length) return actionMaterials.map((material) => material.name || material.id).filter(Boolean)
    return materials.map((material) => material.name || material.id).filter(Boolean)
  }, [actionMaterials, materials])

  const metrics = useMemo(() => {
    const deltaCount = beforeCount != null && afterCount != null ? afterCount - beforeCount : null
    const deltaAmount = beforeAmount != null && afterAmount != null ? afterAmount - beforeAmount : null
    const pctCount = beforeCount != null && beforeCount !== 0 && deltaCount != null ? (deltaCount / beforeCount) * 100 : null
    const pctAmount = beforeAmount != null && beforeAmount !== 0 && deltaAmount != null ? (deltaAmount / beforeAmount) * 100 : null
    return {
      deltaCount,
      deltaAmount,
      pctCount,
      pctAmount,
      countBetter: beforeCount != null && afterCount != null ? afterCount < beforeCount : null,
      amountBetter: beforeAmount != null && afterAmount != null ? afterAmount < beforeAmount : null,
    }
  }, [afterAmount, afterCount, beforeAmount, beforeCount])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={screenHeroStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={screenEyebrowStyle}>Ações</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <h2 style={{ margin: 0, fontSize: 30, lineHeight: 1.05, color: '#1f2937' }}>Detalhe da ação</h2>
            <p style={{ margin: 0, color: '#5f6673', lineHeight: 1.6 }}>
              Consulte a implementação, o enquadramento financeiro e o impacto medido antes e depois da ação.
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
            <span>Editar ação</span>
          </button>
        </div>
      </div>

      {loading ? <div style={infoBannerStyle}>A carregar…</div> : null}
      {error ? <div style={errorBannerStyle}>{error}</div> : null}

      {!loading && !error && accao ? (
        <>
          <Card title="Dados gerais">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={detailOverviewStyle}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0, flex: 1 }}>
                  <div style={detailOverviewEyebrowStyle}>Ação</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <strong style={{ fontSize: 28, lineHeight: 1.05, color: '#1f2937' }}>
                      {accao.accoes || '-'}
                    </strong>
                    <span style={{ color: '#5f6673', lineHeight: 1.6 }}>
                      {resolveAsc(accao.asc_id)} · {actionMaterials.length} material{actionMaterials.length === 1 ? '' : 'ais'} associado{actionMaterials.length === 1 ? '' : 's'}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <StatusPill icon={<IconClock />} label="Criado em" value={formatDateTime(accao.created_at)} />
                  <StatusPill icon={<IconMoney />} label="Valor" value={formatMoney(accao.amount)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                <DetailSectionCard
                  icon={<IconCalendar />}
                  title="Implementação"
                  description="Contexto temporal e enquadramento base da ação."
                  items={[
                    { label: 'Data de implementação', value: formatDateTime(accao.data_implementacao) },
                    { label: 'Meses de análise', value: accao.meses_analise != null ? String(accao.meses_analise) : '-' },
                    { label: 'ASC', value: resolveAsc(accao.asc_id) },
                  ]}
                />
                <DetailSectionCard
                  icon={<IconMoney />}
                  title="Financeiro"
                  description="Valor registado e leitura rápida do efeito monetário."
                  items={[
                    { label: 'Valor', value: formatMoney(accao.amount) },
                    { label: 'Montante antes', value: formatMoney(beforeAmount ?? undefined) },
                    { label: 'Montante depois', value: formatMoney(afterAmount ?? undefined) },
                  ]}
                />
                <DetailSectionCard
                  icon={<IconLayer />}
                  title="Materiais"
                  description="Materiais associados à execução e à análise desta ação."
                  items={[
                    { label: 'Total', value: String(actionMaterials.length) },
                    { label: 'Principal', value: materialNames[0] || '-' },
                    { label: 'ID do registo', value: accao.id || '-' },
                  ]}
                />
              </div>
            </div>
          </Card>

          <Card title="Impacto" subtitle="Comparação entre o cenário antes e depois da implementação.">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
              <ImpactCard
                title="Quantidade"
                beforeValue={beforeCount != null ? String(beforeCount) : '—'}
                afterValue={afterCount != null ? String(afterCount) : '—'}
                deltaValue={metrics.deltaCount != null ? `${metrics.deltaCount > 0 ? '+' : ''}${metrics.deltaCount}` : '—'}
                pctValue={metrics.pctCount != null ? `${metrics.pctCount.toFixed(1)}%` : '—'}
                positive={metrics.countBetter}
              />
              <ImpactCard
                title="Montante"
                beforeValue={formatMoney(beforeAmount ?? undefined)}
                afterValue={formatMoney(afterAmount ?? undefined)}
                deltaValue={metrics.deltaAmount != null ? `${metrics.deltaAmount > 0 ? '+' : ''}${formatMoney(metrics.deltaAmount)}` : '—'}
                pctValue={metrics.pctAmount != null ? `${metrics.pctAmount.toFixed(1)}%` : '—'}
                positive={metrics.amountBetter}
              />
            </div>
          </Card>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1.1fr) minmax(300px, 0.9fr)', gap: 16 }}>
            <Card title="Materiais associados" subtitle="Lista de materiais ligados à ação." style={pairedDetailCardStyle}>
              {actionMaterials.length ? (
                <div style={nearbyListStyle}>
                  {actionMaterials.map((material, index) => (
                    <div key={material.id || index} style={contextCardStyle}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <span style={contextCardIconStyle}>
                          <IconBox />
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <strong style={{ color: '#1f2937' }}>{material.name || material.id}</strong>
                          <span style={{ color: '#7b8494', fontSize: 13 }}>Material associado à ação.</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={infoBannerStyle}>Sem materiais associados a esta ação.</div>
              )}
            </Card>

            <Card title="Leitura rápida" subtitle="Síntese dos números principais da ação." style={pairedDetailCardStyle}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <span style={summaryChipStyle}>Valor: {formatMoney(accao.amount)}</span>
                <span style={summaryChipStyle}>ASC: {resolveAsc(accao.asc_id)}</span>
                <span style={summaryChipStyle}>Implementação: {formatDateTime(accao.data_implementacao)}</span>
                <span style={summaryChipStyle}>Materiais: {actionMaterials.length}</span>
                <span style={summaryChipStyle}>Meses análise: {accao.meses_analise != null ? String(accao.meses_analise) : '-'}</span>
              </div>
            </Card>
          </div>

        </>
      ) : null}
    </div>
  )
}

function normalizeAccaoPayload(payload: any) {
  const wrapped = payload?.accoes
  if (wrapped && typeof wrapped === 'object' && !Array.isArray(wrapped)) return wrapped
  return payload ?? {}
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

function ImpactCard({
  title,
  beforeValue,
  afterValue,
  deltaValue,
  pctValue,
  positive,
}: {
  title: string
  beforeValue: string
  afterValue: string
  deltaValue: string
  pctValue: string
  positive: boolean | null
}) {
  const accentStyle = positive == null ? impactNeutralStyle : positive ? impactPositiveStyle : impactNegativeStyle

  return (
    <div style={{ ...impactCardStyle, ...accentStyle }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={impactLabelStyle}>{title}</span>
        <strong style={{ color: '#1f2937', fontSize: 18 }}>{afterValue}</strong>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <MetricPill label="Antes" value={beforeValue} />
        <MetricPill label="Depois" value={afterValue} />
        <MetricPill label="Variação" value={deltaValue} />
        <MetricPill label="Percentagem" value={pctValue} />
      </div>
    </div>
  )
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div style={metricPillStyle}>
      <span style={metricPillLabelStyle}>{label}</span>
      <strong style={metricPillValueStyle}>{value || '-'}</strong>
    </div>
  )
}

function formatDateTime(iso?: string) {
  if (!iso) return '-'
  try {
    const date = new Date(iso)
    if (Number.isNaN(date.getTime())) return '-'
    return date.toLocaleDateString('pt-PT')
  } catch {
    return '-'
  }
}

function formatMoney(n?: number) {
  if (typeof n !== 'number' || Number.isNaN(n)) return '—'
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
      <path d="M4 7.5C4 6.7 4.7 6 5.5 6H18.5C19.3 6 20 6.7 20 7.5V16.5C20 17.3 19.3 18 18.5 18H5.5C4.7 18 4 17.3 4 16.5V7.5Z" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M7.5 9H7.51" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M16.5 15H16.51" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}

function IconCalendar() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="6" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 4V8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M16 4V8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M4 10H20" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

function IconLayer() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 4L20 8L12 12L4 8L12 4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M4 12L12 16L20 12" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M4 16L12 20L20 16" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
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

const nearbyListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
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

const impactCardStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
  padding: '18px',
  borderRadius: 22,
  border: '1px solid rgba(101, 74, 32, 0.12)',
  background: '#fffdf8',
}

const impactNeutralStyle: React.CSSProperties = {
  boxShadow: '0 12px 30px rgba(76, 57, 24, 0.06)',
}

const impactPositiveStyle: React.CSSProperties = {
  background: 'linear-gradient(180deg, rgba(239, 250, 246, 0.98) 0%, rgba(220, 245, 235, 0.92) 100%)',
  border: '1px solid rgba(15, 118, 110, 0.18)',
}

const impactNegativeStyle: React.CSSProperties = {
  background: 'linear-gradient(180deg, rgba(255, 243, 242, 0.98) 0%, rgba(254, 228, 226, 0.92) 100%)',
  border: '1px solid rgba(180, 35, 24, 0.18)',
}

const impactLabelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: '.12em',
  textTransform: 'uppercase',
  color: '#7b8494',
}

const metricPillStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  padding: '12px 14px',
  borderRadius: 16,
  border: '1px solid rgba(101, 74, 32, 0.10)',
  background: 'rgba(255, 255, 255, 0.68)',
}

const metricPillLabelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: '.08em',
  textTransform: 'uppercase',
  color: '#7b8494',
}

const metricPillValueStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 800,
  color: '#1f2937',
}
