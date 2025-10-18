import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Card, Heading, Text } from '../components'
import { useAuth } from '../contexts/AuthContext'
import {
  InstalacaoAccoesApi,
  InstalacaoAccaoTipoApi,
  type ModelInstalacaoAccoes,
  type ModelInstalacaoAccaoTipo,
  type InstalacaoAccoesCreateInstalacaoAccoesRequest,
  type InstalacaoAccoesUpdateInstalacaoAccoesRequest,
} from '../services'

export default function ClienteAccoesScreen() {
  const { getApiConfig, getAuthorizationHeaderValue, logout } = useAuth()
  const api = useMemo(() => new InstalacaoAccoesApi(getApiConfig()), [getApiConfig])
  const tipoApi = useMemo(() => new InstalacaoAccaoTipoApi(getApiConfig()), [getApiConfig])
  const authHeader = useMemo(() => getAuthorizationHeaderValue(), [getAuthorizationHeaderValue])

  const [items, setItems] = useState<ModelInstalacaoAccoes[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [ui, setUi] = useState<{ loading: boolean; error: string | null }>({ loading: false, error: null })

  const [orderBy, setOrderBy] = useState<'created_at' | 'data_execucao' | 'valor_recuperado'>('created_at')
  const [orderDirection, setOrderDirection] = useState<'asc' | 'desc'>('desc')

  const [pf, setPf] = useState<string>(() => new URLSearchParams(window.location.search).get('pf') || '')
  const [accaoTipoId, setAccaoTipoId] = useState('')
  const [marcacaoStatus, setMarcacaoStatus] = useState('')
  const [analiseStatus, setAnaliseStatus] = useState('')
  const [tendencia, setTendencia] = useState('')
  const [tipos, setTipos] = useState<ModelInstalacaoAccaoTipo[]>([])

  const [showCreate, setShowCreate] = useState(() => new URLSearchParams(window.location.search).get('novo') === '1')
  const [editing, setEditing] = useState<ModelInstalacaoAccoes | null>(null)
  const [viewing, setViewing] = useState<ModelInstalacaoAccoes | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const isUnauthorizedBody = (data: any) => {
    try {
      const raw = data?.code ?? data?.error?.code ?? data?.status ?? data?.error?.status ?? data?.error_code
      if (raw === undefined || raw === null) return false
      const num = Number(raw)
      if (!Number.isNaN(num) && num === 401) return true
      const code = String(raw).toUpperCase()
      return code === 'UNAUTHORIZED' || code === 'UNAUTHENTICATED'
    } catch { return false }
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
      if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      setItems(((data as any)?.items) ?? [])
      setTotal(Number((data as any)?.total ?? 0))
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 401 || isUnauthorizedBody(err?.response?.data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      setUi({ loading: false, error: !status ? 'Sem ligação ao servidor.' : status >= 500 ? 'Erro do servidor ao carregar ações de instalações.' : 'Falha a obter ações.' })
      return
    }
    setUi({ loading: false, error: null })
  }, [api, authHeader, page, pageSize, orderBy, orderDirection, pf, accaoTipoId, marcacaoStatus, analiseStatus, tendencia])

  useEffect(() => { load() }, [load])
  useEffect(() => { (async () => { try { const { data } = await tipoApi.privateInstalacaoAccaoTiposGet(authHeader, -1, undefined, 'nome', 'asc'); if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return } setTipos(((data as any)?.items) ?? []) } catch {} })() }, [tipoApi, authHeader])
  useEffect(() => { setPage(1) }, [pageSize, orderBy, orderDirection, pf, accaoTipoId, marcacaoStatus, analiseStatus, tendencia])

  function toggleSort(key: 'created_at' | 'data_execucao' | 'valor_recuperado') {
    if (orderBy === key) setOrderDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setOrderBy(key); setOrderDirection('asc') }
  }

  async function handleCreate(input: InstalacaoAccoesCreateInstalacaoAccoesRequest) {
    setSubmitting(true); setSubmitError(null)
    try {
      const { data } = await api.privateInstalacaoAccoesPost(authHeader, input)
      if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      setShowCreate(false)
      // clear novo flag
      const sp = new URLSearchParams(window.location.search); if (sp.get('novo')) { sp.delete('novo'); window.history.replaceState({}, '', `${window.location.pathname}?${sp.toString()}`) }
      await load()
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 401 || isUnauthorizedBody(err?.response?.data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      setSubmitError(status === 400 ? 'Dados inválidos.' : !status ? 'Sem ligação ao servidor.' : 'Falha ao criar ação.')
    } finally { setSubmitting(false) }
  }

  async function handleUpdate(id: string, input: InstalacaoAccoesUpdateInstalacaoAccoesRequest) {
    setSubmitting(true); setSubmitError(null)
    try {
      const { data } = await api.privateInstalacaoAccoesIdPut(id, authHeader, input)
      if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      setEditing(null)
      await load()
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 401 || isUnauthorizedBody(err?.response?.data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      setSubmitError(status === 400 ? 'Dados inválidos.' : !status ? 'Sem ligação ao servidor.' : 'Falha ao atualizar ação.')
    } finally { setSubmitting(false) }
  }

  async function handleDelete(id?: string) {
    if (!id) return
    if (!confirm('Eliminar ação da instalação?')) return
    try { await api.privateInstalacaoAccoesIdDelete(id, authHeader); await load() } catch { alert('Não foi possível eliminar.') }
  }

  async function handleExecuteMonthly() {
    try {
      const { data } = await api.privateInstalacaoAccoesExecuteMonthlyAnalisysPost(authHeader)
      alert(`Análise mensal iniciada. Atualizados: ${((data as any)?.updated_ids || []).length}. Processados: ${(data as any)?.processed ?? 0}. Concluídos: ${(data as any)?.completed ?? 0}.`)
    } catch { alert('Falha ao executar a análise mensal.') }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Heading level={2}>Ações (Clientes)</Heading>

      <Card title="Filtros">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <input value={pf} onChange={(e) => setPf(e.target.value)} placeholder="PF" style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid #d1d5db', width: 160 }} />
          <select value={accaoTipoId} onChange={(e) => setAccaoTipoId(e.target.value)} style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid #d1d5db' }}>
            <option value="">Tipo de ação</option>
            {tipos.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
          </select>
          <select value={marcacaoStatus} onChange={(e) => setMarcacaoStatus(e.target.value)} style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid #d1d5db' }}>
            <option value="">Marcação</option>
            <option value="EXECUTADO">Executado</option>
            <option value="MARCADO">Marcado</option>
          </select>
          <select value={analiseStatus} onChange={(e) => setAnaliseStatus(e.target.value)} style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid #d1d5db' }}>
            <option value="">Análise</option>
            <option value="EM_ANALISE">Em análise</option>
            <option value="ANALISADO">Analisado</option>
          </select>
          <select value={tendencia} onChange={(e) => setTendencia(e.target.value)} style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid #d1d5db' }}>
            <option value="">Tendência</option>
            <option value="CRESCENTE">Crescente</option>
            <option value="MUITO_CRESCENTE">Muito crescente</option>
            <option value="NORMAL">Normal</option>
            <option value="DECRESCENTE">Decrescente</option>
            <option value="MUITO_DECRESCENTE">Muito decrescente</option>
            <option value="SEM_COMPRAS">Sem compras</option>
          </select>
          <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid #d1d5db' }}>
            <option value={10}>10 por página</option>
            <option value={20}>20 por página</option>
            <option value={50}>50 por página</option>
          </select>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <Button onClick={() => setShowCreate(true)}>Nova ação</Button>
            <Button variant="secondary" onClick={() => { setPf(''); setAccaoTipoId(''); setMarcacaoStatus(''); setAnaliseStatus(''); setTendencia(''); setOrderBy('created_at'); setOrderDirection('desc'); setPage(1) }}>Limpar</Button>
            <Button variant="secondary" onClick={handleExecuteMonthly}>Executar análise mensal</Button>
          </div>
        </div>
        {ui.error ? <div style={{ background: '#fee2e2', color: '#991b1b', padding: 10, borderRadius: 8, marginTop: 10 }}>{ui.error}</div> : null}
      </Card>

      <Card>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <Th label="Criado em" active={orderBy === 'created_at'} direction={orderDirection} onClick={() => toggleSort('created_at')} />
                <Th label="Execução" active={orderBy === 'data_execucao'} direction={orderDirection} onClick={() => toggleSort('data_execucao')} />
                <Th label="PF" />
                <Th label="Tipo" />
                <Th label="Marcação" />
                <Th label="Análise" />
                <Th label="Tendência" />
                <Th label="Valor recuperado" active={orderBy === 'valor_recuperado'} direction={orderDirection} onClick={() => toggleSort('valor_recuperado')} />
                <th style={{ textAlign: 'left', padding: '10px 8px', borderBottom: '1px solid #e5e7eb' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {ui.loading ? (
                <tr><td colSpan={9} style={{ padding: 16, color: '#6b7280' }}>A carregar…</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={9} style={{ padding: 16, color: '#6b7280' }}>Sem ações para mostrar.</td></tr>
              ) : (
                items.map((it) => (
                  <tr key={it.id}>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6' }}>{formatDate(it.created_at)}</td>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6' }}>{formatDate(it.data_execucao)}</td>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6' }}>{it.pf || '-'}</td>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6' }}>{(it as any).accao_tipo?.nome || (it as any).accao_tipo_id || '-'}</td>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6' }}>{it.marcacao_status || '-'}</td>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6' }}>{it.analise_status || '-'}</td>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6' }}>{formatTendencia(it.tendencia_compras)}</td>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6' }}>{formatMoney(it.valor_recuperado)}</td>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6', display: 'flex', gap: 8 }}>
                      <Button
                        variant="secondary"
                        onClick={() => { if (it.id) { window.history.pushState({}, '', `/instalacoes/accoes/${it.id}`); window.dispatchEvent(new Event('locationchange')) } }}
                      >
                        Ver detalhes
                      </Button>
                      <Button variant="secondary" onClick={() => setEditing(it)}>Editar</Button>
                      <Button variant="danger" onClick={() => handleDelete(it.id)}>Eliminar</Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, color: '#6b7280' }}>
          <Text>Página {page} de {totalPages} · Total {total}</Text>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Anterior</Button>
            <Button variant="secondary" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Seguinte</Button>
          </div>
        </div>
      </Card>

      {(showCreate || editing) && (
        <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => { if (submitting) return; setShowCreate(false); setEditing(null); setSubmitError(null) }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 12, padding: 20, width: '100%', maxWidth: 520 }}>
            <h3 style={{ marginTop: 0 }}>{showCreate ? 'Nova ação' : 'Editar ação'}</h3>
            {submitError ? <div style={{ background: '#fee2e2', color: '#991b1b', padding: 10, borderRadius: 8 }}>{submitError}</div> : null}
            <AccaoForm
              tipos={tipos}
              defaultValues={editing ? {
                pf: editing.pf || pf || '',
                data_execucao: editing.data_execucao || '',
                accao_tipo_id: (editing as any).accao_tipo_id || (editing as any).accao_tipo?.id || '',
                marcacao_status: editing.marcacao_status || 'MARCADO',
                analise_status: editing.analise_status || 'EM_ANALISE',
                tendencia_compras: editing.tendencia_compras as any,
                valor_recuperado: editing.valor_recuperado,
                comentario: editing.comentario,
              } : {
                pf: pf || '', data_execucao: new Date().toISOString().slice(0,10), accao_tipo_id: '', marcacao_status: 'MARCADO', analise_status: 'EM_ANALISE'
              }}
              mode={showCreate ? 'create' : 'edit'}
              submitting={submitting}
              onCancel={() => { setShowCreate(false); setEditing(null); setSubmitError(null) }}
              onSubmit={(vals) => editing?.id ? handleUpdate(editing.id, vals as InstalacaoAccoesUpdateInstalacaoAccoesRequest) : handleCreate(vals as InstalacaoAccoesCreateInstalacaoAccoesRequest)}
            />
          </div>
        </div>
      )}

      {viewing && (
        <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setViewing(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 12, padding: 20, width: '100%', maxWidth: 560 }}>
            <h3 style={{ marginTop: 0 }}>Detalhes da ação</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              <Field label="Criado em" value={formatDate(viewing.created_at)} />
              <Field label="Execução" value={formatDate(viewing.data_execucao)} />
              <Field label="PF" value={viewing.pf || '-'} />
              <Field label="Tipo" value={(viewing as any).accao_tipo?.nome || (viewing as any).accao_tipo_id || '-'} />
              <Field label="Marcação" value={viewing.marcacao_status || '-'} />
              <Field label="Análise" value={viewing.analise_status || '-'} />
              <Field label="Tendência" value={formatTendencia(viewing.tendencia_compras)} />
              <Field label="Valor recuperado" value={formatMoney(viewing.valor_recuperado)} />
            </div>
            <div style={{ marginTop: 12 }}>
              <Field label="Comentário" value={viewing.comentario || '-'} fullWidth />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => setViewing(null)}>Fechar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Th({ label, active, direction, onClick }: { label: string; active?: boolean; direction?: 'asc' | 'desc'; onClick?: () => void }) {
  return (
    <th onClick={onClick} style={{ textAlign: 'left', padding: '10px 8px', borderBottom: '1px solid #e5e7eb', cursor: onClick ? 'pointer' : 'default', whiteSpace: 'nowrap' }} title={onClick ? 'Ordenar' : undefined}>
      {label} {active ? (direction === 'asc' ? '▲' : '▼') : ''}
    </th>
  )
}

function AccaoForm({ tipos, defaultValues, submitting, onSubmit, onCancel, mode = 'create' }: { tipos: ModelInstalacaoAccaoTipo[]; defaultValues?: any; submitting?: boolean; onSubmit: (vals: InstalacaoAccoesCreateInstalacaoAccoesRequest | InstalacaoAccoesUpdateInstalacaoAccoesRequest) => void; onCancel: () => void; mode?: 'create' | 'edit' }) {
  const [vals, setVals] = useState<any>(defaultValues || {})
  useEffect(() => { setVals(defaultValues || {}) }, [defaultValues])
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (!vals?.pf || !vals?.data_execucao || !vals?.accao_tipo_id) return; onSubmit(vals) }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 13, color: '#374151' }}>PF</span>
          <input value={vals.pf || ''} onChange={(e) => setVals((v: any) => ({ ...v, pf: e.target.value }))} placeholder="PF" style={{ padding: 12, borderRadius: 8, border: '1px solid #d1d5db' }} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 13, color: '#374151' }}>Data de execução</span>
          <input type="date" value={vals.data_execucao || ''} onChange={(e) => setVals((v: any) => ({ ...v, data_execucao: e.target.value }))} style={{ padding: 12, borderRadius: 8, border: '1px solid #d1d5db' }} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 13, color: '#374151' }}>Tipo de ação</span>
          <select value={vals.accao_tipo_id || ''} onChange={(e) => setVals((v: any) => ({ ...v, accao_tipo_id: e.target.value }))} style={{ padding: 12, borderRadius: 8, border: '1px solid #d1d5db' }}>
            <option value="">Selecione…</option>
            {tipos.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 13, color: '#374151' }}>Marcação</span>
          <select value={vals.marcacao_status || 'MARCADO'} onChange={(e) => setVals((v: any) => ({ ...v, marcacao_status: e.target.value }))} style={{ padding: 12, borderRadius: 8, border: '1px solid #d1d5db' }}>
            <option value="EXECUTADO">Executado</option>
            <option value="MARCADO">Marcado</option>
          </select>
        </label>
        {mode === 'edit' && (
          <>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 13, color: '#374151' }}>Análise</span>
              <select value={vals.analise_status || 'EM_ANALISE'} onChange={(e) => setVals((v: any) => ({ ...v, analise_status: e.target.value }))} style={{ padding: 12, borderRadius: 8, border: '1px solid #d1d5db' }}>
                <option value="EM_ANALISE">Em análise</option>
                <option value="ANALISADO">Analisado</option>
              </select>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 13, color: '#374151' }}>Tendência</span>
              <select value={vals.tendencia_compras || ''} onChange={(e) => setVals((v: any) => ({ ...v, tendencia_compras: e.target.value }))} style={{ padding: 12, borderRadius: 8, border: '1px solid #d1d5db' }}>
                <option value="">—</option>
                <option value="CRESCENTE">Crescente</option>
                <option value="MUITO_CRESCENTE">Muito crescente</option>
                <option value="NORMAL">Normal</option>
                <option value="DECRESCENTE">Decrescente</option>
                <option value="MUITO_DECRESCENTE">Muito decrescente</option>
                <option value="SEM_COMPRAS">Sem compras</option>
              </select>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 13, color: '#374151' }}>Valor recuperado (MT)</span>
              <input type="number" step="0.01" value={vals.valor_recuperado ?? ''} onChange={(e) => setVals((v: any) => ({ ...v, valor_recuperado: Number(e.target.value) }))} placeholder="0,00" style={{ padding: 12, borderRadius: 8, border: '1px solid #d1d5db' }} />
            </label>
          </>
        )}
      </div>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 13, color: '#374151' }}>Comentário</span>
        <textarea value={vals.comentario || ''} onChange={(e) => setVals((v: any) => ({ ...v, comentario: e.target.value }))} rows={3} style={{ padding: 12, borderRadius: 8, border: '1px solid #d1d5db', resize: 'vertical' }} />
      </label>
      <div style={{ display: 'flex', gap: 8 }}>
        <Button type="submit" disabled={submitting}>{submitting ? 'A guardar…' : 'Guardar'}</Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>Cancelar</Button>
      </div>
    </form>
  )
}

function formatDate(iso?: string) {
  if (!iso) return '-'
  try { const d = new Date(iso as any); if (Number.isNaN(d.getTime())) return '-'; return d.toLocaleDateString('pt-PT') } catch { return '-' }
}
function formatMoney(n?: number) { if (typeof n !== 'number' || Number.isNaN(n)) return '-'; try { return `${n.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT` } catch { return `${n.toFixed(2)} MT` } }
function formatTendencia(t?: any) {
  const v = String(t || '')
  switch (v) {
    case 'CRESCENTE': return 'Crescente'
    case 'MUITO_CRESCENTE': return 'Muito crescente'
    case 'NORMAL': return 'Normal'
    case 'DECRESCENTE': return 'Decrescente'
    case 'MUITO_DECRESCENTE': return 'Muito decrescente'
    case 'SEM_COMPRAS': return 'Sem compras'
    default: return '-'
  }
}

function Field({ label, value, fullWidth }: { label: string; value: React.ReactNode; fullWidth?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, gridColumn: fullWidth ? '1 / -1' : undefined }}>
      <span style={{ fontSize: 13, color: '#374151' }}>{label}</span>
      <div style={{ padding: 10, borderRadius: 8, border: '1px solid #e5e7eb', background: '#f9fafb' }}>{value as any}</div>
    </div>
  )
}
