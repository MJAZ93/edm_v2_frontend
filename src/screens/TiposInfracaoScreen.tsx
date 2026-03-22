import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActionIconButton,
  Button,
  DeleteConfirmModal,
  ManagementModal,
  PageSectionCard,
  Pagination,
  PencilIcon,
  SortableHeader,
  SummaryChip,
  TrashIcon,
  actionCellStyle,
  bodyCellStyle,
  emptyTableCellStyle,
  fieldLabelStyle,
  filtersGridStyle,
  inputStyle,
  noticeBannerStyle,
  stackedFieldStyle,
  summaryRowStyle,
  tableWrapStyle,
} from '../components'
import { TipoInfracaoApi, type TipoInfracaoCreateTipoInfracaoRequest, type TipoInfracaoUpdateTipoInfracaoRequest, type ModelTipoInfracao } from '../services'
import { useAuth } from '../contexts/AuthContext'

type UiState = { loading: boolean; error: string | null }

export default function TiposInfracaoScreen() {
  const { getApiConfig, getAuthorizationHeaderValue, logout } = useAuth()
  const api = useMemo(() => new TipoInfracaoApi(getApiConfig()), [getApiConfig])
  const authHeader = useMemo(() => getAuthorizationHeaderValue(), [getAuthorizationHeaderValue])

  const [items, setItems] = useState<ModelTipoInfracao[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [ui, setUi] = useState<UiState>({ loading: false, error: null })
  const [filterName, setFilterName] = useState('')
  const [orderBy, setOrderBy] = useState<'name' | 'created_at'>('created_at')
  const [orderDirection, setOrderDirection] = useState<'asc' | 'desc'>('desc')

  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<ModelTipoInfracao | null>(null)
  const [pendingDelete, setPendingDelete] = useState<ModelTipoInfracao | null>(null)
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
      const { data } = await api.privateTiposInfracaoGet(authHeader, page, pageSize, orderBy, orderDirection, filterName || undefined)
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
      const msg = !status ? 'Sem ligação ao servidor.' : status >= 500 ? 'Erro do servidor ao carregar tipos de infração.' : 'Falha a obter tipos de infração.'
      setUi({ loading: false, error: msg })
      return
    }
    setUi({ loading: false, error: null })
  }, [api, authHeader, page, pageSize, filterName, orderBy, orderDirection, logout])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [filterName, pageSize, orderBy, orderDirection])

  function toggleSort(key: 'name' | 'created_at') {
    if (orderBy === key) setOrderDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
    else {
      setOrderBy(key)
      setOrderDirection('asc')
    }
  }

  function clearFilters() {
    setFilterName('')
    setOrderBy('created_at')
    setOrderDirection('desc')
    setPage(1)
  }

  async function handleCreate(name: string) {
    setSubmitting(true)
    setSubmitError(null)
    try {
      const payload: TipoInfracaoCreateTipoInfracaoRequest = { name }
      const { data } = await api.privateTiposInfracaoPost(authHeader, payload)
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
      setSubmitError(status === 400 ? 'Dados inválidos.' : !status ? 'Sem ligação ao servidor.' : 'Falha ao criar tipo de infração.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleUpdate(id: string, name: string) {
    setSubmitting(true)
    setSubmitError(null)
    try {
      const payload: TipoInfracaoUpdateTipoInfracaoRequest = { name }
      const { data } = await api.privateTiposInfracaoIdPut(id, authHeader, payload)
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
      setSubmitError(status === 400 ? 'Dados inválidos.' : !status ? 'Sem ligação ao servidor.' : 'Falha ao atualizar tipo de infração.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id?: string) {
    if (!id) return
    setDeleteLoading(true)
    setDeleteError(null)
    try {
      const res = await api.privateTiposInfracaoIdDelete(id, authHeader)
      if (isUnauthorizedBody((res as any)?.data)) {
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
      setDeleteError(!status ? 'Sem ligação ao servidor.' : status >= 500 ? 'Erro do servidor ao eliminar tipo de infração.' : 'Falha ao eliminar tipo de infração.')
    } finally {
      setDeleteLoading(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / Math.max(1, pageSize)))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <PageSectionCard
        title="Filtros e página"
        subtitle="Ajuste a pesquisa textual e o tamanho da página da tabela."
        extra={(
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Button size="sm" variant="secondary" onClick={clearFilters}>Limpar filtros</Button>
            <Button size="sm" variant="secondary" onClick={() => { setShowCreate(true); setSubmitError(null) }}>Novo tipo</Button>
          </div>
        )}
      >
        <div style={filtersGridStyle}>
          <label style={stackedFieldStyle}>
            <span style={fieldLabelStyle}>Pesquisar por nome</span>
            <input value={filterName} onChange={(event) => setFilterName(event.target.value)} placeholder="Ex.: Ligação indevida" style={inputStyle} />
          </label>

          <label style={stackedFieldStyle}>
            <span style={fieldLabelStyle}>Itens por página</span>
            <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))} style={inputStyle}>
              <option value={10}>10 itens</option>
              <option value={20}>20 itens</option>
              <option value={50}>50 itens</option>
            </select>
          </label>
        </div>

        <div style={{ ...summaryRowStyle, marginTop: 16 }}>
          <SummaryChip>Total: {total.toLocaleString('pt-PT')}</SummaryChip>
          <SummaryChip>Visiveis: {items.length.toLocaleString('pt-PT')}</SummaryChip>
          {filterName.trim() ? <SummaryChip>Pesquisa: {filterName.trim()}</SummaryChip> : null}
        </div>

        {ui.error ? <div style={{ ...noticeBannerStyle, marginTop: 16 }}>{ui.error}</div> : null}
      </PageSectionCard>

      <PageSectionCard title="Lista de tipos" subtitle="Use as ações rápidas para atualizar ou remover tipos de infração.">
        <div style={tableWrapStyle}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <SortableHeader label="Nome" active={orderBy === 'name'} direction={orderDirection} onClick={() => toggleSort('name')} />
                <SortableHeader label="Acoes" align="center" />
              </tr>
            </thead>
            <tbody>
              {ui.loading ? (
                <tr><td colSpan={2} style={emptyTableCellStyle}>A carregar...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={2} style={emptyTableCellStyle}>Sem tipos para mostrar.</td></tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id}>
                    <td style={bodyCellStyle}>
                      <strong style={{ color: '#1f2937' }}>{item.name || '-'}</strong>
                    </td>
                    <td style={{ ...actionCellStyle, justifyContent: 'center' }}>
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
      </PageSectionCard>

      {(showCreate || editing) ? (
        <ManagementModal
          eyebrow={showCreate ? 'Adicionar' : 'Editar'}
          title={showCreate ? 'Novo tipo de infração' : 'Editar tipo de infração'}
          description="Defina nomes claros para manter a classificação operacional uniforme."
          error={submitError}
          maxWidth={540}
          onClose={() => {
            if (submitting) return
            setShowCreate(false)
            setEditing(null)
            setSubmitError(null)
          }}
        >
          <TipoForm
            defaultName={editing?.name ?? ''}
            submitting={submitting}
            onCancel={() => { setShowCreate(false); setEditing(null); setSubmitError(null) }}
            onSubmit={(name) => showCreate ? handleCreate(name) : (editing?.id ? handleUpdate(editing.id, name) : undefined)}
          />
        </ManagementModal>
      ) : null}

      {pendingDelete ? (
        <DeleteConfirmModal
          title="Eliminar tipo de infração"
          description="Está prestes a remover o tipo"
          itemLabel={`"${pendingDelete.name || 'Sem nome'}".`}
          loading={deleteLoading}
          error={deleteError}
          confirmLabel="Eliminar tipo"
          onCancel={() => {
            if (deleteLoading) return
            setPendingDelete(null)
            setDeleteError(null)
          }}
          onConfirm={() => handleDelete(pendingDelete.id)}
        />
      ) : null}
    </div>
  )
}

function TipoForm({ defaultName, submitting, onSubmit, onCancel }: { defaultName?: string; submitting?: boolean; onSubmit: (name: string) => void; onCancel: () => void }) {
  const [name, setName] = useState(defaultName ?? '')

  return (
    <form onSubmit={(event) => { event.preventDefault(); if (!name.trim()) return; onSubmit(name.trim()) }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <label style={stackedFieldStyle}>
        <span style={fieldLabelStyle}>Nome</span>
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nome do tipo" style={inputStyle} />
      </label>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>Cancelar</Button>
        <Button type="submit" disabled={submitting}>{submitting ? 'A guardar...' : 'Guardar tipo'}</Button>
      </div>
    </form>
  )
}
