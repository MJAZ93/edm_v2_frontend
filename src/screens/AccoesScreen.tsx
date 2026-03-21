import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Card, Pagination } from '../components'
import { useAuth } from '../contexts/AuthContext'
import { ASCApi, AccoesApi, MaterialApi, type ModelASC, type ModelAccoes, type ModelMaterial } from '../services'

type UiState = { loading: boolean; error: string | null }

export default function AccoesScreen() {
  const { getApiConfig, getAuthorizationHeaderValue, logout } = useAuth()
  const api = useMemo(() => new AccoesApi(getApiConfig()), [getApiConfig])
  const ascApi = useMemo(() => new ASCApi(getApiConfig()), [getApiConfig])
  const materialApi = useMemo(() => new MaterialApi(getApiConfig()), [getApiConfig])
  const authHeader = useMemo(() => getAuthorizationHeaderValue(), [getAuthorizationHeaderValue])

  const [items, setItems] = useState<ModelAccoes[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [ui, setUi] = useState<UiState>({ loading: false, error: null })

  const [orderBy, setOrderBy] = useState<'created_at' | 'data_implementacao' | 'amount'>('created_at')
  const [orderDirection, setOrderDirection] = useState<'asc' | 'desc'>('desc')

  const [ascId, setAscId] = useState('')
  const [texto, setTexto] = useState('')
  const [dataInicio, setDataInicio] = useState<string | null>(null)
  const [dataFim, setDataFim] = useState<string | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [ascs, setAscs] = useState<ModelASC[]>([])
  const [materials, setMaterials] = useState<ModelMaterial[]>([])

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
      const { data } = await api.privateAccoesGet(authHeader, page, pageSize, orderBy, orderDirection, ascId || undefined)
      if (isUnauthorizedBody(data)) {
        logout('Sessão expirada. Inicie sessão novamente.')
        return
      }
      setItems((data as any).items ?? [])
      setTotal((data as any).total ?? 0)
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 401 || isUnauthorizedBody(err?.response?.data)) {
        logout('Sessão expirada. Inicie sessão novamente.')
        return
      }
      setUi({
        loading: false,
        error: !status ? 'Sem ligação ao servidor.' : status >= 500 ? 'Erro do servidor ao carregar ações.' : 'Falha a obter ações.',
      })
      return
    }
    setUi({ loading: false, error: null })
  }, [api, authHeader, page, pageSize, orderBy, orderDirection, ascId, logout])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [ascId, texto, dataInicio, dataFim, pageSize, orderBy, orderDirection])

  useEffect(() => {
    ;(async () => {
      try {
        const { data } = await ascApi.privateAscsGet(authHeader, -1, undefined, 'name', 'asc')
        if (isUnauthorizedBody(data)) {
          logout('Sessão expirada. Inicie sessão novamente.')
          return
        }
        setAscs((data as any).items ?? [])
      } catch {}
    })()
  }, [ascApi, authHeader, logout])

  useEffect(() => {
    ;(async () => {
      try {
        const { data } = await materialApi.privateMateriaisGet(authHeader, -1, undefined, 'name', 'asc')
        if (isUnauthorizedBody(data)) {
          logout('Sessão expirada. Inicie sessão novamente.')
          return
        }
        setMaterials((data as any).items ?? [])
      } catch {}
    })()
  }, [authHeader, logout, materialApi])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  function toggleSort(key: 'created_at' | 'data_implementacao' | 'amount') {
    if (orderBy === key) setOrderDirection((direction) => (direction === 'asc' ? 'desc' : 'asc'))
    else {
      setOrderBy(key)
      setOrderDirection('asc')
    }
  }

  function openCreate() {
    window.history.pushState({}, '', '/accoes/novo')
    window.dispatchEvent(new Event('locationchange'))
  }

  function openDetails(id?: string) {
    if (!id) return
    window.history.pushState({}, '', `/accoes/${id}`)
    window.dispatchEvent(new Event('locationchange'))
  }

  function openEdit(id?: string) {
    if (!id) return
    window.history.pushState({}, '', `/accoes/${id}/editar`)
    window.dispatchEvent(new Event('locationchange'))
  }

  async function handleDelete(id?: string) {
    if (!id) return
    if (!window.confirm('Eliminar ação?')) return
    try {
      await api.privateAccoesIdDelete(id, authHeader)
      await load()
    } catch {
      alert('Não foi possível eliminar.')
    }
  }

  function clearFilters() {
    setTexto('')
    setAscId('')
    setDataInicio(null)
    setDataFim(null)
    setOrderBy('created_at')
    setOrderDirection('desc')
    setPage(1)
  }

  const resolveAsc = useCallback((id?: string) => {
    const item = ascs.find((entry) => entry.id === id)
    return item?.name || id || '-'
  }, [ascs])

  const resolveMateriais = useCallback((list?: Array<{ id?: string; name?: string }>) => {
    if (Array.isArray(list) && list.length) {
      return list.map((item) => item.name || item.id).filter(Boolean).join(', ')
    }
    return '—'
  }, [])

  const viewItems = useMemo(() => {
    const q = texto.trim().toLowerCase()
    const startTs = dataInicio ? Date.parse(dataInicio) : null
    const endTs = dataFim ? Date.parse(dataFim) : null
    return items.filter((item) => {
      const implementationDate = item.data_implementacao ? Date.parse(String(item.data_implementacao)) : null
      if (startTs && (implementationDate == null || implementationDate < startTs)) return false
      if (endTs) {
        const endOfDay = endTs + 24 * 60 * 60 * 1000
        if (implementationDate == null || implementationDate >= endOfDay) return false
      }
      if (!q) return true
      const materialNames = resolveMateriais((item as any).materiais)
      const fields = [
        String(item.accoes || ''),
        resolveAsc(item.asc_id),
        materialNames,
      ]
      return fields.some((value) => (value || '').toLowerCase().includes(q))
    })
  }, [dataFim, dataInicio, items, resolveAsc, resolveMateriais, texto])

  const activeFilterCount = [
    ascId,
    texto.trim(),
    dataInicio,
    dataFim,
  ].filter(Boolean).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card
        title="Filtros"
        subtitle="Refine as ações por ASC, período de implementação e termo pesquisado."
        extra={
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button
              type="button"
              style={filtersOpen ? filterHeaderButtonActiveStyle : filterHeaderButtonStyle}
              onClick={() => setFiltersOpen((open) => !open)}
            >
              {filtersOpen ? 'Ocultar filtros' : 'Mostrar filtros'}
            </button>
            <button type="button" style={filterHeaderButtonStyle} onClick={clearFilters}>
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
                placeholder="Pesquisar por termo…"
                style={fieldControlStyle}
              />
            </label>

            <label style={fieldGroupStyle}>
              <span style={fieldLabelStyle}>ASC</span>
              <select value={ascId} onChange={(e) => setAscId(e.target.value)} style={fieldControlStyle}>
                <option value="">Todas</option>
                {ascs.map((asc) => (
                  <option key={asc.id} value={asc.id}>{asc.name || asc.id}</option>
                ))}
              </select>
            </label>

            <label style={fieldGroupStyle}>
              <span style={fieldLabelStyle}>Implementação desde</span>
              <input type="date" value={dataInicio ?? ''} onChange={(e) => setDataInicio(e.target.value || null)} style={fieldControlStyle} />
            </label>

            <label style={fieldGroupStyle}>
              <span style={fieldLabelStyle}>Implementação até</span>
              <input type="date" value={dataFim ?? ''} onChange={(e) => setDataFim(e.target.value || null)} style={fieldControlStyle} />
            </label>
          </div>
        ) : (
          <div style={collapsedFiltersHintStyle}>
            <span>Filtros recolhidos para dar mais foco aos resultados.</span>
            <span>{activeFilterCount > 0 ? `${activeFilterCount} filtro(s) ativo(s)` : 'Sem filtros ativos'}</span>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
          <span style={summaryChipStyle}>Resultados: {total.toLocaleString('pt-PT')}</span>
          <span style={summaryChipStyle}>Visíveis: {viewItems.length.toLocaleString('pt-PT')}</span>
          <span style={summaryChipStyle}>Página: {page}/{totalPages}</span>
          {ascId ? <span style={summaryChipStyle}>ASC: {resolveAsc(ascId)}</span> : null}
        </div>

        {ui.error ? <div style={errorBannerStyle}>{ui.error}</div> : null}
      </Card>

      <Card
        title="Resultados"
        subtitle="Lista paginada e ordenável."
        extra={(
          <button type="button" onClick={openCreate} style={primaryHeaderButtonStyle}>
            Nova ação
          </button>
        )}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <Th label="Criado em" active={orderBy === 'created_at'} direction={orderDirection} onClick={() => toggleSort('created_at')} />
                <Th label="Implementação" active={orderBy === 'data_implementacao'} direction={orderDirection} onClick={() => toggleSort('data_implementacao')} />
                <Th label="Ação" />
                <Th label="ASC" />
                <Th label="Valor" active={orderBy === 'amount'} direction={orderDirection} onClick={() => toggleSort('amount')} />
                <Th label="Meses análise" />
                <th style={actionHeaderCellStyle}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {ui.loading ? (
                <tr><td colSpan={7} style={emptyTableCellStyle}>A carregar…</td></tr>
              ) : viewItems.length === 0 ? (
                <tr><td colSpan={7} style={emptyTableCellStyle}>Sem ações para mostrar.</td></tr>
              ) : (
                viewItems.map((item) => (
                  <tr key={item.id}>
                    <td style={bodyCellStyle}>
                      <span style={dateBadgeStyle}>{formatDateTime(item.created_at)}</span>
                    </td>
                    <td style={bodyCellStyle}>
                      <span style={dateBadgeStyle}>{formatDateTime(item.data_implementacao)}</span>
                    </td>
                    <td style={bodyCellStyle}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 240 }}>
                        <strong style={{ color: '#1f2937' }}>{item.accoes || '-'}</strong>
                        <span style={{ color: '#7b8494', fontSize: 12 }}>
                          Materiais: {resolveMateriais((item as any).materiais)}
                        </span>
                      </div>
                    </td>
                    <td style={bodyCellStyle}>{resolveAsc(item.asc_id)}</td>
                    <td style={bodyCellStyle}>
                      <span style={valueBadgeStyle}>{formatMoney(item.amount)}</span>
                    </td>
                    <td style={bodyCellStyle}>{item.meses_analise != null ? String(item.meses_analise) : '-'}</td>
                    <td style={{ ...bodyCellStyle, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <ActionIconButton label="Ver detalhes" variant="secondary" onClick={() => openDetails(item.id)}>
                        <EyeIcon />
                      </ActionIconButton>
                      <ActionIconButton label="Editar" variant="secondary" onClick={() => openEdit(item.id)}>
                        <PencilIcon />
                      </ActionIconButton>
                      <ActionIconButton label="Eliminar" variant="danger" onClick={() => handleDelete(item.id)}>
                        <TrashIcon />
                      </ActionIconButton>
                    </td>
                  </tr>
                ))
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
      style={tableHeaderCellStyle(onClick)}
      title={onClick ? 'Ordenar' : undefined}
      aria-sort={active ? (direction === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <span>{label}</span>{' '}
      {active ? <span aria-hidden>{direction === 'asc' ? '▲' : '▼'}</span> : null}
    </th>
  )
}

function ActionIconButton({
  children,
  label,
  variant,
  onClick,
}: {
  children: React.ReactNode
  label: string
  variant: 'secondary' | 'danger'
  onClick: () => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...actionIconButtonBaseStyle,
        ...(hovered ? actionIconButtonHoverStyle[variant] : null),
      }}
    >
      {children}
    </button>
  )
}

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M2 12C3.9 8.6 7.5 6.5 12 6.5C16.5 6.5 20.1 8.6 22 12C20.1 15.4 16.5 17.5 12 17.5C7.5 17.5 3.9 15.4 2 12Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

function PencilIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 20L7.8 19.2L18.4 8.6C19.2 7.8 19.2 6.6 18.4 5.8L18.2 5.6C17.4 4.8 16.2 4.8 15.4 5.6L4.8 16.2L4 20Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.8 7.2L16.8 10.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 7H19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M9 7V5.5C9 4.7 9.7 4 10.5 4H13.5C14.3 4 15 4.7 15 5.5V7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8 10V17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 10V17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M16 10V17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M6 7L7 19C7 19.6 7.4 20 8 20H16C16.6 20 17 19.6 17 19L18 7" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
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

const primaryHeaderButtonStyle: React.CSSProperties = {
  minHeight: 42,
  padding: '0 16px',
  borderRadius: 14,
  border: '1px solid rgba(201, 109, 31, 0.20)',
  background: 'linear-gradient(180deg, #d77a28 0%, #b85d18 100%)',
  color: '#fffaf5',
  fontWeight: 800,
  boxShadow: '0 12px 24px rgba(201, 109, 31, 0.18)',
  cursor: 'pointer',
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

const errorBannerStyle: React.CSSProperties = {
  marginTop: 10,
  padding: '12px 14px',
  borderRadius: 14,
  background: '#fff1f1',
  border: '1px solid rgba(200, 60, 60, 0.18)',
  color: '#991b1b',
  fontWeight: 700,
}

const tableHeaderCellStyle = (clickable?: (() => void) | undefined): React.CSSProperties => ({
  cursor: clickable ? 'pointer' : 'default',
  userSelect: 'none',
  textAlign: 'left',
  padding: '12px 8px',
  borderBottom: '1px solid rgba(101, 74, 32, 0.12)',
  color: '#3f4652',
  whiteSpace: 'nowrap',
})

const actionHeaderCellStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '12px 8px',
  borderBottom: '1px solid rgba(101, 74, 32, 0.12)',
  width: 170,
  color: '#3f4652',
}

const bodyCellStyle: React.CSSProperties = {
  padding: '12px 8px',
  borderBottom: '1px solid rgba(101, 74, 32, 0.08)',
  color: '#3f4652',
  verticalAlign: 'top',
}

const emptyTableCellStyle: React.CSSProperties = {
  padding: 16,
  color: '#7b8494',
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

const valueBadgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  minHeight: 32,
  padding: '0 12px',
  borderRadius: 999,
  background: 'rgba(15, 118, 110, 0.10)',
  color: '#0f766e',
  fontSize: 13,
  fontWeight: 800,
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

const actionIconButtonHoverStyle: Record<'secondary' | 'danger', React.CSSProperties> = {
  secondary: {
    background: '#f8efe2',
    borderColor: 'rgba(201, 109, 31, 0.28)',
    color: '#8d4a17',
    transform: 'translateY(-1px)',
    boxShadow: '0 14px 28px rgba(201, 109, 31, 0.12)',
  },
  danger: {
    background: '#fff1f1',
    borderColor: 'rgba(180, 35, 24, 0.28)',
    color: '#b42318',
    transform: 'translateY(-1px)',
    boxShadow: '0 14px 28px rgba(180, 35, 24, 0.12)',
  },
}
