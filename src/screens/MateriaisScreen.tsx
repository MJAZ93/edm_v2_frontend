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
import { MaterialApi, SectorInfracaoApi, type MaterialCreateMaterialRequest, type MaterialUpdateMaterialRequest, type ModelSectorInfracao } from '../services'
import { useAuth } from '../contexts/AuthContext'

type Material = { id?: string; name?: string; unidade?: string; sector_infracao_id?: string }
type UiState = { loading: boolean; error: string | null }

export default function MateriaisScreen() {
  const { getApiConfig, getAuthorizationHeaderValue, logout } = useAuth()
  const api = useMemo(() => new MaterialApi(getApiConfig()), [getApiConfig])
  const sectorApi = useMemo(() => new SectorInfracaoApi(getApiConfig()), [getApiConfig])
  const authHeader = useMemo(() => getAuthorizationHeaderValue(), [getAuthorizationHeaderValue])

  const [items, setItems] = useState<Material[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [ui, setUi] = useState<UiState>({ loading: false, error: null })

  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<Material | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Material | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [sectors, setSectors] = useState<ModelSectorInfracao[]>([])
  const [filterName, setFilterName] = useState('')
  const [filterSectorId, setFilterSectorId] = useState('')
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
      const { data } = await api.privateMateriaisGet(authHeader, page, pageSize, orderBy, orderDirection, undefined, filterSectorId || undefined, filterName || undefined)
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
      const msg = !status ? 'Sem ligação ao servidor.' : status >= 500 ? 'Erro do servidor ao carregar materiais.' : 'Falha a obter materiais.'
      setUi({ loading: false, error: msg })
      return
    }
    setUi({ loading: false, error: null })
  }, [api, authHeader, page, pageSize, orderBy, orderDirection, filterSectorId, filterName, logout])

  const loadSectors = useCallback(async () => {
    try {
      const { data } = await sectorApi.privateSectorInfracaoGet(authHeader, 1, 100, 'name', 'asc')
      if (isUnauthorizedBody(data)) {
        logout('Sessão expirada. Inicie sessão novamente.')
        return
      }
      setSectors(data.items ?? [])
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 401 || isUnauthorizedBody(err?.response?.data)) {
        logout('Sessão expirada. Inicie sessão novamente.')
      }
    }
  }, [sectorApi, authHeader, logout])

  useEffect(() => { load() }, [load])
  useEffect(() => { loadSectors() }, [loadSectors])
  useEffect(() => { setPage(1) }, [filterName, filterSectorId, pageSize, orderBy, orderDirection])

  function toggleSort(key: 'name' | 'created_at') {
    if (orderBy === key) setOrderDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
    else {
      setOrderBy(key)
      setOrderDirection('asc')
    }
  }

  function clearFilters() {
    setFilterName('')
    setFilterSectorId('')
    setOrderBy('created_at')
    setOrderDirection('desc')
    setPage(1)
  }

  function resolveSector(id?: string) {
    return sectors.find((sector) => sector.id === id)?.name || id || '-'
  }

  async function handleCreate(input: Material) {
    setSubmitting(true)
    setSubmitError(null)
    try {
      const payload: MaterialCreateMaterialRequest = { name: input.name, unidade: input.unidade, sector_infracao_id: input.sector_infracao_id }
      const { data } = await api.privateMateriaisPost(authHeader, payload)
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
      setSubmitError(status === 400 ? 'Dados inválidos.' : !status ? 'Sem ligação ao servidor.' : 'Falha ao criar material.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleUpdate(id: string, input: Material) {
    setSubmitting(true)
    setSubmitError(null)
    try {
      const payload: MaterialUpdateMaterialRequest = { name: input.name, unidade: input.unidade, sector_infracao_id: input.sector_infracao_id }
      const { data } = await api.privateMateriaisIdPut(id, authHeader, payload)
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
      setSubmitError(status === 400 ? 'Dados inválidos.' : !status ? 'Sem ligação ao servidor.' : 'Falha ao atualizar material.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id?: string) {
    if (!id) return
    setDeleteLoading(true)
    setDeleteError(null)
    try {
      const res = await api.privateMateriaisIdDelete(id, authHeader)
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
      setDeleteError(!status ? 'Sem ligação ao servidor.' : status >= 500 ? 'Erro do servidor ao eliminar material.' : 'Falha ao eliminar material.')
    } finally {
      setDeleteLoading(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / Math.max(1, pageSize)))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <PageSectionCard
        title="Filtros e contexto"
        subtitle="Pesquise materiais, filtre por setor e ajuste a página conforme o volume de dados."
        extra={(
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Button size="sm" variant="secondary" onClick={clearFilters}>Limpar filtros</Button>
            <Button size="sm" variant="secondary" onClick={() => { setShowCreate(true); setSubmitError(null) }}>Novo material</Button>
          </div>
        )}
      >
        <div style={filtersGridStyle}>
          <label style={stackedFieldStyle}>
            <span style={fieldLabelStyle}>Pesquisar por nome</span>
            <input value={filterName} onChange={(event) => setFilterName(event.target.value)} placeholder="Ex.: Cabo" style={inputStyle} />
          </label>

          <label style={stackedFieldStyle}>
            <span style={fieldLabelStyle}>Setor</span>
            <select value={filterSectorId} onChange={(event) => setFilterSectorId(event.target.value)} style={inputStyle}>
              <option value="">Todos os setores</option>
              {sectors.map((sector) => (
                <option key={sector.id} value={sector.id}>{sector.name || sector.id}</option>
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
          {filterSectorId ? <SummaryChip>Setor: {resolveSector(filterSectorId)}</SummaryChip> : null}
        </div>

        {ui.error ? <div style={{ ...noticeBannerStyle, marginTop: 16 }}>{ui.error}</div> : null}
      </PageSectionCard>

      <PageSectionCard title="Lista de materiais" subtitle="Veja rapidamente nome, unidade, setor associado e ações disponíveis.">
        <div style={tableWrapStyle}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <SortableHeader label="Nome" active={orderBy === 'name'} direction={orderDirection} onClick={() => toggleSort('name')} />
                <SortableHeader label="Unidade" />
                <SortableHeader label="Setor" />
                <SortableHeader label="Acoes" align="center" />
              </tr>
            </thead>
            <tbody>
              {ui.loading ? (
                <tr><td colSpan={4} style={emptyTableCellStyle}>A carregar...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={4} style={emptyTableCellStyle}>Sem materiais para mostrar.</td></tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id}>
                    <td style={bodyCellStyle}><strong style={{ color: '#1f2937' }}>{item.name || '-'}</strong></td>
                    <td style={bodyCellStyle}>{item.unidade || '-'}</td>
                    <td style={bodyCellStyle}>{resolveSector(item.sector_infracao_id)}</td>
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
          title={showCreate ? 'Novo material' : 'Editar material'}
          description="Preencha os dados principais e associe o material ao setor correto."
          error={submitError}
          maxWidth={580}
          onClose={() => {
            if (submitting) return
            setShowCreate(false)
            setEditing(null)
            setSubmitError(null)
          }}
        >
          <MaterialForm
            defaultValue={{ name: editing?.name ?? '', unidade: editing?.unidade ?? '', sector_infracao_id: editing?.sector_infracao_id ?? '' }}
            sectors={sectors}
            submitting={submitting}
            onCancel={() => { setShowCreate(false); setEditing(null); setSubmitError(null) }}
            onSubmit={(input) => showCreate ? handleCreate(input) : (editing?.id ? handleUpdate(editing.id, input) : undefined)}
          />
        </ManagementModal>
      ) : null}

      {pendingDelete ? (
        <DeleteConfirmModal
          title="Eliminar material"
          description="Está prestes a remover o material"
          itemLabel={`"${pendingDelete.name || 'Sem nome'}".`}
          loading={deleteLoading}
          error={deleteError}
          confirmLabel="Eliminar material"
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

function MaterialForm({
  defaultValue,
  sectors,
  submitting,
  onSubmit,
  onCancel,
}: {
  defaultValue?: Material
  sectors: { id?: string; name?: string }[]
  submitting?: boolean
  onSubmit: (input: Material) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(defaultValue?.name ?? '')
  const [unidade, setUnidade] = useState(defaultValue?.unidade ?? '')
  const [sectorId, setSectorId] = useState(defaultValue?.sector_infracao_id ?? '')

  return (
    <form onSubmit={(event) => { event.preventDefault(); if (!name.trim()) return; onSubmit({ name: name.trim(), unidade: unidade.trim() || undefined, sector_infracao_id: sectorId || undefined }) }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <label style={stackedFieldStyle}>
        <span style={fieldLabelStyle}>Nome</span>
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nome do material" style={inputStyle} />
      </label>

      <label style={stackedFieldStyle}>
        <span style={fieldLabelStyle}>Unidade</span>
        <input value={unidade} onChange={(event) => setUnidade(event.target.value)} placeholder="Ex.: kg, m, unid" style={inputStyle} />
      </label>

      <label style={stackedFieldStyle}>
        <span style={fieldLabelStyle}>Setor de infração</span>
        <select value={sectorId} onChange={(event) => setSectorId(event.target.value)} style={inputStyle} required>
          <option value="">Selecionar setor</option>
          {sectors.map((sector) => (
            <option key={sector.id} value={sector.id}>{sector.name || sector.id}</option>
          ))}
        </select>
      </label>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>Cancelar</Button>
        <Button type="submit" disabled={submitting}>{submitting ? 'A guardar...' : 'Guardar material'}</Button>
      </div>
    </form>
  )
}
