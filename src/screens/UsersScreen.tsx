import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Card, Pagination } from '../components'
import UserForm, { type UserFormValues } from '../components/forms/UserForm'
import { UsersApi, type ModelUser, type UserCreateUserRequest, type UserUpdateUserRequest } from '../services'
import { useAuth } from '../contexts/AuthContext'

type UiState = {
  loading: boolean
  error: string | null
}

type FeedbackState = {
  type: 'success' | 'error'
  message: string
} | null

type SortKey = 'name' | 'email' | 'created_at'

export default function UsersScreen() {
  const { getApiConfig, getAuthorizationHeaderValue, logout } = useAuth()
  const [items, setItems] = useState<ModelUser[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [ui, setUi] = useState<UiState>({ loading: false, error: null })
  const [feedback, setFeedback] = useState<FeedbackState>(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [orderBy, setOrderBy] = useState<SortKey>('created_at')
  const [orderDirection, setOrderDirection] = useState<'asc' | 'desc'>('desc')

  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<ModelUser | null>(null)
  const [deleting, setDeleting] = useState<ModelUser | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const api = useMemo(() => new UsersApi(getApiConfig()), [getApiConfig])
  const authHeader = useMemo(() => getAuthorizationHeaderValue(), [getAuthorizationHeaderValue])

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
      const { data } = await api.privateUsersGet(authHeader, page, pageSize, orderBy, orderDirection)
      if (isUnauthorizedBody(data)) {
        logout('Sessão expirada. Inicie sessão novamente.')
        return
      }
      setItems(data.items ?? [])
      setTotal(data.total ?? 0)
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 401 || isUnauthorizedBody(err?.response?.data)) {
        logout('Sessão expirada. Inicie sessão novamente.')
        return
      }
      setUi({
        loading: false,
        error: !status ? 'Sem ligação ao servidor.' : status >= 500 ? 'Erro do servidor ao carregar utilizadores.' : 'Falha a obter utilizadores.',
      })
      return
    }
    setUi({ loading: false, error: null })
  }, [api, authHeader, logout, orderBy, orderDirection, page, pageSize])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [pageSize, searchTerm, typeFilter, orderBy, orderDirection])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const activeFilterCount = [searchTerm.trim(), typeFilter.trim()].filter(Boolean).length

  const typeOptions = useMemo(() => {
    const unique = new Set<string>()
    items.forEach((item) => {
      if (item.type?.trim()) unique.add(item.type.trim())
    })
    return Array.from(unique).sort((a, b) => a.localeCompare(b, 'pt-PT'))
  }, [items])

  const viewItems = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    const expectedType = typeFilter.trim().toLowerCase()
    return items.filter((item) => {
      const matchesSearch = !query || [item.name, item.email].some((value) => String(value || '').toLowerCase().includes(query))
      const matchesType = !expectedType || String(item.type || '').trim().toLowerCase() === expectedType
      return matchesSearch && matchesType
    })
  }, [items, searchTerm, typeFilter])

  function toggleSort(key: SortKey) {
    if (orderBy === key) setOrderDirection((direction) => (direction === 'asc' ? 'desc' : 'asc'))
    else {
      setOrderBy(key)
      setOrderDirection(key === 'created_at' ? 'desc' : 'asc')
    }
  }

  function clearFilters() {
    setSearchTerm('')
    setTypeFilter('')
    setOrderBy('created_at')
    setOrderDirection('desc')
    setPage(1)
  }

  async function handleCreateSubmit(values: UserFormValues) {
    setSubmitting(true)
    setSubmitError(null)
    try {
      const payload: UserCreateUserRequest = {
        name: values.name,
        email: values.email,
        password: values.password,
        username: values.username,
        type: values.type as any,
        type_id: values.type_id,
      }
      const { data } = await api.privateUsersPost(authHeader, payload)
      if (isUnauthorizedBody(data)) {
        logout('Sessão expirada. Inicie sessão novamente.')
        return
      }
      setShowCreate(false)
      setFeedback({ type: 'success', message: 'Utilizador criado com sucesso.' })
      await load()
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 401 || isUnauthorizedBody(err?.response?.data)) {
        logout('Sessão expirada. Inicie sessão novamente.')
        return
      }
      setSubmitError(status === 400 ? 'Dados inválidos. Verifique o formulário.' : !status ? 'Sem ligação ao servidor.' : status === 409 ? 'Já existe um utilizador com estes dados.' : 'Falha ao criar utilizador.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleEditSubmit(values: UserFormValues) {
    if (!editing?.id) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const payload: UserUpdateUserRequest = {
        name: values.name,
        email: values.email,
        password: values.password || undefined,
        type: values.type,
        type_id: values.type_id,
      }
      const { data } = await api.privateUsersIdPut(editing.id, authHeader, payload)
      if (isUnauthorizedBody(data)) {
        logout('Sessão expirada. Inicie sessão novamente.')
        return
      }
      setEditing(null)
      setFeedback({ type: 'success', message: 'Utilizador atualizado com sucesso.' })
      await load()
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 401 || isUnauthorizedBody(err?.response?.data)) {
        logout('Sessão expirada. Inicie sessão novamente.')
        return
      }
      setSubmitError(status === 400 ? 'Dados inválidos. Verifique o formulário.' : !status ? 'Sem ligação ao servidor.' : 'Falha ao atualizar utilizador.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id?: string) {
    if (!id) return
    setDeleteLoading(true)
    setDeleteError(null)
    try {
      await api.privateUsersIdDelete(id, authHeader)
      setDeleting(null)
      setFeedback({ type: 'success', message: 'Utilizador apagado com sucesso.' })
      await load()
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 401 || isUnauthorizedBody(err?.response?.data)) {
        logout('Sessão expirada. Inicie sessão novamente.')
        return
      }
      setDeleteError(!status ? 'Sem ligação ao servidor.' : status >= 500 ? 'Erro do servidor ao eliminar o utilizador.' : 'Não foi possível eliminar o utilizador.')
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card
        title="Filtros"
        subtitle="Refine os utilizadores por nome, email e perfil."
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
              <span style={fieldLabelStyle}>Pesquisa</span>
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nome ou email"
                style={fieldControlStyle}
              />
            </label>

            <label style={fieldGroupStyle}>
              <span style={fieldLabelStyle}>Perfil</span>
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={fieldControlStyle}>
                <option value="">Todos os perfis</option>
                {typeOptions.map((option) => (
                  <option key={option} value={option}>{formatUserType(option)}</option>
                ))}
              </select>
            </label>
          </div>
        ) : (
          <div style={collapsedFiltersHintStyle}>
            <span>Filtros recolhidos para dar mais foco aos resultados.</span>
            <span>{activeFilterCount > 0 ? `${activeFilterCount} filtro(s) ativo(s)` : 'Sem filtros ativos'}</span>
          </div>
        )}

        {ui.error ? <div style={errorBannerStyle}>{ui.error}</div> : null}
      </Card>

      <Card
        title="Resultados"
        subtitle="Lista paginada e ordenável."
        extra={(
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" onClick={load} style={filterHeaderButtonStyle}>
              {ui.loading ? 'A atualizar…' : 'Atualizar'}
            </button>
            <button type="button" onClick={() => { setShowCreate(true); setSubmitError(null) }} style={primaryHeaderButtonStyle}>
              Adicionar utilizador
            </button>
          </div>
        )}
      >
        {feedback ? <div style={feedback.type === 'success' ? successBannerStyle : errorBannerStyle}>{feedback.message}</div> : null}

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <Th label="Criado em" active={orderBy === 'created_at'} direction={orderDirection} onClick={() => toggleSort('created_at')} />
                <Th label="Nome" active={orderBy === 'name'} direction={orderDirection} onClick={() => toggleSort('name')} />
                <Th label="Email" active={orderBy === 'email'} direction={orderDirection} onClick={() => toggleSort('email')} />
                <Th label="Perfil" />
                <th style={actionHeaderCellStyle}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {ui.loading ? (
                <tr><td colSpan={5} style={emptyTableCellStyle}>A carregar utilizadores…</td></tr>
              ) : viewItems.length === 0 ? (
                <tr><td colSpan={5} style={emptyTableCellStyle}>Sem utilizadores para mostrar.</td></tr>
              ) : (
                viewItems.map((item, index) => (
                  <tr key={`user-${item.id ?? 'sem-id'}-${item.created_at ?? index}`}>
                    <td style={bodyCellStyle}>
                      <span style={dateBadgeStyle}>{formatDateTime(item.created_at)}</span>
                    </td>
                    <td style={bodyCellStyle}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 180 }}>
                        <strong style={{ color: '#1f2937' }}>{item.name || 'Nome não indicado'}</strong>
                        <span style={metaTextStyle}>{item.email || 'Sem email definido'}</span>
                      </div>
                    </td>
                    <td style={bodyCellStyle}>
                      <span style={emailBadgeStyle}>{item.email || '—'}</span>
                    </td>
                    <td style={bodyCellStyle}>
                      <span style={statusBadgeStyle}>{formatUserType(item.type)}</span>
                    </td>
                    <td style={{ ...bodyCellStyle, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <ActionIconButton label="Editar" variant="secondary" onClick={() => { setEditing(item); setSubmitError(null) }}>
                        <PencilIcon />
                      </ActionIconButton>
                      <ActionIconButton label="Eliminar" variant="danger" onClick={() => { setDeleting(item); setDeleteError(null) }}>
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
          title={showCreate ? 'Novo utilizador' : 'Editar utilizador'}
          error={submitError}
          onClose={() => {
            if (submitting) return
            setShowCreate(false)
            setEditing(null)
            setSubmitError(null)
          }}
        >
          <UserForm
            mode={showCreate ? 'create' : 'edit'}
            initialValues={editing ? {
              name: editing.name ?? '',
              email: editing.email ?? '',
              type: editing.type as any,
              type_id: editing.type_id ?? '',
            } : undefined}
            submitting={submitting}
            error={null}
            onSubmit={showCreate ? handleCreateSubmit : handleEditSubmit}
            onCancel={() => {
              if (submitting) return
              setShowCreate(false)
              setEditing(null)
              setSubmitError(null)
            }}
          />
        </FormModal>
      ) : null}

      {deleting ? (
        <DeleteConfirmModal
          item={deleting}
          loading={deleteLoading}
          error={deleteError}
          onCancel={() => {
            if (deleteLoading) return
            setDeleting(null)
            setDeleteError(null)
          }}
          onConfirm={() => handleDelete(deleting.id)}
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

function FormModal({
  title,
  error,
  onClose,
  children,
}: {
  title: string
  error: string | null
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div role="dialog" aria-modal="true" style={modalBackdropStyle} onClick={onClose}>
      <div onClick={(event) => event.stopPropagation()} style={modalCardStyle}>
        <h3 style={{ margin: 0, color: '#1f2937' }}>{title}</h3>
        {error ? <div style={modalErrorStyle}>{error}</div> : null}
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
  item: ModelUser
  loading: boolean
  error: string | null
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div role="dialog" aria-modal="true" style={modalBackdropStyle} onClick={onCancel}>
      <div onClick={(event) => event.stopPropagation()} style={{ ...modalCardStyle, maxWidth: 520 }}>
        <h3 style={{ margin: 0, color: '#1f2937' }}>Eliminar utilizador</h3>
        <p style={{ margin: 0, color: '#5f6673', lineHeight: 1.6 }}>
          Tem a certeza de que pretende eliminar <strong>{item.name || item.email || 'este utilizador'}</strong>?
        </p>
        {error ? <div style={modalErrorStyle}>{error}</div> : null}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
          <Button variant="secondary" onClick={onCancel} disabled={loading} style={secondaryActionButtonStyle}>Cancelar</Button>
          <Button variant="danger" onClick={onConfirm} disabled={loading} style={dangerActionButtonStyle}>
            {loading ? 'A eliminar…' : 'Eliminar'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function formatDateTime(iso?: string) {
  if (!iso) return '-'
  try {
    const date = new Date(iso)
    if (Number.isNaN(date.getTime())) return '-'
    return date.toLocaleString('pt-PT')
  } catch {
    return '-'
  }
}

function formatUserType(type?: string) {
  if (!type) return 'Sem perfil'
  const labels: Record<string, string> = {
    SUPER_ADMIN: 'Super administrador',
    PAIS: 'País',
    REGIAO: 'Região',
    ASC: 'ASC',
    PT: 'PT',
  }
  return labels[type] || type
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
  padding: '0 18px',
  borderRadius: 14,
  background: 'linear-gradient(180deg, #cf711f 0%, #a95516 100%)',
  border: '1px solid rgba(141, 74, 23, 0.24)',
  color: '#fffaf2',
  fontWeight: 800,
  boxShadow: '0 12px 24px rgba(141, 74, 23, 0.18)',
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
  color: '#6b7280',
}

const errorBannerStyle: React.CSSProperties = {
  marginTop: 14,
  padding: '12px 16px',
  borderRadius: 16,
  background: 'rgba(180, 35, 24, 0.10)',
  border: '1px solid rgba(180, 35, 24, 0.18)',
  color: '#b42318',
  fontWeight: 600,
}

const successBannerStyle: React.CSSProperties = {
  marginBottom: 14,
  padding: '12px 16px',
  borderRadius: 16,
  background: 'rgba(15, 118, 110, 0.10)',
  border: '1px solid rgba(15, 118, 110, 0.18)',
  color: '#0f766e',
  fontWeight: 600,
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
  width: 120,
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

const emailBadgeStyle: React.CSSProperties = {
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

const statusBadgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  minHeight: 32,
  padding: '0 12px',
  borderRadius: 999,
  background: 'rgba(141, 74, 23, 0.08)',
  color: '#8d4a17',
  fontSize: 12,
  fontWeight: 800,
}

const metaTextStyle: React.CSSProperties = {
  color: '#7b8494',
  fontSize: 12,
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
  zIndex: 50,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 16,
  background: 'rgba(15, 23, 42, 0.45)',
  backdropFilter: 'blur(6px)',
}

const modalCardStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 720,
  display: 'flex',
  flexDirection: 'column',
  gap: 18,
  padding: 24,
  borderRadius: 24,
  background: 'linear-gradient(180deg, #ffffff 0%, #fffaf5 100%)',
  border: '1px solid rgba(253, 186, 116, 0.8)',
  boxShadow: '0 32px 60px rgba(15, 23, 42, 0.22)',
}

const modalErrorStyle: React.CSSProperties = {
  padding: '12px 14px',
  borderRadius: 16,
  border: '1px solid rgba(220, 38, 38, 0.18)',
  background: 'rgba(254, 226, 226, 0.92)',
  color: '#991b1b',
}

const secondaryActionButtonStyle: React.CSSProperties = {
  minHeight: 42,
  padding: '0 16px',
  borderRadius: 14,
  background: 'linear-gradient(180deg, #fffaf2 0%, #f6ecde 100%)',
  border: '1px solid rgba(101, 74, 32, 0.16)',
  color: '#8d4a17',
  fontWeight: 700,
  boxShadow: '0 8px 18px rgba(76, 57, 24, 0.08)',
}

const dangerActionButtonStyle: React.CSSProperties = {
  minHeight: 42,
  padding: '0 18px',
  borderRadius: 14,
  background: 'linear-gradient(180deg, #c83b2f 0%, #a5281d 100%)',
  border: '1px solid rgba(165, 40, 29, 0.24)',
  color: '#fff7f5',
  fontWeight: 800,
  boxShadow: '0 12px 24px rgba(165, 40, 29, 0.18)',
}
