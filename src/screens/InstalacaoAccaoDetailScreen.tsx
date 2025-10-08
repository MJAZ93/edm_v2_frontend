import React, { useEffect, useMemo, useState } from 'react'
import { Button, Card, Heading, Text } from '../components'
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

export default function InstalacaoAccaoDetailScreen() {
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

        // 3) Carregar instalação do mês da execução (para obter inspecao_id e métricas)
        if (a?.pf && a?.data_execucao) {
          const mes = toMonthStart(a.data_execucao)
          try {
            const { data: i } = await instApi.privateInstallationsPfGet(a.pf, mes, authHeader)
            if (!isUnauthorizedBody(i)) {
              setInst(i as any)
              const inspecId = (i as any)?.inspecao_id
              if (inspecId) {
                try {
                  const { data: eq } = await eqApi.privateEquipamentosInspeccaoIdGet(inspecId, authHeader)
                  if (!isUnauthorizedBody(eq)) setEquipamentos(((eq as any)?.items) ?? [])
                } catch {}
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Heading level={2}>Detalhes da ação</Heading>
        <Button variant="secondary" onClick={goBack}>Voltar</Button>
      </div>

      {ui.error ? <div style={{ background: '#fee2e2', color: '#991b1b', padding: 10, borderRadius: 8 }}>{ui.error}</div> : null}

      <Card title="Dados da ação">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          <Info label="PF" value={accao?.pf || '—'} color="#1d4ed8" />
          <Info label="Execução" value={formatDate(accao?.data_execucao)} color="#0ea5e9" />
          <Info label="Tipo" value={(accao as any)?.accao_tipo?.nome || (accao as any)?.accao_tipo_id || '—'} color="#10b981" />
          <Info label="Marcação" value={accao?.marcacao_status || '—'} color="#f59e0b" />
          <Info label="Análise" value={accao?.analise_status || '—'} color="#6366f1" />
          <Info label="Tendência" value={formatTendencia(accao?.tendencia_compras)} color="#ef4444" />
          <Info label="Valor recuperado" value={formatMoney(accao?.valor_recuperado)} color="#111827" />
        </div>
        {accao?.comentario ? (
          <div style={{ marginTop: 12 }}>
            <span style={{ fontSize: 13, color: '#374151' }}>Comentário</span>
            <div style={{ padding: 10, borderRadius: 8, border: '1px solid #e5e7eb', background: '#f9fafb' }}>{accao?.comentario}</div>
          </div>
        ) : null}
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        <Card title="Compras (últimos períodos)">
          <ComprasChart data={compras} actionDate={accao?.data_execucao} />
        </Card>
        <Card title="Consumo calculado" subtitle="Estimativa por equipamentos (kWh)">
          <EquipamentosList items={equipamentos} emptyHint={!inst?.inspecao_id ? 'Sem inspeção associada para este mês.' : 'Sem equipamentos registados.'} />
        </Card>
      </div>

      <Card title="Antes vs Depois (kWh)" subtitle="Totais nos 6 meses antes e depois da ação">
        <BeforeAfterPurchases data={compras} actionDate={accao?.data_execucao} months={6} />
      </Card>

      <Card title="Resumo do mês da ação" subtitle="Indicadores da instalação nesse mês">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          <Metric label="Compras (últ. 6m) (kWh)" value={formatNumber(inst?.compras_6_meses)} color="#0ea5e9" />
          <Metric label="Compras vizinhos (6m) (kWh)" value={formatNumber(inst?.compras_vizinhos_6_meses)} color="#6366f1" />
          <Metric label="Equipamentos (6m)" value={formatNumber(inst?.equipamentos_6_meses)} color="#10b981" />
          <Metric label="Score" value={formatNumber(inst?.score)} color="#f59e0b" />
          <Metric label="AI Score" value={formatNumber(inst?.ai_score)} color="#ef4444" />
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

function Info({ label, value, color = '#111827' }: { label: string; value: React.ReactNode; color?: string }) {
  return (
    <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: 10 }}>
      <div style={{ fontSize: 12, color: '#6b7280' }}>{label}</div>
      <div style={{ fontWeight: 800, color }}>{value as any}</div>
    </div>
  )
}

function Metric({ label, value, color = '#111827' }: { label: string; value: string | number; color?: string }) {
  return (
    <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 12 }}>
      <div style={{ fontSize: 12, color: '#6b7280' }}>{label}</div>
      <div style={{ fontWeight: 800, fontSize: 18, color }}>{value as any}</div>
    </div>
  )
}

function ComprasChart({ data = [] as ModelCompras[], actionDate }: { data?: ModelCompras[]; actionDate?: string }) {
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const [width, setWidth] = React.useState<number>(520)
  const H = 200
  const pad = 28
  const clean = (Array.isArray(data) ? data : [])
    .map((d) => ({ ts: toDateMs(d.periodo), total: Number(d.trn_units || 0) }))
    .filter((p) => Number.isFinite(p.ts))
    .sort((a, b) => a.ts - b.ts)
    .slice(-12)

  React.useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setWidth(el.clientWidth))
    setWidth(el.clientWidth)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  if (!clean.length) return <div style={{ color: '#6b7280' }}>Sem dados de compras.</div>
  const W = Math.max(280, width)
  const maxY = Math.max(1, ...clean.map((p) => p.total))
  const barW = Math.max(8, Math.floor((W - pad * 2) / (clean.length * 1.5)))
  const gap = barW / 2
  const x0 = pad + gap
  const sy = (y: number) => H - pad - (y / maxY) * (H - pad * 2)
  const tsAction = toDateMs(actionDate)
  // Calcula posição da linha de ação alinhada às barras (limite esquerdo do mês de execução)
  const idxAction = Number.isFinite(tsAction) ? clean.findIndex((p) => p.ts >= tsAction) : -1
  let xLine: number | null = null
  if (Number.isFinite(tsAction)) {
    if (!clean.length) xLine = null
    else if (idxAction === -1) xLine = Math.min(W - pad, (pad + (W - pad)) - 1)
    else if (tsAction < clean[0].ts) xLine = pad
    else xLine = (pad + (gap)) + idxAction * (barW + gap)
  }

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      <svg width={W} height={H} role="img" aria-label="Compras (barras)">
        <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="#e5e7eb" />
        <line x1={pad} y1={pad} x2={pad} y2={H - pad} stroke="#e5e7eb" />
        {xLine != null && xLine >= pad && xLine <= (W - pad) && (
          <g>
            <line x1={xLine} y1={pad - 6} x2={xLine} y2={H - pad + 6} stroke="#ef4444" strokeDasharray="4 2" strokeWidth={3} />
            <text x={Math.min(W - pad - 4, Math.max(pad + 4, xLine + 8))} y={pad + 10} fontSize={10} fill="#ef4444">Início da ação</text>
          </g>
        )}
        {clean.map((p, i) => {
          const h = (H - pad * 2) * (p.total / maxY)
          const x = x0 + i * (barW + gap)
          const y = H - pad - h
          return <rect key={i} x={x} y={y} width={barW} height={h} fill="#1d4ed8" rx={3} />
        })}
        {clean.map((p, i) => {
          const x = x0 + i * (barW + gap) + barW / 2
          return <text key={i} x={x} y={H - pad + 12} fontSize={9} fill="#6b7280" textAnchor="middle">{formatMonth(new Date(p.ts))}</text>
        })}
        {[0, 0.5, 1].map((f, i) => {
          const yv = f * maxY
          const y = sy(yv)
          return (
            <g key={i}>
              <line x1={pad - 4} y1={y} x2={pad} y2={y} stroke="#e5e7eb" />
              <text x={4} y={y + 4} fontSize={10} fill="#6b7280">{formatKwh(yv)}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function EquipamentosList({ items = [], emptyHint = 'Sem equipamentos.' }: { items: ModelEquipamentos[]; emptyHint?: string }) {
  if (!items.length) return <div style={{ color: '#6b7280' }}>{emptyHint}</div>
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <Th label="Nome" />
            <Th label="Potência" />
            <Th label="Quantidade" />
            <Th label="Horas" />
            <Th label="Dias" />
            <Th label="Consumo estimado (kWh)" />
          </tr>
        </thead>
        <tbody>
          {items.map((e, i) => (
            <tr key={i}>
              <td style={{ padding: '8px 8px', borderBottom: '1px solid #f3f4f6' }}>{e.nome || '-'}</td>
              <td style={{ padding: '8px 8px', borderBottom: '1px solid #f3f4f6' }}>{formatNumber(e.potencia)}</td>
              <td style={{ padding: '8px 8px', borderBottom: '1px solid #f3f4f6' }}>{formatNumber(e.quantidade)}</td>
              <td style={{ padding: '8px 8px', borderBottom: '1px solid #f3f4f6' }}>{formatNumber(e.horas)}</td>
              <td style={{ padding: '8px 8px', borderBottom: '1px solid #f3f4f6' }}>{formatNumber(e.dias)}</td>
              <td style={{ padding: '8px 8px', borderBottom: '1px solid #f3f4f6' }}>{formatKwh(e.consumo_estimado)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Th({ label }: { label: string }) {
  return (
    <th style={{ textAlign: 'left', padding: '8px 8px', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>{label}</th>
  )
}

function toDateMs(s?: string) { try { return new Date(String(s || '')).getTime() } catch { return NaN } }
function formatDate(iso?: string) { if (!iso) return '—'; try { const d = new Date(iso as any); if (Number.isNaN(d.getTime())) return '—'; return d.toLocaleDateString('pt-PT') } catch { return '—' } }
function formatMonth(d: Date) { try { return d.toLocaleDateString('pt-PT', { month: 'short' }) } catch { return '' } }
function formatNumber(n?: number) { if (typeof n !== 'number' || Number.isNaN(n)) return '—'; try { return n.toLocaleString('pt-PT') } catch { return String(n) } }
function formatMoney(n?: number) { if (typeof n !== 'number' || Number.isNaN(n)) return '—'; try { return `${n.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT` } catch { return `${n.toFixed(2)} MT` } }
function formatKwh(n?: number) { if (typeof n !== 'number' || Number.isNaN(n)) return '—'; try { return `${n.toLocaleString('pt-PT')} kWh` } catch { return `${n} kWh` } }
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
  const isBetter = bSum > 0 ? aSum < bSum : null
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
      <div style={{ padding: 12, borderRadius: 10, ...badge(null) }}>
        <div style={{ fontSize: 12, opacity: 0.8 }}>Antes da ação ({months} meses)</div>
        <div style={{ marginTop: 6, fontWeight: 800, fontSize: 18 }}>{formatKwh(bSum)}</div>
      </div>
      <div style={{ padding: 12, borderRadius: 10, ...badge(isBetter) }}>
        <div style={{ fontSize: 12, opacity: 0.8 }}>Depois da ação ({months} meses)</div>
        <div style={{ marginTop: 6, fontWeight: 800, fontSize: 18 }}>{formatKwh(aSum)}</div>
      </div>
      <div style={{ padding: 12, borderRadius: 10, ...badge(isBetter) }}>
        <div style={{ fontSize: 12, opacity: 0.8 }}>Variação</div>
        <div style={{ marginTop: 6, display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <div style={{ fontWeight: 700 }}>{formatKwh(bSum)}</div>
          <span>→</span>
          <div style={{ fontWeight: 800, fontSize: 18 }}>{formatKwh(aSum)}</div>
          <div style={{ marginLeft: 'auto', fontWeight: 700 }}>{pct != null ? `${pct.toFixed(1)}%` : '—'}</div>
        </div>
      </div>
    </div>
  )
}
