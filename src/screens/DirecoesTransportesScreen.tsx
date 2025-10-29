import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Card, Button, Text, Pagination } from '../components'
import { DirecaoTransportesApi, type ModelDirecaoTransportes, type DirecaoTransportesCreateDirecaoTransportesRequest, type DirecaoTransportesUpdateDirecaoTransportesRequest } from '../services'
import { useAuth } from '../contexts/AuthContext'

type UiState = { loading: boolean; error: string | null }

export default function DirecoesTransportesScreen() {
  const { getApiConfig, getAuthorizationHeaderValue, logout } = useAuth()
  const api = useMemo(() => new DirecaoTransportesApi(getApiConfig()), [getApiConfig])
  const authHeader = useMemo(() => getAuthorizationHeaderValue(), [getAuthorizationHeaderValue])

  const [items, setItems] = useState<ModelDirecaoTransportes[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [ui, setUi] = useState<UiState>({ loading: false, error: null })
  const [filterName, setFilterName] = useState('')
  const [orderBy, setOrderBy] = useState<'name' | 'created_at'>('created_at')
  const [orderDirection, setOrderDirection] = useState<'asc' | 'desc'>('desc')

  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<ModelDirecaoTransportes | null>(null)
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
      const { data } = await api.privateDirecaoTransportesGet(
        authHeader,
        page,
        pageSize,
        orderBy,
        orderDirection,
        filterName || undefined
      )
      if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      setItems(data.items ?? [])
      setTotal(data.total ?? 0)
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 401 || isUnauthorizedBody(err?.response?.data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      const msg = !status ? 'Sem ligação ao servidor.' : status >= 500 ? 'Erro do servidor ao carregar direções de transporte.' : 'Falha a obter direções de transporte.'
      setUi({ loading: false, error: msg })
      return
    }
    setUi({ loading: false, error: null })
  }, [api, authHeader, page, pageSize, filterName, orderBy, orderDirection])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [filterName, pageSize, orderBy, orderDirection])

  function toggleSort(key: 'name' | 'created_at') {
    if (orderBy === key) {
      setOrderDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setOrderBy(key)
      setOrderDirection('asc')
    }
  }

  async function handleCreate(name: string) {
    setSubmitting(true); setSubmitError(null)
    try {
      const payload: DirecaoTransportesCreateDirecaoTransportesRequest = { name }
      const { data } = await api.privateDirecaoTransportesPost(authHeader, payload)
      if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      setShowCreate(false)
      await load()
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 401 || isUnauthorizedBody(err?.response?.data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      setSubmitError(status === 400 ? 'Dados inválidos.' : !status ? 'Sem ligação ao servidor.' : 'Falha ao criar direção de transporte.')
    } finally { setSubmitting(false) }
  }

  async function handleUpdate(id: string, name: string) {
    setSubmitting(true); setSubmitError(null)
    try {
      const payload: DirecaoTransportesUpdateDirecaoTransportesRequest = { name }
      const { data } = await api.privateDirecaoTransportesIdPut(id, authHeader, payload)
      if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      setEditing(null)
      await load()
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 401 || isUnauthorizedBody(err?.response?.data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      setSubmitError(status === 400 ? 'Dados inválidos.' : !status ? 'Sem ligação ao servidor.' : 'Falha ao atualizar direção de transporte.')
    } finally { setSubmitting(false) }
  }

  async function handleDelete(id: string) {
    const ok = confirm('Eliminar a direção de transporte selecionada?'); if (!ok) return
    try {
      const res = await api.privateDirecaoTransportesIdDelete(id, authHeader)
      if (isUnauthorizedBody((res as any)?.data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      await load()
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 401 || isUnauthorizedBody(err?.response?.data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      alert(!status ? 'Sem ligação ao servidor.' : status >= 500 ? 'Erro do servidor ao eliminar direção de transporte.' : 'Falha ao eliminar direção de transporte.')
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / Math.max(1, pageSize)))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
            placeholder="Pesquisar por nome"
            style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db', minWidth: 260 }}
          />
          <select value={String(pageSize)} onChange={(e) => setPageSize(Number(e.target.value))} style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db' }}>
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button onClick={() => setShowCreate(true)}>Nova direção</Button>
        </div>
      </div>
      {ui.error ? <div style={{ background: '#fef3c7', color: '#92400e', padding: 10, borderRadius: 8 }}>{ui.error}</div> : null}

      <Card>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#6b7280' }}>
                <th
                  style={{ padding: '10px 8px', borderBottom: '1px solid #e5e7eb', cursor: 'pointer' }}
                  onClick={() => toggleSort('name')}
                  title="Ordenar por nome"
                >
                  Nome {orderBy === 'name' ? (orderDirection === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th style={{ padding: '10px 8px', borderBottom: '1px solid #e5e7eb' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {ui.loading ? (
                <tr><td colSpan={2} style={{ padding: 16, color: '#6b7280' }}>A carregar…</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={2} style={{ padding: 16, color: '#6b7280' }}>Sem direções para mostrar.</td></tr>
              ) : (
                items.map((d) => (
                  <tr key={d.id}>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6' }}>{d.name}</td>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6', display: 'flex', gap: 8 }}>
                      <Button variant="secondary" onClick={() => setEditing(d)}>Editar</Button>
                      <Button variant="danger" onClick={() => d.id && handleDelete(d.id)}>Eliminar</Button>
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

      {(showCreate || editing) && (
        <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => { if (submitting) return; setShowCreate(false); setEditing(null); setSubmitError(null) }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 12, padding: 20, width: '100%', maxWidth: 420 }}>
            <h3 style={{ marginTop: 0 }}>{showCreate ? 'Criar direção' : 'Editar direção'}</h3>
            {submitError ? <div style={{ background: '#fee2e2', color: '#991b1b', padding: 10, borderRadius: 8 }}>{submitError}</div> : null}
            <DirecaoForm
              defaultName={editing?.name ?? ''}
              submitting={submitting}
              onCancel={() => { setShowCreate(false); setEditing(null); setSubmitError(null) }}
              onSubmit={(name) => showCreate ? handleCreate(name) : (editing?.id ? handleUpdate(editing.id, name) : undefined)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function DirecaoForm({ defaultName, submitting, onSubmit, onCancel }: { defaultName?: string; submitting?: boolean; onSubmit: (name: string) => void; onCancel: () => void }) {
  const [name, setName] = useState(defaultName ?? '')
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (!name.trim()) return; onSubmit(name.trim()) }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 13, color: '#374151' }}>Nome</span>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome da direção" style={{ padding: 12, borderRadius: 8, border: '1px solid #d1d5db' }} />
      </label>
      <div style={{ display: 'flex', gap: 8 }}>
        <Button type="submit" disabled={submitting}>{submitting ? 'A guardar…' : 'Guardar'}</Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>Cancelar</Button>
      </div>
    </form>
  )
}

