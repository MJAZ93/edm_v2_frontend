import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Card, Pagination } from '../components'
import { useAuth } from '../contexts/AuthContext'
import { InfractorApi, type ModelInfractor } from '../services'

type UiState = { loading: boolean; error: string | null }

export default function InfractorsScreen() {
  const { getApiConfig, getAuthorizationHeaderValue, logout } = useAuth()
  const api = useMemo(() => new InfractorApi(getApiConfig()), [getApiConfig])
  const authHeader = useMemo(() => getAuthorizationHeaderValue(), [getAuthorizationHeaderValue])

  const [items, setItems] = useState<ModelInfractor[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [ui, setUi] = useState<UiState>({ loading: false, error: null })

  const [orderBy, setOrderBy] = useState<'created_at' | 'nome'>('created_at')
  const [orderDirection, setOrderDirection] = useState<'asc' | 'desc'>('desc')

  const [nome, setNome] = useState('')
  const [doc, setDoc] = useState('')
  const [tipoDoc, setTipoDoc] = useState('')
  const [dataInicio, setDataInicio] = useState<string | null>(null)
  const [dataFim, setDataFim] = useState<string | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)

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
    setUi({ loading: true, error: null })
    try {
      const { data } = await api.privateInfractorsGet(
        authHeader,
        page,
        pageSize,
        orderBy,
        orderDirection,
        undefined,
        nome || undefined,
        doc || undefined
      )
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
        error: !status ? 'Sem ligação ao servidor.' : status >= 500 ? 'Erro do servidor ao carregar infractores.' : 'Falha a obter infractores.',
      })
      return
    }
    setUi({ loading: false, error: null })
  }, [api, authHeader, page, pageSize, orderBy, orderDirection, nome, doc, logout])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [nome, doc, tipoDoc, dataInicio, dataFim, pageSize, orderBy, orderDirection])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  function toggleSort(key: 'created_at' | 'nome') {
    if (orderBy === key) setOrderDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setOrderBy(key)
      setOrderDirection('asc')
    }
  }

  function openDetails(id?: string) {
    if (!id) return
    window.history.pushState({}, '', `/infractores/${id}`)
    window.dispatchEvent(new Event('locationchange'))
  }

  function openEdit(id?: string) {
    if (!id) return
    window.history.pushState({}, '', `/infractores/${id}/editar`)
    window.dispatchEvent(new Event('locationchange'))
  }

  function clearFilters() {
    setNome('')
    setDoc('')
    setTipoDoc('')
    setDataInicio(null)
    setDataFim(null)
    setOrderBy('created_at')
    setOrderDirection('desc')
    setPage(1)
  }

  const tipoDocOptions = useMemo(() => {
    const unique = new Set<string>()
    items.forEach((item) => {
      if (item.tipo_identificacao?.trim()) unique.add(item.tipo_identificacao.trim())
    })
    return Array.from(unique).sort((a, b) => a.localeCompare(b, 'pt-PT'))
  }, [items])

  const viewItems = useMemo(() => {
    const startTs = dataInicio ? Date.parse(dataInicio) : null
    const endTs = dataFim ? Date.parse(dataFim) : null
    const tipoDocQuery = tipoDoc.trim().toLowerCase()
    return items.filter((item) => {
      const createdAt = item.created_at ? Date.parse(String(item.created_at)) : null
      if (startTs && (createdAt == null || createdAt < startTs)) return false
      if (endTs) {
        const endOfDay = endTs + 24 * 60 * 60 * 1000
        if (createdAt == null || createdAt >= endOfDay) return false
      }
      if (tipoDocQuery && (item.tipo_identificacao || '').trim().toLowerCase() !== tipoDocQuery) return false
      return true
    })
  }, [items, dataInicio, dataFim, tipoDoc])

  const activeFilterCount = [
    nome.trim(),
    doc.trim(),
    tipoDoc.trim(),
    dataInicio,
    dataFim,
  ].filter(Boolean).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card
        title="Filtros"
        subtitle="Refine os infractores por nome, documento, tipo de identificação e período."
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
              <span style={fieldLabelStyle}>Nome</span>
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Pesquisar por nome…"
                style={fieldControlStyle}
              />
            </label>

            <label style={fieldGroupStyle}>
              <span style={fieldLabelStyle}>Documento</span>
              <input
                value={doc}
                onChange={(e) => setDoc(e.target.value)}
                placeholder="Pesquisar por documento…"
                style={fieldControlStyle}
              />
            </label>

            <label style={fieldGroupStyle}>
              <span style={fieldLabelStyle}>Tipo de identificação</span>
              <select value={tipoDoc} onChange={(e) => setTipoDoc(e.target.value)} style={fieldControlStyle}>
                <option value="">Todos</option>
                {tipoDocOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>

            <label style={fieldGroupStyle}>
              <span style={fieldLabelStyle}>Início</span>
              <input type="date" value={dataInicio ?? ''} onChange={(e) => setDataInicio(e.target.value || null)} style={fieldControlStyle} />
            </label>

            <label style={fieldGroupStyle}>
              <span style={fieldLabelStyle}>Fim</span>
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
          {nome.trim() ? <span style={summaryChipStyle}>Nome: {nome.trim()}</span> : null}
          {doc.trim() ? <span style={summaryChipStyle}>Documento: {doc.trim()}</span> : null}
          {tipoDoc.trim() ? <span style={summaryChipStyle}>Tipo doc.: {tipoDoc.trim()}</span> : null}
        </div>

        {ui.error ? <div style={errorBannerStyle}>{ui.error}</div> : null}
      </Card>

      <Card title="Resultados" subtitle="Lista paginada e ordenável.">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <Th label="Criado em" active={orderBy === 'created_at'} direction={orderDirection} onClick={() => toggleSort('created_at')} />
                <Th label="Nome" active={orderBy === 'nome'} direction={orderDirection} onClick={() => toggleSort('nome')} />
                <Th label="Documento" active={false} />
                <Th label="Tipo doc." active={false} />
                <th style={actionHeaderCellStyle}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {ui.loading ? (
                <tr><td colSpan={5} style={emptyTableCellStyle}>A carregar…</td></tr>
              ) : viewItems.length === 0 ? (
                <tr><td colSpan={5} style={emptyTableCellStyle}>Sem infractores para mostrar.</td></tr>
              ) : (
                viewItems.map((item) => (
                  <tr key={item.id}>
                    <td style={bodyCellStyle}>
                      <span style={dateBadgeStyle}>{formatDateTime(item.created_at)}</span>
                    </td>
                    <td style={bodyCellStyle}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <strong style={{ color: '#1f2937' }}>{item.nome || '-'}</strong>
                        <span style={{ color: '#7b8494', fontSize: 12 }}>Perfil individual registado no sistema.</span>
                      </div>
                    </td>
                    <td style={bodyCellStyle}>{item.nr_identificacao || '-'}</td>
                    <td style={bodyCellStyle}>{item.tipo_identificacao || '-'}</td>
                    <td style={{ ...bodyCellStyle, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <ActionIconButton label="Ver detalhes" variant="secondary" onClick={() => openDetails(item.id)}>
                        <EyeIcon />
                      </ActionIconButton>
                      <ActionIconButton label="Editar" variant="secondary" onClick={() => openEdit(item.id)}>
                        <PencilIcon />
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
      aria-sort={active ? (direction === 'asc' ? 'ascending' : 'descending') : 'none'}
      title={onClick ? 'Ordenar' : undefined}
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
  variant: 'secondary'
  onClick: () => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
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
  color: '#8d4a17',
  boxShadow: '0 12px 24px rgba(76, 57, 24, 0.10)',
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
  width: 160,
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

const actionIconButtonHoverStyle: Record<'secondary', React.CSSProperties> = {
  secondary: {
    background: '#f8efe2',
    borderColor: 'rgba(201, 109, 31, 0.28)',
    color: '#8d4a17',
    transform: 'translateY(-1px)',
    boxShadow: '0 14px 28px rgba(201, 109, 31, 0.12)',
  },
}
