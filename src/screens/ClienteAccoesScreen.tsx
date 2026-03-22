import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Card, Pagination } from '../components'
import { useAuth } from '../contexts/AuthContext'
import {
  InstalacaoAccoesApi,
  InstalacaoAccaoTipoApi,
  type ModelInstalacaoAccoes,
  type ModelInstalacaoAccaoTipo,
  type InstalacaoAccoesCreateInstalacaoAccoesRequest,
  type InstalacaoAccoesUpdateInstalacaoAccoesRequest,
} from '../services'

type UiState = { loading: boolean; error: string | null }

export default function ClienteAccoesScreen() {
  const { getApiConfig, getAuthorizationHeaderValue, logout } = useAuth()
  const api = useMemo(() => new InstalacaoAccoesApi(getApiConfig()), [getApiConfig])
  const tipoApi = useMemo(() => new InstalacaoAccaoTipoApi(getApiConfig()), [getApiConfig])
  const authHeader = useMemo(() => getAuthorizationHeaderValue(), [getAuthorizationHeaderValue])

  const [items, setItems] = useState<ModelInstalacaoAccoes[]>([])
  const [tipos, setTipos] = useState<ModelInstalacaoAccaoTipo[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [ui, setUi] = useState<UiState>({ loading: false, error: null })

  const [orderBy, setOrderBy] = useState<'created_at' | 'data_execucao' | 'valor_recuperado'>('created_at')
  const [orderDirection, setOrderDirection] = useState<'asc' | 'desc'>('desc')

  const [pf, setPf] = useState<string>(() => new URLSearchParams(window.location.search).get('pf') || '')
  const [accaoTipoId, setAccaoTipoId] = useState('')
  const [marcacaoStatus, setMarcacaoStatus] = useState('')
  const [analiseStatus, setAnaliseStatus] = useState('')
  const [tendencia, setTendencia] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const [showCreate, setShowCreate] = useState(() => new URLSearchParams(window.location.search).get('novo') === '1')
  const [editing, setEditing] = useState<ModelInstalacaoAccoes | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<ModelInstalacaoAccoes | null>(null)
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
      const { data } = await api.privateInstalacaoAccoesGet(
        authHeader,
        page,
        pageSize,
        orderBy,
        orderDirection,
        pf || undefined,
        accaoTipoId || undefined,
        marcacaoStatus || undefined,
        analiseStatus || undefined,
        tendencia || undefined,
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
        error: !status ? 'Sem ligação ao servidor.' : status >= 500 ? 'Erro do servidor ao carregar ações de cliente.' : 'Falha ao obter ações de cliente.',
      })
      return
    }
    setUi({ loading: false, error: null })
  }, [accaoTipoId, analiseStatus, api, authHeader, logout, marcacaoStatus, orderBy, orderDirection, page, pageSize, pf, tendencia])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    ;(async () => {
      try {
        const { data } = await tipoApi.privateInstalacaoAccaoTiposGet(authHeader, -1, undefined, 'nome', 'asc')
        if (isUnauthorizedBody(data)) {
          logout('Sessão expirada. Inicie sessão novamente.')
          return
        }
        setTipos(((data as any)?.items) ?? [])
      } catch {}
    })()
  }, [authHeader, logout, tipoApi])
  useEffect(() => { setPage(1) }, [pageSize, orderBy, orderDirection, pf, accaoTipoId, marcacaoStatus, analiseStatus, tendencia])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const activeFilterCount = [pf.trim(), accaoTipoId, marcacaoStatus, analiseStatus, tendencia].filter(Boolean).length

  function toggleSort(key: 'created_at' | 'data_execucao' | 'valor_recuperado') {
    if (orderBy === key) setOrderDirection((direction) => (direction === 'asc' ? 'desc' : 'asc'))
    else {
      setOrderBy(key)
      setOrderDirection('asc')
    }
  }

  function clearFilters() {
    setPf('')
    setAccaoTipoId('')
    setMarcacaoStatus('')
    setAnaliseStatus('')
    setTendencia('')
    setOrderBy('created_at')
    setOrderDirection('desc')
    setPage(1)
  }

  function openDetails(id?: string) {
    if (!id) return
    window.history.pushState({}, '', `/instalacoes/accoes/${id}`)
    window.dispatchEvent(new Event('locationchange'))
  }

  async function handleCreate(input: InstalacaoAccoesCreateInstalacaoAccoesRequest) {
    setSubmitting(true)
    setSubmitError(null)
    try {
      const { data } = await api.privateInstalacaoAccoesPost(authHeader, input)
      if (isUnauthorizedBody(data)) {
        logout('Sessão expirada. Inicie sessão novamente.')
        return
      }
      setShowCreate(false)
      const params = new URLSearchParams(window.location.search)
      params.delete('novo')
      window.history.replaceState({}, '', `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`)
      await load()
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 401 || isUnauthorizedBody(err?.response?.data)) {
        logout('Sessão expirada. Inicie sessão novamente.')
        return
      }
      setSubmitError(status === 400 ? 'Dados inválidos.' : !status ? 'Sem ligação ao servidor.' : 'Falha ao criar ação.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleUpdate(id: string, input: InstalacaoAccoesUpdateInstalacaoAccoesRequest) {
    setSubmitting(true)
    setSubmitError(null)
    try {
      const { data } = await api.privateInstalacaoAccoesIdPut(id, authHeader, input)
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
      setSubmitError(status === 400 ? 'Dados inválidos.' : !status ? 'Sem ligação ao servidor.' : 'Falha ao atualizar ação.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id?: string) {
    if (!id) return
    setDeleteLoading(true)
    setDeleteError(null)
    try {
      await api.privateInstalacaoAccoesIdDelete(id, authHeader)
      setPendingDelete(null)
      await load()
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 401 || isUnauthorizedBody(err?.response?.data)) {
        logout('Sessão expirada. Inicie sessão novamente.')
        return
      }
      setDeleteError(!status ? 'Sem ligação ao servidor.' : status >= 500 ? 'Erro do servidor ao eliminar a ação.' : 'Não foi possível eliminar a ação.')
    } finally {
      setDeleteLoading(false)
    }
  }

  async function handleExecuteMonthly() {
    try {
      const { data } = await api.privateInstalacaoAccoesExecuteMonthlyAnalisysPost(authHeader)
      const updated = ((data as any)?.updated_ids || []).length
      alert(`Análise mensal iniciada. Atualizados: ${updated}. Processados: ${(data as any)?.processed ?? 0}. Concluídos: ${(data as any)?.completed ?? 0}.`)
    } catch {
      alert('Falha ao executar a análise mensal.')
    }
  }

  const currentFormDefaults = editing ? {
    pf: editing.pf || '',
    data_execucao: normalizeDateInput(editing.data_execucao) || new Date().toISOString().slice(0, 10),
    accao_tipo_id: (editing as any).accao_tipo_id || (editing as any).accao_tipo?.id || '',
    marcacao_status: editing.marcacao_status || 'MARCADO',
    analise_status: editing.analise_status || 'EM_ANALISE',
    tendencia_compras: editing.tendencia_compras || '',
    valor_recuperado: editing.valor_recuperado ?? '',
    comentario: editing.comentario || '',
  } : {
    pf: pf || '',
    data_execucao: new Date().toISOString().slice(0, 10),
    accao_tipo_id: '',
    marcacao_status: 'MARCADO',
    analise_status: 'EM_ANALISE',
    tendencia_compras: '',
    valor_recuperado: '',
    comentario: '',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card
        title="Filtros"
        subtitle="Refine as ações por cliente, tipo, tendência e estado operacional."
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
              <span style={fieldLabelStyle}>PF</span>
              <input value={pf} onChange={(e) => setPf(e.target.value)} placeholder="Número de PF" style={fieldControlStyle} />
            </label>

            <label style={fieldGroupStyle}>
              <span style={fieldLabelStyle}>Tipo de ação</span>
              <select value={accaoTipoId} onChange={(e) => setAccaoTipoId(e.target.value)} style={fieldControlStyle}>
                <option value="">Todos os tipos</option>
                {tipos.map((tipo) => (
                  <option key={tipo.id} value={tipo.id}>{tipo.nome}</option>
                ))}
              </select>
            </label>

            <label style={fieldGroupStyle}>
              <span style={fieldLabelStyle}>Marcação</span>
              <select value={marcacaoStatus} onChange={(e) => setMarcacaoStatus(e.target.value)} style={fieldControlStyle}>
                <option value="">Todos os estados</option>
                <option value="EXECUTADO">Executado</option>
                <option value="MARCADO">Marcado</option>
              </select>
            </label>

            <label style={fieldGroupStyle}>
              <span style={fieldLabelStyle}>Análise</span>
              <select value={analiseStatus} onChange={(e) => setAnaliseStatus(e.target.value)} style={fieldControlStyle}>
                <option value="">Todos os estados</option>
                <option value="EM_ANALISE">Em análise</option>
                <option value="ANALISADO">Analisado</option>
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
          </div>
        ) : (
          <div style={collapsedFiltersHintStyle}>
            <span>Filtros recolhidos para dar mais foco aos resultados.</span>
            <span>{activeFilterCount > 0 ? `${activeFilterCount} filtro(s) ativo(s)` : 'Sem filtros ativos'}</span>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
          <span style={summaryChipStyle}>Resultados: {total.toLocaleString('pt-PT')}</span>
          <span style={summaryChipStyle}>Página: {page}/{totalPages}</span>
          {pf ? <span style={summaryChipStyle}>PF: {pf}</span> : null}
          {tendencia ? <span style={summaryChipStyle}>Tendência: {formatTendencia(tendencia)}</span> : null}
        </div>

        {ui.error ? <div style={errorBannerStyle}>{ui.error}</div> : null}
      </Card>

      <Card
        title="Resultados"
        subtitle="Lista paginada e ordenável com contexto do cliente e da execução."
        extra={(
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" onClick={() => setShowCreate(true)} style={primaryHeaderButtonStyle}>
              Nova ação
            </button>
            <button type="button" onClick={handleExecuteMonthly} style={filterHeaderButtonStyle}>
              Executar análise mensal
            </button>
          </div>
        )}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <Th label="Criado em" active={orderBy === 'created_at'} direction={orderDirection} onClick={() => toggleSort('created_at')} />
                <Th label="Execução" active={orderBy === 'data_execucao'} direction={orderDirection} onClick={() => toggleSort('data_execucao')} />
                <Th label="Cliente" />
                <Th label="Tipo" />
                <Th label="Estado" />
                <Th label="Valor recuperado" active={orderBy === 'valor_recuperado'} direction={orderDirection} onClick={() => toggleSort('valor_recuperado')} />
                <th style={actionHeaderCellStyle}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {ui.loading ? (
                <tr><td colSpan={7} style={emptyTableCellStyle}>A carregar ações…</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={7} style={emptyTableCellStyle}>Sem ações de cliente para mostrar.</td></tr>
              ) : (
                items.map((item, index) => (
                  <tr key={`cliente-acao-${item.id ?? 'sem-id'}-${item.created_at ?? index}`}>
                    <td style={bodyCellStyle}>
                      <span style={dateBadgeStyle}>{formatDateTime(item.created_at)}</span>
                    </td>
                    <td style={bodyCellStyle}>
                      <span style={dateBadgeStyle}>{formatDateTime(item.data_execucao)}</span>
                    </td>
                    <td style={bodyCellStyle}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 180 }}>
                        <strong style={{ color: '#1f2937' }}>{item.pf || 'PF não indicada'}</strong>
                        <span style={metaTextStyle}>Meses de análise: {item.meses_analise != null ? String(item.meses_analise) : '—'}</span>
                      </div>
                    </td>
                    <td style={bodyCellStyle}>
                      <strong style={{ color: '#1f2937' }}>{(item as any).accao_tipo?.nome || (item as any).accao_tipo_id || 'Tipo por identificar'}</strong>
                    </td>
                    <td style={bodyCellStyle}>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', minWidth: 190 }}>
                        <span style={statusBadgeStyle('marcacao', item.marcacao_status)}>{item.marcacao_status || '—'}</span>
                        <span style={statusBadgeStyle('analise', item.analise_status)}>{item.analise_status || '—'}</span>
                      </div>
                    </td>
                    <td style={bodyCellStyle}>
                      <span style={valueBadgeStyle}>{formatMoney(item.valor_recuperado)}</span>
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
          title={showCreate ? 'Nova ação de cliente' : 'Editar ação de cliente'}
          error={submitError}
          onClose={() => {
            if (submitting) return
            setShowCreate(false)
            setEditing(null)
            setSubmitError(null)
          }}
        >
          <AccaoForm
            tipos={tipos}
            defaultValues={currentFormDefaults}
            submitting={submitting}
            mode={showCreate ? 'create' : 'edit'}
            onCancel={() => {
              if (submitting) return
              setShowCreate(false)
              setEditing(null)
              setSubmitError(null)
            }}
            onSubmit={(vals) => (
              editing?.id
                ? handleUpdate(editing.id, vals as InstalacaoAccoesUpdateInstalacaoAccoesRequest)
                : handleCreate(vals as InstalacaoAccoesCreateInstalacaoAccoesRequest)
            )}
          />
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
          onConfirm={() => handleDelete(pendingDelete.id)}
        />
      ) : null}
    </div>
  )
}

function AccaoForm({
  tipos,
  defaultValues,
  submitting,
  onSubmit,
  onCancel,
  mode,
}: {
  tipos: ModelInstalacaoAccaoTipo[]
  defaultValues?: any
  submitting?: boolean
  onSubmit: (vals: InstalacaoAccoesCreateInstalacaoAccoesRequest | InstalacaoAccoesUpdateInstalacaoAccoesRequest) => void
  onCancel: () => void
  mode: 'create' | 'edit'
}) {
  const [vals, setVals] = useState<any>(defaultValues || {})

  useEffect(() => {
    setVals(defaultValues || {})
  }, [defaultValues])

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        if (!vals?.pf || !vals?.data_execucao || !vals?.accao_tipo_id) return
        onSubmit({
          ...vals,
          valor_recuperado: vals.valor_recuperado === '' || vals.valor_recuperado == null ? undefined : Number(vals.valor_recuperado),
        })
      }}
      style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
    >
      <div style={modalFormGridStyle}>
        <label style={fieldGroupStyle}>
          <span style={fieldLabelStyle}>PF</span>
          <input value={vals.pf || ''} onChange={(e) => setVals((current: any) => ({ ...current, pf: e.target.value }))} style={fieldControlStyle} />
        </label>

        <label style={fieldGroupStyle}>
          <span style={fieldLabelStyle}>Data de execução</span>
          <input type="date" value={vals.data_execucao || ''} onChange={(e) => setVals((current: any) => ({ ...current, data_execucao: e.target.value }))} style={fieldControlStyle} />
        </label>

        <label style={fieldGroupStyle}>
          <span style={fieldLabelStyle}>Tipo de ação</span>
          <select value={vals.accao_tipo_id || ''} onChange={(e) => setVals((current: any) => ({ ...current, accao_tipo_id: e.target.value }))} style={fieldControlStyle}>
            <option value="">Selecione…</option>
            {tipos.map((tipo) => (
              <option key={tipo.id} value={tipo.id}>{tipo.nome}</option>
            ))}
          </select>
        </label>

        <label style={fieldGroupStyle}>
          <span style={fieldLabelStyle}>Marcação</span>
          <select value={vals.marcacao_status || 'MARCADO'} onChange={(e) => setVals((current: any) => ({ ...current, marcacao_status: e.target.value }))} style={fieldControlStyle}>
            <option value="EXECUTADO">Executado</option>
            <option value="MARCADO">Marcado</option>
          </select>
        </label>

        {mode === 'edit' ? (
          <>
            <label style={fieldGroupStyle}>
              <span style={fieldLabelStyle}>Análise</span>
              <select value={vals.analise_status || 'EM_ANALISE'} onChange={(e) => setVals((current: any) => ({ ...current, analise_status: e.target.value }))} style={fieldControlStyle}>
                <option value="EM_ANALISE">Em análise</option>
                <option value="ANALISADO">Analisado</option>
              </select>
            </label>

            <label style={fieldGroupStyle}>
              <span style={fieldLabelStyle}>Tendência</span>
              <select value={vals.tendencia_compras || ''} onChange={(e) => setVals((current: any) => ({ ...current, tendencia_compras: e.target.value }))} style={fieldControlStyle}>
                <option value="">—</option>
                <option value="CRESCENTE">Crescente</option>
                <option value="MUITO_CRESCENTE">Muito crescente</option>
                <option value="NORMAL">Normal</option>
                <option value="DECRESCENTE">Decrescente</option>
                <option value="MUITO_DECRESCENTE">Muito decrescente</option>
                <option value="SEM_COMPRAS">Sem compras</option>
              </select>
            </label>

            <label style={fieldGroupStyle}>
              <span style={fieldLabelStyle}>Valor recuperado (MT)</span>
              <input type="number" step="0.01" value={vals.valor_recuperado ?? ''} onChange={(e) => setVals((current: any) => ({ ...current, valor_recuperado: e.target.value }))} style={fieldControlStyle} />
            </label>
          </>
        ) : null}
      </div>

      <label style={fieldGroupStyle}>
        <span style={fieldLabelStyle}>Comentário</span>
        <textarea value={vals.comentario || ''} onChange={(e) => setVals((current: any) => ({ ...current, comentario: e.target.value }))} rows={4} style={textAreaControlStyle} />
      </label>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
        <button type="button" onClick={onCancel} disabled={submitting} style={modalSecondaryButtonStyle}>Cancelar</button>
        <button type="submit" disabled={submitting} style={modalPrimaryButtonStyle}>{submitting ? 'A guardar…' : 'Guardar ação'}</button>
      </div>
    </form>
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
    <div style={modalBackdropStyle} role="dialog" aria-modal="true">
      <div style={{ ...modalCardStyle, width: 'min(100%, 760px)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={modalEyebrowStyle}>Ações de cliente</span>
          <h3 style={{ margin: 0, fontSize: 24, lineHeight: 1.1, color: '#1f2937' }}>{title}</h3>
        </div>
        {error ? <div style={modalErrorStyle}>{error}</div> : null}
        {children}
        <button type="button" aria-label="Fechar" onClick={onClose} style={modalCloseButtonStyle}>×</button>
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
  item: ModelInstalacaoAccoes
  loading: boolean
  error: string | null
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div style={modalBackdropStyle} role="dialog" aria-modal="true">
      <div style={modalCardStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={modalEyebrowStyle}>Confirmação</span>
          <h3 style={{ margin: 0, fontSize: 24, lineHeight: 1.1, color: '#1f2937' }}>Eliminar ação de cliente</h3>
          <p style={{ margin: 0, color: '#5f6673', lineHeight: 1.6 }}>
            Está prestes a eliminar a ação associada ao cliente <strong style={{ color: '#1f2937' }}>{item.pf || 'sem PF'}</strong>.
          </p>
        </div>
        {error ? <div style={modalErrorStyle}>{error}</div> : null}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Button variant="secondary" onClick={onCancel} disabled={loading}>Cancelar</Button>
          <Button variant="danger" onClick={onConfirm} disabled={loading}>{loading ? 'A eliminar…' : 'Eliminar ação'}</Button>
        </div>
      </div>
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
      style={{ ...actionIconButtonBaseStyle, ...(hovered ? actionIconButtonHoverStyle[variant] : null) }}
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

function formatTendencia(t?: any) {
  const raw = String(t || '')
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

function normalizeDateInput(value?: string) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

function trendBadgeStyle(trend?: any): React.CSSProperties {
  const raw = String(trend || '')
  if (raw === 'SEM_COMPRAS') return solidPillStyle('#fff7f6', '#b42318', 'rgba(180, 35, 24, 0.16)')
  if (raw === 'MUITO_DECRESCENTE') return solidPillStyle('#fff4e8', '#c96d1f', 'rgba(201, 109, 31, 0.18)')
  if (raw === 'DECRESCENTE') return solidPillStyle('#fff9e8', '#a16207', 'rgba(202, 138, 4, 0.18)')
  if (raw === 'MUITO_CRESCENTE') return solidPillStyle('#f2fcfa', '#0f766e', 'rgba(15, 118, 110, 0.16)')
  if (raw === 'CRESCENTE') return solidPillStyle('#f0fdf4', '#15803d', 'rgba(34, 197, 94, 0.18)')
  return solidPillStyle('#eff6ff', '#3056a6', 'rgba(48, 86, 166, 0.14)')
}

function statusBadgeStyle(kind: 'marcacao' | 'analise', value?: string): React.CSSProperties {
  const raw = String(value || '').toLowerCase()
  if (raw.includes('execut') || raw.includes('analisad')) return solidPillStyle('#f2fcfa', '#0f766e', 'rgba(15, 118, 110, 0.16)')
  if (raw.includes('marcad') || raw.includes('analise')) return solidPillStyle('#fff9e8', '#a16207', 'rgba(202, 138, 4, 0.18)')
  return kind === 'marcacao'
    ? solidPillStyle('#eff6ff', '#3056a6', 'rgba(48, 86, 166, 0.14)')
    : solidPillStyle('#f5f1ea', '#5f6673', 'rgba(101, 74, 32, 0.12)')
}

function solidPillStyle(background: string, color: string, borderColor: string): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: 30,
    padding: '0 10px',
    borderRadius: 999,
    background,
    border: `1px solid ${borderColor}`,
    color,
    fontSize: 12,
    fontWeight: 800,
    whiteSpace: 'nowrap',
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

const textAreaControlStyle: React.CSSProperties = {
  minHeight: 110,
  padding: '14px',
  borderRadius: 16,
  border: '1px solid rgba(101, 74, 32, 0.14)',
  background: '#fffdf9',
  color: '#1f2937',
  boxShadow: '0 10px 24px rgba(101, 74, 32, 0.05)',
  resize: 'vertical',
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
  zIndex: 80,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 24,
  background: 'rgba(24, 31, 42, 0.42)',
  backdropFilter: 'blur(8px)',
}

const modalCardStyle: React.CSSProperties = {
  position: 'relative',
  width: 'min(100%, 520px)',
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
  padding: 24,
  borderRadius: 24,
  background: 'linear-gradient(180deg, rgba(255, 252, 246, 0.98) 0%, rgba(250, 244, 234, 0.96) 100%)',
  border: '1px solid rgba(101, 74, 32, 0.14)',
  boxShadow: '0 28px 70px rgba(55, 34, 8, 0.18)',
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

const modalFormGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 14,
}

const modalCloseButtonStyle: React.CSSProperties = {
  position: 'absolute',
  top: 14,
  right: 14,
  width: 36,
  height: 36,
  borderRadius: 12,
  border: '1px solid rgba(101, 74, 32, 0.14)',
  background: '#fffdf8',
  color: '#5f6673',
  fontSize: 24,
  lineHeight: 1,
  cursor: 'pointer',
}

const modalSecondaryButtonStyle: React.CSSProperties = {
  minHeight: 46,
  padding: '0 16px',
  borderRadius: 14,
  border: '1px solid rgba(101, 74, 32, 0.16)',
  background: 'linear-gradient(180deg, #fffaf2 0%, #f6ecde 100%)',
  color: '#8d4a17',
  fontWeight: 700,
  boxShadow: '0 10px 24px rgba(76, 57, 24, 0.08)',
  cursor: 'pointer',
}

const modalPrimaryButtonStyle: React.CSSProperties = {
  minHeight: 46,
  padding: '0 16px',
  borderRadius: 14,
  border: '1px solid rgba(201, 109, 31, 0.20)',
  background: 'linear-gradient(180deg, #d77a28 0%, #b85d18 100%)',
  color: '#fffaf5',
  fontWeight: 800,
  boxShadow: '0 12px 24px rgba(201, 109, 31, 0.18)',
  cursor: 'pointer',
}
