import React, { useEffect, useMemo, useState } from 'react'
import { Button, Card } from '../components'
import { useAuth } from '../contexts/AuthContext'
import {
  InstalacaoAccoesApi,
  InstallationsApi,
  ComprasApi,
  EquipamentosApi,
  type ModelInstalacaoAccoes,
  type ModelInstallation,
  type ModelCompras,
  type ModelEquipamentos,
} from '../services'

export default function ClienteAccaoDetailScreen() {
  const id = useMemo(() => (window.location.pathname.split('/').pop() || '').trim(), [])
  const { getApiConfig, getAuthorizationHeaderValue, logout } = useAuth()
  const api = useMemo(() => new InstalacaoAccoesApi(getApiConfig()), [getApiConfig])
  const instApi = useMemo(() => new InstallationsApi(getApiConfig()), [getApiConfig])
  const comprasApi = useMemo(() => new ComprasApi(getApiConfig()), [getApiConfig])
  const eqApi = useMemo(() => new EquipamentosApi(getApiConfig()), [getApiConfig])
  const authHeader = useMemo(() => getAuthorizationHeaderValue(), [getAuthorizationHeaderValue])

  const [accao, setAccao] = useState<ModelInstalacaoAccoes | null>(null)
  const [inst, setInst] = useState<ModelInstallation | null>(null)
  const [compras, setCompras] = useState<ModelCompras[]>([])
  const [equipamentos, setEquipamentos] = useState<ModelEquipamentos[]>([])
  const [ui, setUi] = useState<{ loading: boolean; error: string | null }>({ loading: false, error: null })

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

  useEffect(() => {
    (async () => {
      setUi({ loading: true, error: null })
      try {
        // 1) Carregar ação
        const { data: acc } = await api.privateInstalacaoAccoesIdGet(id, authHeader)
        if (isUnauthorizedBody(acc)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
        const a = (acc as any) as ModelInstalacaoAccoes
        setAccao(a)

        // 2) Carregar compras por PF (se existir)
        if (a?.pf) {
          try {
            const { data: comp } = await comprasApi.privateComprasPfGet(a.pf, authHeader)
            if (!isUnauthorizedBody(comp)) setCompras(((comp as any)?.items) ?? [])
          } catch {}
        }

        // 3) Carregar instalação (para obter inspecao_id e métricas)
        if (a?.pf) {
          try {
            const { data: installations } = await instApi.privateInstallationsGet(authHeader, 1, 1, undefined, undefined, a.pf)
            if (!isUnauthorizedBody(installations)) {
              const items = ((installations as any)?.items) ?? []
              if (items.length > 0) {
                const i = items[0]
                setInst(i as any)
                const inspecId = (i as any)?.inspecao_id
                if (inspecId) {
                  try {
                    const { data: eq } = await eqApi.privateEquipamentosInspeccaoIdGet(inspecId, authHeader)
                    if (!isUnauthorizedBody(eq)) setEquipamentos(((eq as any)?.items) ?? [])
                  } catch {}
                }
              }
            }
          } catch {}
        }

      } catch (err: any) {
        const status = err?.response?.status
        setUi({ loading: false, error: !status ? 'Sem ligação ao servidor.' : status >= 500 ? 'Erro do servidor ao carregar detalhes da ação.' : 'Falha a obter detalhes.' })
        return
      }
      setUi({ loading: false, error: null })
    })()
  }, [api, instApi, comprasApi, eqApi, id, authHeader])

  const goBack = () => {
    const path = '/instalacoes/accoes'
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path)
      window.dispatchEvent(new Event('locationchange'))
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={screenHeroStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={screenEyebrowStyle}>Ação de cliente</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <h2 style={{ margin: 0, fontSize: 30, lineHeight: 1.05, color: '#1f2937' }}>
              {(accao as any)?.accao_tipo?.nome || (accao as any)?.accao_tipo_id || 'Detalhe da ação'}
            </h2>
            <p style={{ margin: 0, color: '#5f6673', lineHeight: 1.6 }}>
              Consulte o contexto do cliente, a execução da ação e o comportamento de compras antes e depois.
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button type="button" onClick={goBack} style={heroSecondaryButtonStyle}>Voltar</button>
        </div>
      </div>

      {ui.loading ? <div style={infoBannerStyle}>A carregar detalhes da ação…</div> : null}
      {ui.error ? <div style={errorBannerStyle}>{ui.error}</div> : null}

      <Card title="Dados da ação" subtitle="Informação principal da execução, estado e enquadramento do cliente.">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={detailOverviewStyle}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0, flex: 1 }}>
              <span style={detailOverviewEyebrowStyle}>Cliente</span>
              <strong style={{ fontSize: 26, lineHeight: 1.05, color: '#1f2937' }}>{accao?.pf || 'PF indisponível'}</strong>
              <span style={{ color: '#5f6673', lineHeight: 1.6 }}>
                Executada em {formatDate(accao?.data_execucao)} · Criada em {formatDate(accao?.created_at)}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <span style={statusPillStyle('#fff9e8', '#a16207', 'rgba(202, 138, 4, 0.18)')}>{accao?.marcacao_status || '—'}</span>
              <span style={statusPillStyle('#eff6ff', '#3056a6', 'rgba(48, 86, 166, 0.14)')}>{accao?.analise_status || '—'}</span>
              <span style={trendPillStyle(accao?.tendencia_compras)}>{formatTendencia(accao?.tendencia_compras)}</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14 }}>
            <Metric label="Tipo de ação" value={(accao as any)?.accao_tipo?.nome || (accao as any)?.accao_tipo_id || '—'} color="#8d4a17" />
            <Metric label="Valor recuperado" value={formatMoney(accao?.valor_recuperado)} color="#0f766e" />
            <Metric label="Compras (6m)" value={formatKwh(inst?.compras_6_meses)} color="#3056a6" />
            <Metric label="Score" value={formatPercentage(inst?.score)} color="#c96d1f" />
          </div>

          {accao?.comentario ? (
            <div style={commentCardStyle}>
              <span style={commentLabelStyle}>Comentário</span>
              <div style={{ color: '#3f4652', lineHeight: 1.6 }}>{accao?.comentario}</div>
            </div>
          ) : null}
        </div>
      </Card>

      <Card title="Compras (últimos períodos)" subtitle="Leitura temporal das compras em torno da ação.">
        <ComprasChart data={compras} actionDate={accao?.data_execucao} actionLabel={(accao as any)?.accao_tipo?.nome || (accao as any)?.accao_tipo_id || 'Ação'} />
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) minmax(320px, 1fr)', gap: 16, alignItems: 'stretch' }}>
        <Card title="Equipamentos" subtitle="Inventário associado à inspeção encontrada para o cliente.">
          <EquipamentosList items={equipamentos} emptyHint={!inst?.inspecao_id ? 'Sem inspeção associada para este mês.' : 'Sem equipamentos registados.'} />
        </Card>
        <Card title="Compras" subtitle="Lista de compras usada para a leitura temporal e comparação antes/depois.">
          <ComprasList items={compras} />
        </Card>
      </div>

      <Card title="Antes vs Depois (kWh)" subtitle="Totais nos 6 meses antes e depois da ação">
        <BeforeAfterPurchases data={compras} actionDate={accao?.data_execucao} months={6} />
      </Card>

      <Card title="Resumo do mês da ação" subtitle="Indicadores da instalação no mês em que a ação foi registada.">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          <Metric label="Compras (últ. 6m)" value={formatKwh(inst?.compras_6_meses)} color="#0ea5e9" />
          <Metric label="Compras vizinhos (6m)" value={formatKwh(inst?.compras_vizinhos_6_meses)} color="#6366f1" />
          <Metric label="Consumo estimado" value={formatKwh(inst?.equipamentos_6_meses)} color="#10b981" />
          <Metric label="Score" value={formatPercentage(inst?.score)} color="#f59e0b" />
          <Metric label="AI Score" value={formatPercentage(inst?.ai_score)} color="#ef4444" />
        </div>
      </Card>
    </div>
  )
}

function toMonthStart(iso?: string) {
  if (!iso) return new Date().toISOString().slice(0, 10)
  try {
    const d = new Date(iso as any)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    return `${y}-${m}-01`
  } catch { return new Date().toISOString().slice(0, 10) }
}

function Metric({ label, value, color = '#111827' }: { label: string; value: string | number; color?: string }) {
  return (
    <div style={{ background: '#fffdf8', border: `1px solid ${hexToRgba(color, 0.16)}`, borderRadius: 18, padding: '16px 18px', boxShadow: '0 12px 24px rgba(76, 57, 24, 0.06)' }}>
      <div style={{ fontSize: 12, color, marginBottom: 8, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontWeight: 800, fontSize: 22, lineHeight: 1.1, color: '#1f2937' }}>{value as any}</div>
    </div>
  )
}

function ComprasChart({ data = [] as ModelCompras[], actionDate, actionLabel }: { data?: ModelCompras[]; actionDate?: string; actionLabel?: string }) {
  const clean = (Array.isArray(data) ? data : [])
    .map((d) => ({ ts: toDateMs(d.periodo), total: Number(d.trn_units || 0) }))
    .filter((p) => Number.isFinite(p.ts))
    .sort((a, b) => a.ts - b.ts)
    .slice(-12)

  if (!clean.length) return <div style={{ color: '#6b7280' }}>Sem dados de compras.</div>
  const maxY = Math.max(1, ...clean.map((p) => p.total))
  const tsAction = toDateMs(actionDate)
  const idxAction = Number.isFinite(tsAction) ? clean.findIndex((p) => p.ts >= tsAction) : -1
  let actionPercent: number | null = null
  if (Number.isFinite(tsAction)) {
    if (!clean.length) actionPercent = null
    else if (idxAction === -1) actionPercent = 99
    else if (tsAction < clean[0].ts) actionPercent = 1
    else actionPercent = ((idxAction + 0.88) / clean.length) * 100
  }
  const actionMarkerLabel = actionLabel || 'Ação'
  const gridValues = [1, 0.75, 0.5, 0.25, 0]

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={chartShellStyle}>
        <div style={chartYAxisStyle}>
          {gridValues.map((factor) => (
            <span key={factor} style={chartYAxisLabelStyle}>
              {Math.round(maxY * factor).toLocaleString('pt-PT')} kWh
            </span>
          ))}
        </div>

        <div style={chartPlotWrapStyle}>
          <div style={chartGridStyle}>
            {gridValues.map((factor) => (
              <span key={factor} style={{ ...chartGridLineStyle, top: `${(1 - factor) * 100}%` }} />
            ))}
          </div>

          {actionPercent != null ? (
            <div style={{ ...chartMarkerWrapStyle, left: `${actionPercent}%` }}>
              <div style={chartMarkerLabelStyle}>
                <span style={chartMarkerDotStyle} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <strong style={{ fontSize: 11, color: '#8d4a17', lineHeight: 1.1 }}>{truncateText(actionMarkerLabel, 18)}</strong>
                  <span style={{ fontSize: 10, color: '#9a6b34', lineHeight: 1.1 }}>{formatDate(actionDate)}</span>
                </div>
              </div>
              <span style={chartMarkerLineStyle} />
            </div>
          ) : null}

          <div style={chartBarsRowStyle}>
            {clean.map((point, index) => (
              <div key={index} style={chartBarSlotStyle}>
                <div style={{ ...chartBarStyle, height: `${(point.total / maxY) * 100}%` }} />
                <span style={chartXAxisLabelStyle}>{formatMonth(new Date(point.ts))}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <span style={mapLegendChipStyle}>Barras: compras em kWh</span>
        <span style={mapLegendChipStyle}>Linha vertical: ação executada</span>
      </div>
    </div>
  )
}

function EquipamentosList({ items = [], emptyHint = 'Sem equipamentos.' }: { items: ModelEquipamentos[]; emptyHint?: string }) {
  if (!items.length) return <div style={{ color: '#6b7280' }}>{emptyHint}</div>
  return (
    <div style={tablePanelStyle}>
      <div style={cardContextStripStyle}>
        <span style={mapLegendChipStyle}>Equipamentos: {items.length}</span>
        <span style={mapLegendChipStyle}>Consumo estimado: {formatKwh(items.reduce((sum, item) => sum + Number(item.consumo_estimado || 0), 0))}</span>
      </div>
      <div style={tableScrollWrapStyle}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
            <tr>
              <Th label="Nome" />
              <Th label="Potência" />
              <Th label="Quantidade" />
              <Th label="Consumo estimado (kWh)" />
            </tr>
        </thead>
        <tbody>
          {items.map((e, i) => (
            <tr key={i}>
              <td style={tableCellStyle}><span style={emphasisTextStyle}>{e.nome || '-'}</span></td>
              <td style={tableCellStyle}><span style={secondaryEmphasisTextStyle}>{formatNumber(e.potencia)}</span></td>
              <td style={tableCellStyle}>{formatNumber(e.quantidade)}</td>
              <td style={tableCellStyle}><span style={consumptionBadgeStyle}>{formatKwh(e.consumo_estimado)}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  )
}

function Th({ label }: { label: string }) {
  return (
    <th style={{ textAlign: 'left', padding: '10px 8px', borderBottom: '1px solid rgba(101, 74, 32, 0.12)', whiteSpace: 'nowrap', color: '#3f4652', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.04em' }}>{label}</th>
  )
}

function ComprasList({ items = [] as ModelCompras[] }) {
  if (!items.length) return <div style={{ color: '#6b7280' }}>Sem compras registadas.</div>
  const totalUnits = items.reduce((sum, item) => sum + Number(item.trn_units || 0), 0)
  const totalAmount = items.reduce((sum, item) => sum + Number(item.trn_amount || 0), 0)
  return (
    <div style={tablePanelStyle}>
      <div style={cardContextStripStyle}>
        <span style={mapLegendChipStyle}>Compras: {items.length}</span>
        <span style={mapLegendChipStyle}>Energia: {formatKwh(totalUnits)}</span>
        <span style={mapLegendChipStyle}>Valor: {formatMoney(totalAmount)}</span>
      </div>
      <div style={tableScrollWrapStyle}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <Th label="Período" />
              <Th label="Unidades" />
              <Th label="Valor" />
              <Th label="Nº compras" />
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={`compra-${item.id ?? 'sem-id'}-${item.periodo ?? index}`}>
                <td style={tableCellStyle}><span style={emphasisTextStyle}>{item.periodo || '-'}</span></td>
                <td style={tableCellStyle}><span style={consumptionBadgeStyle}>{formatKwh(item.trn_units)}</span></td>
                <td style={tableCellStyle}>{formatMoney(item.trn_amount)}</td>
                <td style={tableCellStyle}><span style={secondaryEmphasisTextStyle}>{formatNumber(item.no_compras)}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function toDateMs(s?: string) { try { return new Date(String(s || '')).getTime() } catch { return NaN } }
function formatDate(iso?: string) { if (!iso) return '—'; try { const d = new Date(iso as any); if (Number.isNaN(d.getTime())) return '—'; return d.toLocaleDateString('pt-PT') } catch { return '—' } }
function formatMonth(d: Date) { try { return d.toLocaleDateString('pt-PT', { month: 'short' }) } catch { return '' } }
function formatNumber(n?: number) { if (typeof n !== 'number' || Number.isNaN(n)) return '—'; try { return n.toLocaleString('pt-PT') } catch { return String(n) } }
function formatMoney(n?: number) { if (typeof n !== 'number' || Number.isNaN(n)) return '—'; try { return `${n.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT` } catch { return `${n.toFixed(2)} MT` } }
function formatKwh(n?: number) { if (typeof n !== 'number' || Number.isNaN(n)) return '—'; try { return `${n.toLocaleString('pt-PT')} kWh` } catch { return `${n} kWh` } }
function formatPercentage(n?: number) { if (typeof n !== 'number' || Number.isNaN(n)) return '—'; try { const pct = n * 100; return `${pct.toLocaleString('pt-PT', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}%` } catch { return `${(n * 100).toFixed(1)}%` } }
function formatTendencia(t?: any) {
  const v = String(t || '')
  switch (v) {
    case 'CRESCENTE': return 'Crescente'
    case 'MUITO_CRESCENTE': return 'Muito crescente'
    case 'NORMAL': return 'Normal'
    case 'DECRESCENTE': return 'Decrescente'
    case 'MUITO_DECRESCENTE': return 'Muito decrescente'
    case 'SEM_COMPRAS': return 'Sem compras'
    default: return '—'
  }
}

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace('#', '')
  const safe = normalized.length === 3 ? normalized.split('').map((char) => char + char).join('') : normalized
  const value = parseInt(safe, 16)
  const r = (value >> 16) & 255
  const g = (value >> 8) & 255
  const b = value & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function truncateText(value: string, limit: number) {
  if (value.length <= limit) return value
  return `${value.slice(0, Math.max(0, limit - 1))}…`
}

function statusPillStyle(background: string, color: string, borderColor: string): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: 34,
    padding: '0 12px',
    borderRadius: 999,
    background,
    border: `1px solid ${borderColor}`,
    color,
    fontSize: 12,
    fontWeight: 800,
    whiteSpace: 'nowrap',
  }
}

function trendPillStyle(trend?: any): React.CSSProperties {
  const raw = String(trend || '')
  if (raw === 'SEM_COMPRAS') return statusPillStyle('#fff7f6', '#b42318', 'rgba(180, 35, 24, 0.16)')
  if (raw === 'MUITO_DECRESCENTE') return statusPillStyle('#fff4e8', '#c96d1f', 'rgba(201, 109, 31, 0.18)')
  if (raw === 'DECRESCENTE') return statusPillStyle('#fff9e8', '#a16207', 'rgba(202, 138, 4, 0.18)')
  if (raw === 'MUITO_CRESCENTE') return statusPillStyle('#f2fcfa', '#0f766e', 'rgba(15, 118, 110, 0.16)')
  if (raw === 'CRESCENTE') return statusPillStyle('#f0fdf4', '#15803d', 'rgba(34, 197, 94, 0.18)')
  return statusPillStyle('#eff6ff', '#3056a6', 'rgba(48, 86, 166, 0.14)')
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

const infoBannerStyle: React.CSSProperties = {
  padding: '14px 16px',
  borderRadius: 16,
  background: 'rgba(255, 252, 246, 0.9)',
  border: '1px solid rgba(101, 74, 32, 0.12)',
  color: '#5f6673',
}

const errorBannerStyle: React.CSSProperties = {
  padding: '14px 16px',
  borderRadius: 16,
  background: '#fff7f6',
  border: '1px solid rgba(180, 35, 24, 0.14)',
  color: '#991b1b',
}

const detailOverviewStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 16,
  flexWrap: 'wrap',
  padding: '18px 20px',
  borderRadius: 22,
  background: 'linear-gradient(135deg, rgba(255, 253, 248, 0.96) 0%, rgba(244, 236, 221, 0.92) 100%)',
  border: '1px solid rgba(101, 74, 32, 0.12)',
}

const detailOverviewEyebrowStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: '.12em',
  textTransform: 'uppercase',
  color: '#8d4a17',
}

const commentCardStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  padding: '16px 18px',
  borderRadius: 18,
  border: '1px solid rgba(101, 74, 32, 0.12)',
  background: '#fffdf8',
}

const commentLabelStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#7b8494',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '.06em',
}

const heroSecondaryButtonStyle: React.CSSProperties = {
  minHeight: 46,
  padding: '0 16px',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  borderRadius: 14,
  border: '1px solid rgba(101, 74, 32, 0.16)',
  background: 'linear-gradient(180deg, #fffaf2 0%, #f6ecde 100%)',
  color: '#8d4a17',
  fontWeight: 700,
  boxShadow: '0 10px 24px rgba(76, 57, 24, 0.08)',
  cursor: 'pointer',
}

const mapLegendChipStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  minHeight: 34,
  padding: '0 12px',
  borderRadius: 999,
  background: '#fffdf8',
  border: '1px solid rgba(101, 74, 32, 0.12)',
  color: '#5f6673',
  fontSize: 12,
  fontWeight: 700,
}

const tablePanelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  height: '100%',
}

const cardContextStripStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
}

const tableScrollWrapStyle: React.CSSProperties = {
  overflowX: 'auto',
  overflowY: 'auto',
  maxHeight: 420,
  minHeight: 420,
  borderRadius: 18,
  border: '1px solid rgba(101, 74, 32, 0.08)',
  background: '#fffdf8',
}

const tableCellStyle: React.CSSProperties = {
  padding: '12px 8px',
  borderBottom: '1px solid rgba(101, 74, 32, 0.08)',
  color: '#4b5563',
  fontSize: 13,
  lineHeight: 1.5,
}

const emphasisTextStyle: React.CSSProperties = {
  color: '#1f2937',
  fontSize: 13,
  fontWeight: 800,
  letterSpacing: '-0.01em',
}

const secondaryEmphasisTextStyle: React.CSSProperties = {
  color: '#374151',
  fontSize: 12,
  fontWeight: 700,
}

const consumptionBadgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  minHeight: 32,
  padding: '0 12px',
  borderRadius: 999,
  background: 'rgba(48, 86, 166, 0.08)',
  color: '#3056a6',
  fontSize: 13,
  fontWeight: 800,
}

const chartShellStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '92px minmax(0, 1fr)',
  gap: 18,
  alignItems: 'stretch',
  minHeight: 360,
}

const chartYAxisStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  paddingTop: 44,
  paddingBottom: 24,
}

const chartYAxisLabelStyle: React.CSSProperties = {
  color: '#7b8494',
  fontSize: 12,
  fontWeight: 700,
}

const chartPlotWrapStyle: React.CSSProperties = {
  position: 'relative',
  minHeight: 360,
  paddingTop: 44,
  paddingBottom: 36,
  borderLeft: '1px solid rgba(101, 74, 32, 0.10)',
  borderBottom: '1px solid rgba(101, 74, 32, 0.10)',
}

const chartGridStyle: React.CSSProperties = {
  position: 'absolute',
  inset: '44px 0 36px 0',
}

const chartGridLineStyle: React.CSSProperties = {
  position: 'absolute',
  left: 0,
  right: 0,
  borderTop: '1px dashed rgba(148, 163, 184, 0.22)',
}

const chartBarsRowStyle: React.CSSProperties = {
  position: 'relative',
  zIndex: 1,
  height: '100%',
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(0, 1fr))',
  gap: 10,
  alignItems: 'end',
}

const chartBarSlotStyle: React.CSSProperties = {
  minWidth: 0,
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-end',
  alignItems: 'stretch',
  gap: 12,
}

const chartBarStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 8,
  alignSelf: 'stretch',
  borderRadius: '14px 14px 10px 10px',
  background: '#0f766e',
  boxShadow: 'inset 0 -1px 0 rgba(255, 255, 255, 0.18)',
}

const chartXAxisLabelStyle: React.CSSProperties = {
  textAlign: 'center',
  color: '#64748b',
  fontSize: 11,
  fontWeight: 700,
}

const chartMarkerWrapStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  bottom: 20,
  transform: 'translateX(-50%)',
  zIndex: 2,
  pointerEvents: 'none',
}

const chartMarkerLabelStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'flex-start',
  gap: 8,
  padding: '8px 12px',
  borderRadius: 16,
  background: '#fff7ec',
  border: '1px solid rgba(201, 109, 31, 0.22)',
  boxShadow: '0 12px 24px rgba(201, 109, 31, 0.10)',
  minWidth: 160,
}

const chartMarkerDotStyle: React.CSSProperties = {
  width: 10,
  height: 10,
  borderRadius: 999,
  marginTop: 4,
  background: '#c96d1f',
  flexShrink: 0,
}

const chartMarkerLineStyle: React.CSSProperties = {
  position: 'absolute',
  top: 40,
  bottom: 0,
  left: '50%',
  width: 0,
  borderLeft: '3px dashed #c96d1f',
}

function BeforeAfterPurchases({ data = [], actionDate, months = 6 }: { data?: ModelCompras[]; actionDate?: string; months?: number }) {
  const tsAction = toDateMs(actionDate)
  const series = (Array.isArray(data) ? data : [])
    .map((d) => ({ ts: toDateMs(d.periodo), total: Number((d as any).trn_units || 0) }))
    .filter((p) => Number.isFinite(p.ts))
    .sort((a, b) => a.ts - b.ts)
  if (!Number.isFinite(tsAction) || !series.length) return <div style={{ color: '#6b7280' }}>Sem dados suficientes.</div>
  const before = series.filter((p) => p.ts < tsAction).slice(-months)
  const after = series.filter((p) => p.ts >= tsAction).slice(0, months)
  const sum = (arr: typeof series) => arr.reduce((s, p) => s + (Number.isFinite(p.total) ? p.total : 0), 0)
  const bSum = sum(before)
  const aSum = sum(after)
  const delta = aSum - bSum
  const pct = bSum !== 0 ? (delta / bSum) * 100 : null
  const badge = (better: boolean | null) => ({ background: better == null ? '#f3f4f6' : better ? '#dcfce7' : '#fee2e2', border: `1px solid ${better == null ? '#e5e7eb' : better ? '#86efac' : '#fecaca'}` })
  const greenBadge = { background: '#dcfce7', border: '1px solid #86efac' }
  const isBetter = bSum > 0 ? aSum < bSum : null
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
      <div style={{ padding: 12, borderRadius: 10, ...badge(null) }}>
        <div style={{ fontSize: 12, opacity: 0.8 }}>Antes da ação ({months} meses)</div>
        <div style={{ marginTop: 6, fontWeight: 800, fontSize: 18 }}>{formatKwh(bSum)}</div>
      </div>
      <div style={{ padding: 12, borderRadius: 10, ...greenBadge }}>
        <div style={{ fontSize: 12, opacity: 0.8 }}>Depois da ação ({months} meses)</div>
        <div style={{ marginTop: 6, fontWeight: 800, fontSize: 18 }}>{formatKwh(aSum)}</div>
      </div>
      <div style={{ padding: 12, borderRadius: 10, ...greenBadge }}>
        <div style={{ fontSize: 12, opacity: 0.8 }}>Variação</div>
        <div style={{ marginTop: 6, display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <div style={{ fontWeight: 700 }}>{formatKwh(bSum)}</div>
          <span>→</span>
          <div style={{ fontWeight: 800, fontSize: 18 }}>{formatKwh(aSum)}</div>
          <div style={{ 
            marginLeft: 'auto', 
            fontWeight: 700, 
            color: pct != null ? (pct > 0 ? '#16a34a' : '#dc2626') : '#374151'
          }}>
            {pct != null ? `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%` : '—'}
          </div>
        </div>
      </div>
    </div>
  )
}
