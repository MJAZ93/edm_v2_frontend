import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Card, Text, Pagination } from '../components'
import { useAuth } from '../contexts/AuthContext'
import {
  InstalacaoAccaoTipoApi,
  type InstalacaoAccaoTipoCreateInstalacaoAccaoTipoRequest,
  type InstalacaoAccaoTipoUpdateInstalacaoAccaoTipoRequest,
  type ModelInstalacaoAccaoTipo,
} from '../services'

export default function InstalacaoAccaoTiposScreen() {
  const { getApiConfig, getAuthorizationHeaderValue, logout } = useAuth()
  const api = useMemo(() => new InstalacaoAccaoTipoApi(getApiConfig()), [getApiConfig])
  const authHeader = useMemo(() => getAuthorizationHeaderValue(), [getAuthorizationHeaderValue])

  const [items, setItems] = useState<ModelInstalacaoAccaoTipo[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [ui, setUi] = useState<{ loading: boolean; error: string | null }>({ loading: false, error: null })

  const [filterName, setFilterName] = useState('')
  const [orderBy, setOrderBy] = useState<'nome' | 'created_at'>('created_at')
  const [orderDirection, setOrderDirection] = useState<'asc' | 'desc'>('desc')

  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<ModelInstalacaoAccaoTipo | null>(null)
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
      const { data } = await api.privateInstalacaoAccaoTiposGet(
        authHeader,
        page,
        pageSize,
        orderBy,
        orderDirection,
        filterName || undefined
      )
      if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      setItems(((data as any)?.items) ?? [])
      setTotal(Number((data as any)?.total ?? 0))
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 401 || isUnauthorizedBody(err?.response?.data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      setUi({ loading: false, error: !status ? 'Sem ligação ao servidor.' : status >= 500 ? 'Erro do servidor ao carregar tipos de ações.' : 'Falha a obter tipos de ações.' })
      return
    }
    setUi({ loading: false, error: null })
  }, [api, authHeader, page, pageSize, orderBy, orderDirection, filterName])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [filterName, pageSize, orderBy, orderDirection])

  function toggleSort(key: 'nome' | 'created_at') {
    if (orderBy === key) setOrderDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setOrderBy(key); setOrderDirection('asc') }
  }

  async function handleCreate(input: { nome: string; descricao?: string }) {
    setSubmitting(true); setSubmitError(null)
    try {
      const payload: InstalacaoAccaoTipoCreateInstalacaoAccaoTipoRequest = { nome: input.nome, descricao: input.descricao }
      const { data } = await api.privateInstalacaoAccaoTiposPost(authHeader, payload)
      if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      setShowCreate(false)
      await load()
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 401 || isUnauthorizedBody(err?.response?.data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      setSubmitError(status === 400 ? 'Dados inválidos.' : !status ? 'Sem ligação ao servidor.' : 'Falha ao criar tipo de ação.')
    } finally { setSubmitting(false) }
  }

  async function handleUpdate(id: string, input: { nome: string; descricao?: string }) {
    setSubmitting(true); setSubmitError(null)
    try {
      const payload: InstalacaoAccaoTipoUpdateInstalacaoAccaoTipoRequest = { nome: input.nome, descricao: input.descricao }
      const { data } = await api.privateInstalacaoAccaoTiposIdPut(id, authHeader, payload)
      if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      setEditing(null)
      await load()
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 401 || isUnauthorizedBody(err?.response?.data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      setSubmitError(status === 400 ? 'Dados inválidos.' : !status ? 'Sem ligação ao servidor.' : 'Falha ao atualizar tipo de ação.')
    } finally { setSubmitting(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm('Eliminar o tipo de ação selecionado?')) return
    try {
      await api.privateInstalacaoAccaoTiposIdDelete(id, authHeader)
      await load()
    } catch {
      alert('Não foi possível eliminar.')
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card title="Filtros">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <input value={filterName} onChange={(e) => setFilterName(e.target.value)} placeholder="Pesquisar por nome" style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid #d1d5db', flex: '1 1 240px' }} />
          <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid #d1d5db' }}>
            <option value={10}>10 por página</option>
            <option value={20}>20 por página</option>
            <option value={50}>50 por página</option>
          </select>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <Button onClick={() => setShowCreate(true)}>Criar tipo de ação</Button>
            <Button variant="secondary" onClick={() => { setFilterName(''); setOrderBy('created_at'); setOrderDirection('desc'); setPage(1) }}>Limpar</Button>
          </div>
        </div>
        {ui.error ? <div style={{ background: '#fee2e2', color: '#991b1b', padding: 10, borderRadius: 8, marginTop: 10 }}>{ui.error}</div> : null}
      </Card>

      <Card>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#6b7280' }}>
                <th onClick={() => toggleSort('nome')} style={{ padding: '10px 8px', borderBottom: '1px solid #e5e7eb', cursor: 'pointer' }} title="Ordenar por nome">
                  Nome {orderBy === 'nome' ? (orderDirection === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th style={{ padding: '10px 8px', borderBottom: '1px solid #e5e7eb' }}>Descrição</th>
                <th style={{ padding: '10px 8px', borderBottom: '1px solid #e5e7eb' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {ui.loading ? (
                <tr><td colSpan={3} style={{ padding: 16, color: '#6b7280' }}>A carregar…</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={3} style={{ padding: 16, color: '#6b7280' }}>Sem tipos de ações para mostrar.</td></tr>
              ) : (
                items.map((it) => (
                  <tr key={it.id}>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6' }}>{it.nome || '-'}</td>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6' }}>{it.descricao || '-'}</td>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6', display: 'flex', gap: 8 }}>
                      <Button variant="secondary" onClick={() => setEditing(it)}>Editar</Button>
                      <Button variant="danger" onClick={() => it.id && handleDelete(it.id)}>Eliminar</Button>
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
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 12, padding: 20, width: '100%', maxWidth: 480 }}>
            <h3 style={{ marginTop: 0 }}>{showCreate ? 'Criar tipo de ação' : 'Editar tipo de ação'}</h3>
            {submitError ? <div style={{ background: '#fee2e2', color: '#991b1b', padding: 10, borderRadius: 8 }}>{submitError}</div> : null}
            <TipoAccaoForm
              defaultValues={{ nome: editing?.nome ?? '', descricao: editing?.descricao ?? '' }}
              submitting={submitting}
              onCancel={() => { setShowCreate(false); setEditing(null); setSubmitError(null) }}
              onSubmit={(vals) => showCreate ? handleCreate(vals) : (editing?.id ? handleUpdate(editing.id, vals) : undefined)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function TipoAccaoForm({ defaultValues, submitting, onSubmit, onCancel }: { defaultValues?: { nome?: string; descricao?: string }; submitting?: boolean; onSubmit: (vals: { nome: string; descricao?: string }) => void; onCancel: () => void }) {
  const [nome, setNome] = useState(defaultValues?.nome ?? '')
  const [descricao, setDescricao] = useState(defaultValues?.descricao ?? '')
  return (
    <form onSubmit={(e) => { e.preventDefault(); const v = nome.trim(); if (!v) return; onSubmit({ nome: v, descricao: descricao.trim() || undefined }) }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 13, color: '#374151' }}>Nome</span>
        <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome do tipo de ação" style={{ padding: 12, borderRadius: 8, border: '1px solid #d1d5db' }} />
      </label>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 13, color: '#374151' }}>Descrição</span>
        <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descrição (opcional)" rows={3} style={{ padding: 12, borderRadius: 8, border: '1px solid #d1d5db', resize: 'vertical' }} />
      </label>
      <div style={{ display: 'flex', gap: 8 }}>
        <Button type="submit" disabled={submitting}>{submitting ? 'A guardar…' : 'Guardar'}</Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>Cancelar</Button>
      </div>
    </form>
  )
}
