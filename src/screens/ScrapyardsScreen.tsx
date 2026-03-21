import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Card, Pagination } from '../components'
import ScrapyardForm, { type ScrapyardFormValues } from '../components/forms/ScrapyardForm'
import { useAuth } from '../contexts/AuthContext'
import { ScrapyardApi, type ModelScrapyard, type ScrapyardCreateScrapyardRequest, type ScrapyardUpdateScrapyardRequest } from '../services'

type UiState = { loading: boolean; error: string | null }

export default function ScrapyardsScreen() {
  const { getApiConfig, getAuthorizationHeaderValue, logout } = useAuth()
  const api = useMemo(() => new ScrapyardApi(getApiConfig()), [getApiConfig])
  const authHeader = useMemo(() => getAuthorizationHeaderValue(), [getAuthorizationHeaderValue])

  const [items, setItems] = useState<ModelScrapyard[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [ui, setUi] = useState<UiState>({ loading: false, error: null })

  const [filterText, setFilterText] = useState('')
  const [dataInicio, setDataInicio] = useState<string | null>(null)
  const [dataFim, setDataFim] = useState<string | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [orderBy, setOrderBy] = useState<'nome' | 'nivel_confianca' | 'created_at'>('created_at')
  const [orderDirection, setOrderDirection] = useState<'asc' | 'desc'>('desc')

  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<ModelScrapyard | null>(null)
  const [pendingDelete, setPendingDelete] = useState<ModelScrapyard | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

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
      const { data } = await api.privateScrapyardsGet(authHeader, page, pageSize, orderBy, orderDirection)
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
      const message = !status
        ? 'Sem ligação ao servidor.'
        : status >= 500
          ? 'Erro do servidor ao carregar sucatarias.'
          : 'Falha a obter sucatarias.'
      setUi({ loading: false, error: message })
      return
    }
    setUi({ loading: false, error: null })
  }, [api, authHeader, logout, orderBy, orderDirection, page, pageSize])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [pageSize, filterText, dataInicio, dataFim, orderBy, orderDirection])

  function toggleSort(key: 'nome' | 'nivel_confianca' | 'created_at') {
    if (orderBy === key) setOrderDirection((direction) => (direction === 'asc' ? 'desc' : 'asc'))
    else {
      setOrderBy(key)
      setOrderDirection('asc')
    }
  }

  const formatPercent = (value?: number) => (typeof value === 'number' && !Number.isNaN(value) ? `${(value * 100).toFixed(1)} %` : '—')
  const formatDateTime = (iso?: string) => {
    if (!iso) return '-'
    try {
      const date = new Date(iso)
      if (Number.isNaN(date.getTime())) return '-'
      return date.toLocaleDateString('pt-PT')
    } catch {
      return '-'
    }
  }

  const resolveMateriais = useCallback((list?: Array<{ id?: string; name?: string }>) => {
    if (!Array.isArray(list) || list.length === 0) return '—'
    return list.map((item) => item.name || item.id).filter(Boolean).join(', ')
  }, [])

  async function handleCreateSubmit(values: ScrapyardFormValues) {
    setSubmitting(true)
    setSubmitError(null)
    try {
      const payload: ScrapyardCreateScrapyardRequest = {
        nome: values.nome,
        asc_id: values.asc_id,
        lat: values.lat,
        long: values.lng,
        nivel_confianca: values.nivel_confianca ?? 50,
        material_ids: values.material_ids ?? [],
      }
      const { data } = await api.privateScrapyardsPost(authHeader, payload)
      if (isUnauthorizedBody(data)) {
        logout('Sessão expirada. Inicie sessão novamente.')
        return
      }
      setShowCreate(false)
      await load()
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 401 || isUnauthorizedBody(err?.response?.data)) {
        logout('Sessão expirada. Inicie sessão novamente.')
        return
      }
      if (status === 400) setSubmitError('Dados inválidos. Verifique o formulário.')
      else if (status === 409) setSubmitError('Conflito ao criar sucataria.')
      else if (!status) setSubmitError('Sem ligação ao servidor.')
      else setSubmitError('Falha ao criar sucataria.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleEditSubmit(values: ScrapyardFormValues) {
    if (!editing?.id) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const payload: ScrapyardUpdateScrapyardRequest = {
        nome: values.nome,
        asc_id: values.asc_id || undefined,
        lat: values.lat,
        long: values.lng,
        nivel_confianca: values.nivel_confianca ?? 50,
        material_ids: values.material_ids ?? [],
      }
      const { data } = await api.privateScrapyardsIdPut(editing.id, authHeader, payload)
      if (isUnauthorizedBody(data)) {
        logout('Sessão expirada. Inicie sessão novamente.')
        return
      }
      setEditing(null)
      await load()
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 401 || isUnauthorizedBody(err?.response?.data)) {
        logout('Sessão expirada. Inicie sessão novamente.')
        return
      }
      if (status === 400) setSubmitError('Dados inválidos. Verifique o formulário.')
      else if (!status) setSubmitError('Sem ligação ao servidor.')
      else setSubmitError('Falha ao atualizar sucataria.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(item: ModelScrapyard) {
    if (!item.id) return
    setDeleteLoading(true)
    setDeleteError(null)
    try {
      const response = await api.privateScrapyardsIdDelete(item.id, authHeader)
      if ((response as any)?.data && isUnauthorizedBody((response as any).data)) {
        logout('Sessão expirada. Inicie sessão novamente.')
        return
      }
      setPendingDelete(null)
      await load()
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 401 || isUnauthorizedBody(err?.response?.data)) {
        logout('Sessão expirada. Inicie sessão novamente.')
        return
      }
      setDeleteError(!status ? 'Sem ligação ao servidor.' : 'Não foi possível eliminar a sucataria.')
    } finally {
      setDeleteLoading(false)
    }
  }

  const viewItems = useMemo(() => {
    const query = filterText.trim().toLowerCase()
    const startTs = dataInicio ? Date.parse(dataInicio) : null
    const endTs = dataFim ? Date.parse(dataFim) : null
    return items.filter((item) => {
      const createdAt = item.created_at ? Date.parse(String(item.created_at)) : null
      if (startTs && (createdAt == null || createdAt < startTs)) return false
      if (endTs) {
        const endOfDay = endTs + 24 * 60 * 60 * 1000
        if (createdAt == null || createdAt >= endOfDay) return false
      }
      if (!query) return true
      const fields = [
        item.nome || '',
        item.asc_name || item.asc_id || '',
        resolveMateriais(item.materiais),
      ]
      return fields.some((value) => value.toLowerCase().includes(query))
    })
  }, [dataFim, dataInicio, filterText, items, resolveMateriais])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const activeFilterCount = [filterText.trim(), dataInicio, dataFim].filter(Boolean).length

  function openDetails(id?: string) {
    if (!id) return
    window.history.pushState({}, '', `/sucatarias/${id}`)
    window.dispatchEvent(new Event('locationchange'))
  }

  function openMap() {
    if (window.location.pathname !== '/sucatarias/mapa') window.history.pushState({}, '', '/sucatarias/mapa')
    window.dispatchEvent(new Event('popstate'))
    window.dispatchEvent(new Event('locationchange'))
  }

  function clearFilters() {
    setFilterText('')
    setDataInicio(null)
    setDataFim(null)
    setOrderBy('created_at')
    setOrderDirection('desc')
    setPage(1)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card
        title="Filtros"
        subtitle="Refine as sucatarias por nome, ASC, materiais e período de registo."
        extra={(
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
        )}
      >
        {filtersOpen ? (
          <div style={filtersGridStyle}>
            <label style={fieldGroupStyle}>
              <span style={fieldLabelStyle}>Pesquisar</span>
              <input
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder="Pesquisar por nome ou contexto…"
                style={fieldControlStyle}
              />
            </label>

            <label style={fieldGroupStyle}>
              <span style={fieldLabelStyle}>Criada desde</span>
              <input type="date" value={dataInicio ?? ''} onChange={(e) => setDataInicio(e.target.value || null)} style={fieldControlStyle} />
            </label>

            <label style={fieldGroupStyle}>
              <span style={fieldLabelStyle}>Criada até</span>
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
        </div>

        {ui.error ? <div style={errorBannerStyle}>{ui.error}</div> : null}
      </Card>

      <Card
        title="Resultados"
        subtitle="Lista paginada e ordenável."
        extra={(
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" onClick={openMap} style={filterHeaderButtonStyle}>Ver no mapa</button>
            <button type="button" onClick={() => setShowCreate(true)} style={primaryHeaderButtonStyle}>Nova sucataria</button>
          </div>
        )}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <Th label="Criada em" active={orderBy === 'created_at'} direction={orderDirection} onClick={() => toggleSort('created_at')} />
                <Th label="Nome" active={orderBy === 'nome'} direction={orderDirection} onClick={() => toggleSort('nome')} />
                <Th label="ASC" />
                <Th label="Desconfiança" active={orderBy === 'nivel_confianca'} direction={orderDirection} onClick={() => toggleSort('nivel_confianca')} />
                <Th label="Materiais" />
                <th style={actionHeaderCellStyle}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {ui.loading ? (
                <tr><td colSpan={6} style={emptyTableCellStyle}>A carregar…</td></tr>
              ) : viewItems.length === 0 ? (
                <tr><td colSpan={6} style={emptyTableCellStyle}>Sem sucatarias para mostrar.</td></tr>
              ) : (
                viewItems.map((item) => (
                  <tr key={item.id}>
                    <td style={bodyCellStyle}>
                      <span style={dateBadgeStyle}>{formatDateTime(item.created_at)}</span>
                    </td>
                    <td style={bodyCellStyle}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <strong style={{ color: '#1f2937' }}>{item.nome || item.id || '-'}</strong>
                        <span style={{ color: '#7b8494', fontSize: 12 }}>
                          {item.lat != null && item.long != null ? `${Number(item.lat).toFixed(5)}, ${Number(item.long).toFixed(5)}` : 'Sem coordenadas'}
                        </span>
                      </div>
                    </td>
                    <td style={bodyCellStyle}>{item.asc_name || item.asc_id || '—'}</td>
                    <td style={bodyCellStyle}>
                      <span style={valueBadgeStyle}>{formatPercent(item.nivel_confianca)}</span>
                    </td>
                    <td style={{ ...bodyCellStyle, maxWidth: 340 }}>
                      <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={resolveMateriais(item.materiais)}>
                        {resolveMateriais(item.materiais)}
                      </div>
                    </td>
                    <td style={{ ...bodyCellStyle, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <ActionIconButton label="Ver detalhes" variant="secondary" onClick={() => openDetails(item.id)}>
                        <EyeIcon />
                      </ActionIconButton>
                      <ActionIconButton label="Editar" variant="secondary" onClick={() => { setEditing(item); setSubmitError(null) }}>
                        <PencilIcon />
                      </ActionIconButton>
                      <ActionIconButton label="Eliminar" variant="danger" onClick={() => { setPendingDelete(item); setDeleteError(null) }}>
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

      {(showCreate || editing) ? (
        <FormModal
          title={showCreate ? 'Nova sucataria' : 'Editar sucataria'}
          onClose={() => {
            if (submitting) return
            setShowCreate(false)
            setEditing(null)
            setSubmitError(null)
          }}
        >
          {showCreate ? (
            <ScrapyardForm mode="create" submitting={submitting} error={submitError} onSubmit={handleCreateSubmit} onCancel={() => { setShowCreate(false); setSubmitError(null) }} />
          ) : (
            <ScrapyardForm
              mode="edit"
              initialValues={{
                nome: editing?.nome ?? '',
                asc_id: editing?.asc_id ?? '',
                lat: editing?.lat ?? undefined,
                lng: editing?.long ?? undefined,
                nivel_confianca: editing?.nivel_confianca ?? undefined,
                material_ids: (editing?.materiais ?? []).map((material) => material?.id).filter(Boolean) as string[],
              }}
              submitting={submitting}
              error={submitError}
              onSubmit={handleEditSubmit}
              onCancel={() => {
                setEditing(null)
                setSubmitError(null)
              }}
            />
          )}
        </FormModal>
      ) : null}

      {pendingDelete ? (
        <DeleteConfirmModal
          item={pendingDelete}
          loading={deleteLoading}
          error={deleteError}
          onCancel={() => {
            if (deleteLoading) return
            setPendingDelete(null)
            setDeleteError(null)
          }}
          onConfirm={() => handleDelete(pendingDelete)}
        />
      ) : null}
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

function FormModal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div style={modalBackdropStyle} role="dialog" aria-modal="true" aria-labelledby="scrapyard-form-title" onClick={onClose}>
      <div style={modalCardStyle} onClick={(event) => event.stopPropagation()}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={modalEyebrowStyle}>Sucatarias</span>
          <h3 id="scrapyard-form-title" style={{ margin: 0, fontSize: 24, lineHeight: 1.1, color: '#1f2937' }}>{title}</h3>
        </div>
        {children}
      </div>
    </div>
  )
}

function DeleteConfirmModal({
  item,
  loading,
  error,
  onCancel,
  onConfirm,
}: {
  item: ModelScrapyard
  loading: boolean
  error: string | null
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div style={modalBackdropStyle} role="dialog" aria-modal="true" aria-labelledby="scrapyard-delete-title">
      <div style={modalCardStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={modalEyebrowStyle}>Confirmação</span>
          <h3 id="scrapyard-delete-title" style={{ margin: 0, fontSize: 24, lineHeight: 1.1, color: '#1f2937' }}>
            Eliminar sucataria
          </h3>
          <p style={{ margin: 0, color: '#5f6673', lineHeight: 1.6 }}>
            Está prestes a eliminar a sucataria <strong style={{ color: '#1f2937' }}>{item.nome || item.id || 'sem nome'}</strong>.
            Confirme apenas se pretende remover definitivamente este registo.
          </p>
        </div>

        {error ? <div style={modalErrorStyle}>{error}</div> : null}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Button variant="secondary" onClick={onCancel} disabled={loading}>Cancelar</Button>
          <Button variant="danger" onClick={onConfirm} disabled={loading}>
            {loading ? 'A eliminar…' : 'Eliminar sucataria'}
          </Button>
        </div>
      </div>
    </div>
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

const modalBackdropStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 80,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 24,
  background: 'rgba(24, 31, 42, 0.42)',
  backdropFilter: 'blur(8px)',
}

const modalCardStyle: React.CSSProperties = {
  width: 'min(100%, 760px)',
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
  padding: 24,
  borderRadius: 24,
  background: 'linear-gradient(180deg, rgba(255, 252, 246, 0.98) 0%, rgba(250, 244, 234, 0.96) 100%)',
  border: '1px solid rgba(101, 74, 32, 0.14)',
  boxShadow: '0 28px 70px rgba(55, 34, 8, 0.18)',
  maxHeight: 'calc(100vh - 48px)',
  overflowY: 'auto',
}

const modalEyebrowStyle: React.CSSProperties = {
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

const modalErrorStyle: React.CSSProperties = {
  padding: '12px 14px',
  borderRadius: 16,
  background: '#fff1f1',
  border: '1px solid rgba(200, 60, 60, 0.18)',
  color: '#b42318',
  fontSize: 14,
  fontWeight: 700,
}
