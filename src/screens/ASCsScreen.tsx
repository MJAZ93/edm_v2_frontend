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
import { ASCApi, RegiaoApi, type AscCreateASCRequest, type AscUpdateASCRequest, type ModelRegiao } from '../services'
import { useAuth } from '../contexts/AuthContext'

type ASC = { id?: string; name?: string; regiao_id?: string }
type UiState = { loading: boolean; error: string | null }

export default function ASCsScreen() {
  const { getApiConfig, getAuthorizationHeaderValue, logout } = useAuth()
  const api = useMemo(() => new ASCApi(getApiConfig()), [getApiConfig])
  const regApi = useMemo(() => new RegiaoApi(getApiConfig()), [getApiConfig])
  const authHeader = useMemo(() => getAuthorizationHeaderValue(), [getAuthorizationHeaderValue])

  const [items, setItems] = useState<ASC[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [ui, setUi] = useState<UiState>({ loading: false, error: null })

  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<ASC | null>(null)
  const [pendingDelete, setPendingDelete] = useState<ASC | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [regioes, setRegioes] = useState<ModelRegiao[]>([])
  const [filterName, setFilterName] = useState('')
  const [filterRegiaoId, setFilterRegiaoId] = useState('')
  const [orderBy, setOrderBy] = useState<'name' | 'created_at'>('created_at')
  const [orderDirection, setOrderDirection] = useState<'asc' | 'desc'>('desc')

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
      const { data } = await api.privateAscsGet(authHeader, page, pageSize, orderBy, orderDirection, filterName || undefined, filterRegiaoId || undefined)
      if (isUnauthorizedBody(data)) {
        logout('Sessão expirada. Inicie sessão novamente.')
        return
      }
      setItems((data.items as any) || [])
      setTotal(data.total ?? 0)
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 401 || isUnauthorizedBody(err?.response?.data)) {
        logout('Sessão expirada. Inicie sessão novamente.')
        return
      }
      const msg = !status ? 'Sem ligação ao servidor.' : status >= 500 ? 'Erro do servidor ao carregar ASCs.' : 'Falha a obter ASCs.'
      setUi({ loading: false, error: msg })
      return
    }
    setUi({ loading: false, error: null })
  }, [api, authHeader, page, pageSize, filterName, filterRegiaoId, orderBy, orderDirection, logout])

  const loadRegioes = useCallback(async () => {
    try {
      const { data } = await regApi.privateRegioesGet(authHeader, 1, 100, 'name', 'asc')
      if (isUnauthorizedBody(data)) {
        logout('Sessão expirada. Inicie sessão novamente.')
        return
      }
      setRegioes(data.items ?? [])
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 401 || isUnauthorizedBody(err?.response?.data)) {
        logout('Sessão expirada. Inicie sessão novamente.')
      }
    }
  }, [regApi, authHeader, logout])

  useEffect(() => { load() }, [load])
  useEffect(() => { loadRegioes() }, [loadRegioes])
  useEffect(() => { setPage(1) }, [filterName, filterRegiaoId, pageSize, orderBy, orderDirection])

  function toggleSort(key: 'name' | 'created_at') {
    if (orderBy === key) setOrderDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
    else {
      setOrderBy(key)
      setOrderDirection('asc')
    }
  }

  function clearFilters() {
    setFilterName('')
    setFilterRegiaoId('')
    setOrderBy('created_at')
    setOrderDirection('desc')
    setPage(1)
  }

  function resolveRegiao(id?: string) {
    return regioes.find((regiao) => regiao.id === id)?.name || id || '-'
  }

  async function handleCreate(input: { name: string; regiao_id: string }) {
    setSubmitting(true)
    setSubmitError(null)
    try {
      const payload: AscCreateASCRequest = { name: input.name, regiao_id: input.regiao_id }
      const { data } = await api.privateAscsPost(authHeader, payload)
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
      setSubmitError(status === 400 ? 'Dados inválidos.' : !status ? 'Sem ligação ao servidor.' : 'Falha ao criar ASC.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleUpdate(id: string, input: { name: string; regiao_id: string }) {
    setSubmitting(true)
    setSubmitError(null)
    try {
      const payload: AscUpdateASCRequest = { name: input.name, regiao_id: input.regiao_id }
      const { data } = await api.privateAscsIdPut(id, authHeader, payload)
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
      setSubmitError(status === 400 ? 'Dados inválidos.' : !status ? 'Sem ligação ao servidor.' : 'Falha ao atualizar ASC.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id?: string) {
    if (!id) return
    setDeleteLoading(true)
    setDeleteError(null)
    try {
      const res = await api.privateAscsIdDelete(id, authHeader)
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
      setDeleteError(!status ? 'Sem ligação ao servidor.' : status >= 500 ? 'Erro do servidor ao eliminar ASC.' : 'Falha ao eliminar ASC.')
    } finally {
      setDeleteLoading(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / Math.max(1, pageSize)))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <PageSectionCard
        title="Filtros e contexto"
        subtitle="Pesquise por nome, restrinja por região e ajuste o tamanho da página."
        extra={(
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Button size="sm" variant="secondary" onClick={clearFilters}>Limpar filtros</Button>
            <Button size="sm" variant="secondary" onClick={() => { setShowCreate(true); setSubmitError(null) }}>Novo ASC</Button>
          </div>
        )}
      >
        <div style={filtersGridStyle}>
          <label style={stackedFieldStyle}>
            <span style={fieldLabelStyle}>Pesquisar por nome</span>
            <input value={filterName} onChange={(event) => setFilterName(event.target.value)} placeholder="Ex.: ASC Sul" style={inputStyle} />
          </label>

          <label style={stackedFieldStyle}>
            <span style={fieldLabelStyle}>Região</span>
            <select value={filterRegiaoId} onChange={(event) => setFilterRegiaoId(event.target.value)} style={inputStyle}>
              <option value="">Todas as regiões</option>
              {regioes.map((regiao) => (
                <option key={regiao.id} value={regiao.id}>{regiao.name || regiao.id}</option>
              ))}
            </select>
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
          {filterRegiaoId ? <SummaryChip>Região: {resolveRegiao(filterRegiaoId)}</SummaryChip> : null}
        </div>

        {ui.error ? <div style={{ ...noticeBannerStyle, marginTop: 16 }}>{ui.error}</div> : null}
      </PageSectionCard>

      <PageSectionCard title="Lista de ASCs" subtitle="A tabela mostra a relação com a região e disponibiliza ações rápidas.">
        <div style={tableWrapStyle}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <SortableHeader label="Nome" active={orderBy === 'name'} direction={orderDirection} onClick={() => toggleSort('name')} />
                <SortableHeader label="Regiao" />
                <SortableHeader label="Acoes" align="center" />
              </tr>
            </thead>
            <tbody>
              {ui.loading ? (
                <tr><td colSpan={3} style={emptyTableCellStyle}>A carregar...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={3} style={emptyTableCellStyle}>Sem ASCs para mostrar.</td></tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id}>
                    <td style={bodyCellStyle}><strong style={{ color: '#1f2937' }}>{item.name || '-'}</strong></td>
                    <td style={bodyCellStyle}>{resolveRegiao(item.regiao_id)}</td>
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
          title={showCreate ? 'Novo ASC' : 'Editar ASC'}
          description="Associe o ASC a uma região para manter a estrutura operacional consistente."
          error={submitError}
          maxWidth={560}
          onClose={() => {
            if (submitting) return
            setShowCreate(false)
            setEditing(null)
            setSubmitError(null)
          }}
        >
          <AscForm
            defaultValue={{ name: editing?.name ?? '', regiao_id: editing?.regiao_id ?? '' }}
            regioes={regioes}
            submitting={submitting}
            onCancel={() => { setShowCreate(false); setEditing(null); setSubmitError(null) }}
            onSubmit={(input) => showCreate ? handleCreate(input) : (editing?.id ? handleUpdate(editing.id, input) : undefined)}
          />
        </ManagementModal>
      ) : null}

      {pendingDelete ? (
        <DeleteConfirmModal
          title="Eliminar ASC"
          description="Está prestes a remover o ASC"
          itemLabel={`"${pendingDelete.name || 'Sem nome'}".`}
          loading={deleteLoading}
          error={deleteError}
          confirmLabel="Eliminar ASC"
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

function AscForm({
  defaultValue,
  regioes,
  submitting,
  onSubmit,
  onCancel,
}: {
  defaultValue?: { name: string; regiao_id: string }
  regioes: { id?: string; name?: string }[]
  submitting?: boolean
  onSubmit: (input: { name: string; regiao_id: string }) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(defaultValue?.name ?? '')
  const [regiaoId, setRegiaoId] = useState(defaultValue?.regiao_id ?? '')

  return (
    <form onSubmit={(event) => { event.preventDefault(); if (!name.trim() || !regiaoId.trim()) return; onSubmit({ name: name.trim(), regiao_id: regiaoId.trim() }) }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <label style={stackedFieldStyle}>
        <span style={fieldLabelStyle}>Nome</span>
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nome do ASC" style={inputStyle} />
      </label>

      <label style={stackedFieldStyle}>
        <span style={fieldLabelStyle}>Região</span>
        <select value={regiaoId} onChange={(event) => setRegiaoId(event.target.value)} style={inputStyle} required>
          <option value="">Selecionar região</option>
          {regioes.map((regiao) => (
            <option key={regiao.id} value={regiao.id}>{regiao.name || regiao.id}</option>
          ))}
        </select>
      </label>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>Cancelar</Button>
        <Button type="submit" disabled={submitting}>{submitting ? 'A guardar...' : 'Guardar ASC'}</Button>
      </div>
    </form>
  )
}
