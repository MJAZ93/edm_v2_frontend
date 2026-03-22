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
  textareaStyle,
} from '../components'
import { FormaConhecimentoApi, type FormaConhecimentoCreateFormaConhecimentoRequest, type FormaConhecimentoUpdateFormaConhecimentoRequest, type ModelFormaConhecimento } from '../services'
import { useAuth } from '../contexts/AuthContext'

type UiState = { loading: boolean; error: string | null }

export default function FormasConhecimentoScreen() {
  const { getApiConfig, getAuthorizationHeaderValue, logout } = useAuth()
  const api = useMemo(() => new FormaConhecimentoApi(getApiConfig()), [getApiConfig])
  const authHeader = useMemo(() => getAuthorizationHeaderValue(), [getAuthorizationHeaderValue])

  const [items, setItems] = useState<ModelFormaConhecimento[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [ui, setUi] = useState<UiState>({ loading: false, error: null })
  const [filterName, setFilterName] = useState('')
  const [orderBy, setOrderBy] = useState<'name' | 'created_at'>('created_at')
  const [orderDirection, setOrderDirection] = useState<'asc' | 'desc'>('desc')

  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<ModelFormaConhecimento | null>(null)
  const [pendingDelete, setPendingDelete] = useState<ModelFormaConhecimento | null>(null)
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
      const { data } = await api.privateFormaConhecimentosGet(authHeader, page, pageSize, orderBy, orderDirection, filterName || undefined)
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
      const msg = !status ? 'Sem ligação ao servidor.' : status >= 500 ? 'Erro do servidor ao carregar formas de conhecimento.' : 'Falha a obter formas de conhecimento.'
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

  async function handleCreate(input: { name: string; description?: string }) {
    setSubmitting(true)
    setSubmitError(null)
    try {
      const payload: FormaConhecimentoCreateFormaConhecimentoRequest = { name: input.name, description: input.description }
      const { data } = await api.privateFormaConhecimentosPost(authHeader, payload)
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
      setSubmitError(status === 400 ? 'Dados inválidos.' : !status ? 'Sem ligação ao servidor.' : 'Falha ao criar forma de conhecimento.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleUpdate(id: string, input: { name: string; description?: string }) {
    setSubmitting(true)
    setSubmitError(null)
    try {
      const payload: FormaConhecimentoUpdateFormaConhecimentoRequest = { name: input.name, description: input.description }
      const { data } = await api.privateFormaConhecimentosIdPut(id, authHeader, payload)
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
      setSubmitError(status === 400 ? 'Dados inválidos.' : !status ? 'Sem ligação ao servidor.' : 'Falha ao atualizar forma de conhecimento.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id?: string) {
    if (!id) return
    setDeleteLoading(true)
    setDeleteError(null)
    try {
      const res = await api.privateFormaConhecimentosIdDelete(id, authHeader)
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
      setDeleteError(!status ? 'Sem ligação ao servidor.' : status >= 500 ? 'Erro do servidor ao eliminar forma de conhecimento.' : 'Falha ao eliminar forma de conhecimento.')
    } finally {
      setDeleteLoading(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / Math.max(1, pageSize)))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <PageSectionCard
        title="Filtros e página"
        subtitle="Refine a lista por nome e mantenha a navegação da tabela sob controlo."
        extra={(
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Button size="sm" variant="secondary" onClick={clearFilters}>Limpar filtros</Button>
            <Button size="sm" variant="secondary" onClick={() => { setShowCreate(true); setSubmitError(null) }}>Nova forma</Button>
          </div>
        )}
      >
        <div style={filtersGridStyle}>
          <label style={stackedFieldStyle}>
            <span style={fieldLabelStyle}>Pesquisar por nome</span>
            <input value={filterName} onChange={(event) => setFilterName(event.target.value)} placeholder="Ex.: Denuncia" style={inputStyle} />
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

      <PageSectionCard title="Lista de formas" subtitle="A tabela apresenta descrição e ações rápidas para cada registo.">
        <div style={tableWrapStyle}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <SortableHeader label="Nome" active={orderBy === 'name'} direction={orderDirection} onClick={() => toggleSort('name')} />
                <SortableHeader label="Descricao" />
                <SortableHeader label="Acoes" align="center" />
              </tr>
            </thead>
            <tbody>
              {ui.loading ? (
                <tr><td colSpan={3} style={emptyTableCellStyle}>A carregar...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={3} style={emptyTableCellStyle}>Sem formas para mostrar.</td></tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id}>
                    <td style={bodyCellStyle}><strong style={{ color: '#1f2937' }}>{item.name || '-'}</strong></td>
                    <td style={bodyCellStyle}>{item.description || 'Sem descrição.'}</td>
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
          title={showCreate ? 'Nova forma de conhecimento' : 'Editar forma de conhecimento'}
          description="Defina o nome e, se necessário, uma descrição curta para dar contexto ao registo."
          error={submitError}
          maxWidth={560}
          onClose={() => {
            if (submitting) return
            setShowCreate(false)
            setEditing(null)
            setSubmitError(null)
          }}
        >
          <FormaConhecimentoForm
            defaultValue={{ name: editing?.name ?? '', description: editing?.description ?? '' }}
            submitting={submitting}
            onCancel={() => { setShowCreate(false); setEditing(null); setSubmitError(null) }}
            onSubmit={(input) => showCreate ? handleCreate(input) : (editing?.id ? handleUpdate(editing.id, input) : undefined)}
          />
        </ManagementModal>
      ) : null}

      {pendingDelete ? (
        <DeleteConfirmModal
          title="Eliminar forma de conhecimento"
          description="Está prestes a remover a forma"
          itemLabel={`"${pendingDelete.name || 'Sem nome'}".`}
          loading={deleteLoading}
          error={deleteError}
          confirmLabel="Eliminar forma"
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

function FormaConhecimentoForm({
  defaultValue,
  submitting,
  onSubmit,
  onCancel,
}: {
  defaultValue?: { name: string; description?: string }
  submitting?: boolean
  onSubmit: (input: { name: string; description?: string }) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(defaultValue?.name ?? '')
  const [description, setDescription] = useState(defaultValue?.description ?? '')

  return (
    <form onSubmit={(event) => { event.preventDefault(); if (!name.trim()) return; onSubmit({ name: name.trim(), description: description.trim() || undefined }) }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <label style={stackedFieldStyle}>
        <span style={fieldLabelStyle}>Nome</span>
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nome da forma" style={inputStyle} />
      </label>

      <label style={stackedFieldStyle}>
        <span style={fieldLabelStyle}>Descrição</span>
        <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Descrição opcional" rows={3} style={textareaStyle} />
      </label>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>Cancelar</Button>
        <Button type="submit" disabled={submitting}>{submitting ? 'A guardar...' : 'Guardar forma'}</Button>
      </div>
    </form>
  )
}
