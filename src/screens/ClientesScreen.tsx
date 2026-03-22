import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Card, Pagination } from '../components'
import { useAuth } from '../contexts/AuthContext'
import { InstallationsApi, RegiaoApi, ModelInstallation } from '../services'

export default function ClientesScreen() {
  const { getApiConfig, getAuthorizationHeaderValue, logout } = useAuth()
  const api = useMemo(() => new InstallationsApi(getApiConfig()), [getApiConfig])
  const regiaoApi = useMemo(() => new RegiaoApi(getApiConfig()), [getApiConfig])
  const authHeader = useMemo(() => getAuthorizationHeaderValue(), [getAuthorizationHeaderValue])

  const [items, setItems] = useState<ModelInstallation[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [ui, setUi] = useState<{ loading: boolean; error: string | null }>({ loading: false, error: null })
  const [filtersOpen, setFiltersOpen] = useState(false)

  const [orderBy, setOrderBy] = useState<'mes' | 'score' | 'compras_6_meses'>('mes')
  const [orderDirection, setOrderDirection] = useState<'asc' | 'desc'>('desc')

  const [texto, setTexto] = useState('')
  const [pf, setPf] = useState('')
  const [nome, setNome] = useState('')
  const [regiaoId, setRegiaoId] = useState('')
  const [tendencia, setTendencia] = useState('')
  const [acaoCorrente, setAcaoCorrente] = useState<'sim' | 'nao' | ''>('')
  const [regioes, setRegioes] = useState<Array<{ id?: string; name?: string }>>([])

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
    setUi({ loading: true, error: null })
    try {
      const { data } = await api.privateInstallationsGet(
        authHeader,
        page,
        pageSize,
        orderBy,
        orderDirection,
        pf || undefined,
        regiaoId || undefined,
        undefined,
        undefined,
        acaoCorrente === 'nao' ? true : undefined,
        nome || undefined,
        tendencia || undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined
      )
      if (isUnauthorizedBody(data)) {
        logout('Sessão expirada. Inicie sessão novamente.')
        return
      }
      setItems(((data as any)?.items) ?? [])
      setTotal(Number((data as any)?.total ?? 0))
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 401 || isUnauthorizedBody(err?.response?.data)) {
        logout('Sessão expirada. Inicie sessão novamente.')
        return
      }
      setUi({
        loading: false,
        error: !status ? 'Sem ligação ao servidor.' : status >= 500 ? 'Erro do servidor ao carregar clientes.' : 'Falha ao obter clientes.'
      })
      return
    }
    setUi({ loading: false, error: null })
  }, [api, authHeader, page, pageSize, orderBy, orderDirection, pf, regiaoId, nome, tendencia, acaoCorrente, logout])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    ;(async () => {
      try {
        const { data } = await regiaoApi.privateRegioesGet(authHeader, -1, undefined, 'name', 'asc')
        if (isUnauthorizedBody(data)) {
          logout('Sessão expirada. Inicie sessão novamente.')
          return
        }
        setRegioes(((data as any)?.items) ?? [])
      } catch {}
    })()
  }, [regiaoApi, authHeader, logout])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  useEffect(() => { setPage(1) }, [pf, nome, regiaoId, tendencia, acaoCorrente, texto, pageSize, orderBy, orderDirection])

  const activeFilterCount = [texto.trim(), pf, nome, regiaoId, tendencia, acaoCorrente].filter(Boolean).length

  function toggleSort(key: 'mes' | 'score' | 'compras_6_meses') {
    if (orderBy === key) setOrderDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
    else {
      setOrderBy(key)
      setOrderDirection('asc')
    }
    setPage(1)
  }

  const viewItems = useMemo(() => {
    const q = texto.trim().toLowerCase()
    const base = items.filter((it) => {
      if (acaoCorrente === 'sim' && !(it as any).has_current_accao) return false
      if (acaoCorrente === 'nao' && (it as any).has_current_accao) return false
      return true
    })
    if (!q) return base
    return base.filter((it) => {
      const fields = [
        it.pf || '',
        it.nome || '',
        it.pt_name || '',
        (it as any).asc_name || '',
      ]
      return fields.some((value) => String(value).toLowerCase().includes(q))
    })
  }, [items, texto, acaoCorrente])

  const sortedItems = useMemo(() => {
    const arr = [...viewItems]
    const direction = orderDirection === 'asc' ? 1 : -1
    arr.sort((a, b) => {
      let av: any
      let bv: any
      if (orderBy === 'mes') {
        av = a.mes ? Date.parse(String(a.mes)) : 0
        bv = b.mes ? Date.parse(String(b.mes)) : 0
      } else if (orderBy === 'compras_6_meses') {
        av = a.compras_6_meses ?? 0
        bv = b.compras_6_meses ?? 0
      } else {
        av = a.score ?? 0
        bv = b.score ?? 0
      }
      if (av < bv) return -1 * direction
      if (av > bv) return 1 * direction
      return 0
    })
    return arr
  }, [viewItems, orderBy, orderDirection])

  const totalClientesVisiveis = sortedItems.length

  function abrirDetalhes(it: ModelInstallation) {
    const pfv = it.pf
    const mes = it.mes
    if (!pfv || !mes) return
    const url = `/instalacoes/${encodeURIComponent(pfv)}?mes=${encodeURIComponent(String(mes))}`
    window.history.pushState({}, '', url)
    window.dispatchEvent(new Event('locationchange'))
  }

  function limparFiltros() {
    setTexto('')
    setPf('')
    setNome('')
    setRegiaoId('')
    setTendencia('')
    setAcaoCorrente('')
    setOrderBy('mes')
    setOrderDirection('desc')
    setPage(1)
  }

  const resolveRegiao = (id?: string) => {
    const regiao = regioes.find((item) => item.id === id)
    return regiao?.name || id || '-'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card
        title="Filtros"
        subtitle="Refine a listagem por identificação, região, tendência e estado operacional."
        extra={
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button
              type="button"
              style={filtersOpen ? filterHeaderButtonActiveStyle : filterHeaderButtonStyle}
              onClick={() => setFiltersOpen((current) => !current)}
            >
              {filtersOpen ? 'Ocultar filtros' : 'Mostrar filtros'}
            </button>
            <button type="button" style={filterHeaderButtonStyle} onClick={limparFiltros}>
              Limpar filtros
            </button>
          </div>
        }
      >
        {filtersOpen ? (
          <div style={filtersGridStyle}>
            <label style={fieldGroupStyle}>
              <span style={fieldLabelStyle}>Pesquisar</span>
              <input
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Pesquisar por PF, nome, PT ou ASC…"
                style={fieldControlStyle}
              />
            </label>

            <label style={fieldGroupStyle}>
              <span style={fieldLabelStyle}>PF</span>
              <input value={pf} onChange={(e) => setPf(e.target.value)} placeholder="Número de PF" style={fieldControlStyle} />
            </label>

            <label style={fieldGroupStyle}>
              <span style={fieldLabelStyle}>Nome</span>
              <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome do cliente" style={fieldControlStyle} />
            </label>

            <label style={fieldGroupStyle}>
              <span style={fieldLabelStyle}>Região</span>
              <select value={regiaoId} onChange={(e) => setRegiaoId(e.target.value)} style={fieldControlStyle}>
                <option value="">Todas as regiões</option>
                {regioes.map((regiao) => (
                  <option key={regiao.id} value={regiao.id}>{regiao.name}</option>
                ))}
              </select>
            </label>

            <label style={fieldGroupStyle}>
              <span style={fieldLabelStyle}>Tendência</span>
              <select value={tendencia} onChange={(e) => setTendencia(e.target.value)} style={fieldControlStyle}>
                <option value="">Todas as tendências</option>
                <option value="CRESCENTE">Crescente</option>
                <option value="MUITO_CRESCENTE">Muito crescente</option>
                <option value="NORMAL">Normal</option>
                <option value="DECRESCENTE">Decrescente</option>
                <option value="MUITO_DECRESCENTE">Muito decrescente</option>
                <option value="SEM_COMPRAS">Sem compras</option>
              </select>
            </label>

            <label style={fieldGroupStyle}>
              <span style={fieldLabelStyle}>Ação corrente</span>
              <select value={acaoCorrente} onChange={(e) => setAcaoCorrente(e.target.value as any)} style={fieldControlStyle}>
                <option value="">Todos</option>
                <option value="sim">Com ação corrente</option>
                <option value="nao">Sem ação corrente</option>
              </select>
            </label>
          </div>
        ) : (
          <div style={collapsedFiltersHintStyle}>
            <span>Filtros recolhidos para dar mais foco aos resultados.</span>
            <span>{activeFilterCount > 0 ? `${activeFilterCount} filtro(s) ativo(s)` : 'Sem filtros ativos'}</span>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
          <span style={summaryChipStyle}>Resultados visíveis: {totalClientesVisiveis.toLocaleString('pt-PT')}</span>
          <span style={summaryChipStyle}>Página: {page}/{totalPages}</span>
          <span style={summaryChipStyle}>Ordenação: {labelOrdenacao(orderBy)}</span>
          {regiaoId ? <span style={summaryChipStyle}>Região: {resolveRegiao(regiaoId)}</span> : null}
          {tendencia ? <span style={summaryChipStyle}>Tendência: {formatTendencia(tendencia)}</span> : null}
        </div>

        {ui.error ? (
          <div style={{ background: '#fee2e2', color: '#991b1b', padding: 10, borderRadius: 8, marginTop: 10 }}>
            {ui.error}
          </div>
        ) : null}
      </Card>

      <Card title="Resultados" subtitle="Lista paginada e ordenável.">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <Th label="Mês" active={orderBy === 'mes'} direction={orderDirection} onClick={() => toggleSort('mes')} />
                <Th label="Cliente" />
                <Th label="Contexto" />
                <Th label="Compras (6m)" active={orderBy === 'compras_6_meses'} direction={orderDirection} onClick={() => toggleSort('compras_6_meses')} />
                <Th label="Consumo (6m)" />
                <Th label="Score" active={orderBy === 'score'} direction={orderDirection} onClick={() => toggleSort('score')} />
                <Th label="Tendência" />
                <Th label="Estado" />
                <th style={tableActionHeaderStyle}>Detalhe</th>
              </tr>
            </thead>
            <tbody>
              {ui.loading ? (
                <tr><td colSpan={9} style={emptyRowStyle}>A carregar clientes…</td></tr>
              ) : sortedItems.length === 0 ? (
                <tr><td colSpan={9} style={emptyRowStyle}>Sem clientes para mostrar.</td></tr>
              ) : (
                sortedItems.map((item, index) => {
                  const compras = item.compras_6_meses ?? 0
                  const consumo = (item as any).equipamentos_6_meses ?? 0
                  const hasCurrentAction = Boolean((item as any).has_current_accao)
                  const riskHighlight = (compras == null || compras === 0) ? (consumo > 0) : (consumo > compras * 1.5)

                  return (
                    <tr key={`${item.pf}-${item.mes}-${index}`} style={riskHighlight ? highlightedRowStyle : undefined}>
                      <td style={tableCellStyle}>
                        <span style={dateBadgeStyle}>{formatMonth(item.mes)}</span>
                      </td>
                      <td style={tableCellStyle}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 180 }}>
                          <strong style={{ color: '#1f2937', fontSize: 14 }}>{item.nome || item.pf || 'Cliente sem nome'}</strong>
                          <span style={metaLineStyle}>PF: {item.pf || '-'}</span>
                        </div>
                      </td>
                      <td style={tableCellStyle}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 180 }}>
                          <strong style={{ color: '#1f2937', fontSize: 14 }}>{(item as any).asc_name || 'ASC por identificar'}</strong>
                          <span style={metaLineStyle}>{item.pt_name || item.pt_id || 'PT indisponível'} · {resolveRegiao(item.regiao_id)}</span>
                        </div>
                      </td>
                      <td style={tableCellStyle}>
                        <span style={metricBadgeStyle}>{formatKwh(item.compras_6_meses)}</span>
                      </td>
                      <td style={tableCellStyle}>
                        <span style={consumptionBadgeStyle}>{formatKwh((item as any).equipamentos_6_meses)}</span>
                      </td>
                      <td style={tableCellStyle}>
                        <span style={scoreBadgeStyle(item.score)}>{formatPercent(item.score)}</span>
                      </td>
                      <td style={tableCellStyle}>
                        <span style={trendBadgeStyle(item.tendencia_compras)}>{formatTendencia(item.tendencia_compras)}</span>
                      </td>
                      <td style={tableCellStyle}>
                        <span style={statusBadgeStyle(hasCurrentAction)}>{hasCurrentAction ? 'Corrente' : 'Sem ação'}</span>
                      </td>
                      <td style={{ ...tableCellStyle, width: 80 }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <ActionIconButton label="Ver detalhes" onClick={() => abrirDetalhes(item)}>
                            <EyeIcon />
                          </ActionIconButton>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={total}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          showPageSizeSelector={true}
          showQuickJump={true}
          showFirstLast={true}
        />
      </Card>
    </div>
  )
}

function Th({ label, active, direction, onClick }: { label: string; active?: boolean; direction?: 'asc' | 'desc'; onClick?: () => void }) {
  return (
    <th
      onClick={onClick}
      style={tableHeaderStyle(onClick)}
      title={onClick ? 'Ordenar' : undefined}
      aria-sort={active ? (direction === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <span>{label}</span>{' '}
      {active ? <span aria-hidden>{direction === 'asc' ? '▲' : '▼'}</span> : null}
    </th>
  )
}

function ActionIconButton({
  label,
  children,
  onClick,
}: {
  label: string
  children: React.ReactNode
  onClick: () => void
}) {
  const [hover, setHover] = useState(false)

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ ...actionIconButtonBaseStyle, ...(hover ? actionIconButtonHoverStyle : null) }}
    >
      {children}
    </button>
  )
}

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M2 12C3.9 8.7 7.5 6.5 12 6.5C16.5 6.5 20.1 8.7 22 12C20.1 15.3 16.5 17.5 12 17.5C7.5 17.5 3.9 15.3 2 12Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

function labelOrdenacao(orderBy: 'mes' | 'score' | 'compras_6_meses') {
  if (orderBy === 'mes') return 'Mês'
  if (orderBy === 'score') return 'Score'
  return 'Compras (6m)'
}

function formatMonth(iso?: string) {
  if (!iso) return '-'
  try {
    const date = new Date(iso)
    if (Number.isNaN(date.getTime())) return '-'
    return date.toLocaleDateString('pt-PT', { year: 'numeric', month: '2-digit' })
  } catch {
    return '-'
  }
}

function formatKwh(value?: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '0 kWh'
  try {
    return `${value.toLocaleString('pt-PT')} kWh`
  } catch {
    return `${value} kWh`
  }
}

function formatPercent(value?: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '0%'
  const percentage = value * 100
  try {
    return `${percentage.toLocaleString('pt-PT', { maximumFractionDigits: 1 })}%`
  } catch {
    return `${percentage.toFixed(1)}%`
  }
}

function formatTendencia(value?: any) {
  const raw = String(value || '')
  switch (raw) {
    case 'CRESCENTE': return 'Crescente'
    case 'MUITO_CRESCENTE': return 'Muito crescente'
    case 'NORMAL': return 'Normal'
    case 'DECRESCENTE': return 'Decrescente'
    case 'MUITO_DECRESCENTE': return 'Muito decrescente'
    case 'SEM_COMPRAS': return 'Sem compras'
    default: return 'Sem classificação'
  }
}

function trendBadgeStyle(trend?: any): React.CSSProperties {
  const raw = String(trend || '')
  if (raw === 'SEM_COMPRAS') return pillStyle('#fff7f6', 'rgba(180, 35, 24, 0.16)', '#b42318')
  if (raw === 'MUITO_DECRESCENTE') return pillStyle('#fff4e8', 'rgba(201, 109, 31, 0.16)', '#c96d1f')
  if (raw === 'DECRESCENTE') return pillStyle('#fff9e8', 'rgba(202, 138, 4, 0.18)', '#a16207')
  if (raw === 'MUITO_CRESCENTE') return pillStyle('#f2fcfa', 'rgba(15, 118, 110, 0.16)', '#0f766e')
  if (raw === 'CRESCENTE') return pillStyle('#f0fdf4', 'rgba(34, 197, 94, 0.18)', '#15803d')
  return pillStyle('#f5f1ea', 'rgba(101, 74, 32, 0.12)', '#5f6673')
}

function scoreBadgeStyle(score?: number): React.CSSProperties {
  if (typeof score !== 'number' || Number.isNaN(score)) return pillStyle('#f5f1ea', 'rgba(101, 74, 32, 0.12)', '#5f6673')
  const percentage = score * 100
  if (percentage >= 80) return pillStyle('#f0fdf4', 'rgba(34, 197, 94, 0.18)', '#15803d')
  if (percentage >= 50) return pillStyle('#fff9e8', 'rgba(202, 138, 4, 0.18)', '#a16207')
  return pillStyle('#fff7f6', 'rgba(180, 35, 24, 0.16)', '#b42318')
}

function statusBadgeStyle(active: boolean): React.CSSProperties {
  return active
    ? pillStyle('#f2fcfa', 'rgba(15, 118, 110, 0.16)', '#0f766e')
    : pillStyle('#f5f1ea', 'rgba(101, 74, 32, 0.12)', '#5f6673')
}

function pillStyle(background: string, borderColor: string, color: string): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: 32,
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

const filtersGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 14,
  alignItems: 'end',
}

const fieldGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
}

const fieldLabelStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#7b8494',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '.06em',
}

const fieldControlStyle: React.CSSProperties = {
  minHeight: 46,
  padding: '0 14px',
  borderRadius: 14,
  border: '1px solid rgba(101, 74, 32, 0.14)',
  background: '#fffdf9',
  color: '#1f2937',
  boxShadow: '0 10px 24px rgba(101, 74, 32, 0.05)',
}

const collapsedFiltersHintStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  flexWrap: 'wrap',
  minHeight: 52,
  padding: '14px 16px',
  borderRadius: 18,
  background: 'rgba(255, 252, 246, 0.9)',
  border: '1px dashed rgba(101, 74, 32, 0.18)',
  color: '#5f6673',
  fontSize: 14,
  fontWeight: 600,
}

const summaryChipStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  minHeight: 34,
  padding: '0 12px',
  borderRadius: 999,
  background: 'linear-gradient(180deg, #faf1e3 0%, #f5ead9 100%)',
  border: '1px solid rgba(101, 74, 32, 0.14)',
  color: '#5f6673',
  fontSize: 12,
  fontWeight: 700,
}

const filterHeaderButtonStyle: React.CSSProperties = {
  minHeight: 42,
  padding: '0 16px',
  borderRadius: 14,
  background: 'linear-gradient(180deg, #fffaf2 0%, #f6ecde 100%)',
  border: '1px solid rgba(101, 74, 32, 0.16)',
  color: '#8d4a17',
  fontWeight: 700,
  boxShadow: '0 8px 18px rgba(76, 57, 24, 0.08)',
  cursor: 'pointer',
}

const filterHeaderButtonActiveStyle: React.CSSProperties = {
  ...filterHeaderButtonStyle,
  border: '1px solid rgba(201, 109, 31, 0.28)',
  background: 'linear-gradient(180deg, rgba(255, 244, 230, 0.98) 0%, rgba(248, 231, 205, 0.92) 100%)',
  boxShadow: '0 12px 24px rgba(76, 57, 24, 0.10)',
}

const tableActionHeaderStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '12px 8px',
  borderBottom: '1px solid rgba(101, 74, 32, 0.12)',
  width: 80,
  color: '#3f4652',
}

const tableCellStyle: React.CSSProperties = {
  padding: '12px 8px',
  borderBottom: '1px solid rgba(101, 74, 32, 0.08)',
}

const emptyRowStyle: React.CSSProperties = {
  padding: 16,
  color: '#7b8494',
}

const highlightedRowStyle: React.CSSProperties = {
  background: '#fff8f6',
}

const metaLineStyle: React.CSSProperties = {
  color: '#7b8494',
  fontSize: 12,
  lineHeight: 1.5,
}

const dateBadgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  minHeight: 32,
  padding: '0 10px',
  borderRadius: 999,
  background: 'linear-gradient(180deg, rgba(255, 244, 230, 0.98) 0%, rgba(248, 231, 205, 0.92) 100%)',
  border: '1px solid rgba(201, 109, 31, 0.20)',
  color: '#8d4a17',
  fontSize: 12,
  fontWeight: 800,
  whiteSpace: 'nowrap',
}

const metricBadgeStyle: React.CSSProperties = {
  ...pillStyle('#f2fcfa', 'rgba(15, 118, 110, 0.16)', '#0f766e'),
}

const consumptionBadgeStyle: React.CSSProperties = {
  ...pillStyle('#eff6ff', 'rgba(37, 99, 235, 0.12)', '#3056a6'),
}

const actionIconButtonBaseStyle: React.CSSProperties = {
  width: 36,
  minWidth: 36,
  minHeight: 36,
  height: 36,
  padding: 0,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 12,
  border: '1px solid rgba(101, 74, 32, 0.14)',
  background: '#fffdf8',
  color: '#4b5563',
  boxShadow: '0 10px 24px rgba(101, 74, 32, 0.08)',
  cursor: 'pointer',
  transition: 'transform 0.18s ease, background 0.18s ease, border-color 0.18s ease, color 0.18s ease, box-shadow 0.18s ease',
}

const actionIconButtonHoverStyle: React.CSSProperties = {
  background: '#f8efe2',
  borderColor: 'rgba(201, 109, 31, 0.28)',
  color: '#8d4a17',
  transform: 'translateY(-1px)',
  boxShadow: '0 14px 28px rgba(201, 109, 31, 0.12)',
}

function tableHeaderStyle(clickable?: (() => void)): React.CSSProperties {
  return {
    cursor: clickable ? 'pointer' : 'default',
    userSelect: 'none',
    textAlign: 'left',
    padding: '12px 8px',
    borderBottom: '1px solid rgba(101, 74, 32, 0.12)',
    color: '#3f4652',
    whiteSpace: 'nowrap',
  }
}
