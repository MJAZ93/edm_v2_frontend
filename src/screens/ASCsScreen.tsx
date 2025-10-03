import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Card, Button, Heading, Text } from '../components'
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
  const [pageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [ui, setUi] = useState<UiState>({ loading: false, error: null })

  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<ASC | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [regioes, setRegioes] = useState<ModelRegiao[]>([])

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
      const { data } = await api.privateAscsGet(authHeader, page, pageSize, 'created_at', 'desc')
      if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      setItems(data.items as any || [])
      setTotal(data.total ?? 0)
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 401 || isUnauthorizedBody(err?.response?.data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      const msg = !status ? 'Sem ligação ao servidor.' : status >= 500 ? 'Erro do servidor ao carregar ASCs.' : 'Falha a obter ASCs.'
      setUi({ loading: false, error: msg })
      return
    }
    setUi({ loading: false, error: null })
  }, [api, authHeader, page, pageSize])

  useEffect(() => { load() }, [load])

  const loadRegioes = useCallback(async () => {
    try {
      const { data } = await regApi.privateRegioesGet(authHeader, 1, 100, 'name', 'asc')
      if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      setRegioes(data.items ?? [])
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 401 || isUnauthorizedBody(err?.response?.data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      // Silencioso: manter combo vazia se falhar
    }
  }, [regApi, authHeader])

  useEffect(() => { loadRegioes() }, [loadRegioes])

  async function handleCreate(input: { name: string; regiao_id: string }) {
    setSubmitting(true); setSubmitError(null)
    try {
      const payload: AscCreateASCRequest = { name: input.name, regiao_id: input.regiao_id }
      const { data } = await api.privateAscsPost(authHeader, payload)
      if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      setShowCreate(false)
      await load()
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 401 || isUnauthorizedBody(err?.response?.data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      setSubmitError(status === 400 ? 'Dados inválidos.' : !status ? 'Sem ligação ao servidor.' : 'Falha ao criar ASC.')
    } finally { setSubmitting(false) }
  }

  async function handleUpdate(id: string, input: { name: string; regiao_id: string }) {
    setSubmitting(true); setSubmitError(null)
    try {
      const payload: AscUpdateASCRequest = { name: input.name, regiao_id: input.regiao_id }
      const { data } = await api.privateAscsIdPut(id, authHeader, payload)
      if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      setEditing(null)
      await load()
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 401 || isUnauthorizedBody(err?.response?.data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      setSubmitError(status === 400 ? 'Dados inválidos.' : !status ? 'Sem ligação ao servidor.' : 'Falha ao atualizar ASC.')
    } finally { setSubmitting(false) }
  }

  async function handleDelete(id: string) {
    const ok = confirm('Eliminar o ASC selecionado?'); if (!ok) return
    try {
      const res = await api.privateAscsIdDelete(id, authHeader)
      if (isUnauthorizedBody((res as any)?.data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      await load()
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 401 || isUnauthorizedBody(err?.response?.data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      alert('Não foi possível eliminar o ASC.')
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Heading level={2}>ASCs</Heading>
        <Button onClick={() => { setShowCreate(true); if (regioes.length === 0) loadRegioes() }}>Novo ASC</Button>
      </div>
      {ui.error ? <div style={{ background: '#fef3c7', color: '#92400e', padding: 10, borderRadius: 8 }}>{ui.error}</div> : null}

      <Card>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#6b7280' }}>
                <th style={{ padding: '10px 8px', borderBottom: '1px solid #e5e7eb' }}>Nome</th>
                <th style={{ padding: '10px 8px', borderBottom: '1px solid #e5e7eb' }}>Região</th>
                <th style={{ padding: '10px 8px', borderBottom: '1px solid #e5e7eb' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {ui.loading ? (
                <tr><td colSpan={3} style={{ padding: 16, color: '#6b7280' }}>A carregar…</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={3} style={{ padding: 16, color: '#6b7280' }}>Sem ASCs para mostrar.</td></tr>
              ) : (
                items.map((a) => (
                  <tr key={a.id}>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6' }}>{a.name}</td>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6' }}>{regioes.find(r => r.id === a.regiao_id)?.name || a.regiao_id}</td>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6', display: 'flex', gap: 8 }}>
                      <Button variant="secondary" onClick={() => setEditing(a)}>Editar</Button>
                      <Button variant="danger" onClick={() => a.id && handleDelete(a.id)}>Eliminar</Button>
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
            <h3 style={{ marginTop: 0 }}>{showCreate ? 'Criar ASC' : 'Editar ASC'}</h3>
            {submitError ? <div style={{ background: '#fee2e2', color: '#991b1b', padding: 10, borderRadius: 8 }}>{submitError}</div> : null}
            <AscForm
              defaultValue={{ name: editing?.name ?? '', regiao_id: editing?.regiao_id ?? '' }}
              regioes={regioes}
              submitting={submitting}
              onCancel={() => { setShowCreate(false); setEditing(null); setSubmitError(null) }}
              onSubmit={(input) => showCreate ? handleCreate(input) : (editing?.id ? handleUpdate(editing.id, input) : undefined)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function AscForm({ defaultValue, regioes, submitting, onSubmit, onCancel }: { defaultValue?: { name: string; regiao_id: string }; regioes: { id?: string; name?: string }[]; submitting?: boolean; onSubmit: (input: { name: string; regiao_id: string }) => void; onCancel: () => void }) {
  const [name, setName] = useState(defaultValue?.name ?? '')
  const [regiaoId, setRegiaoId] = useState(defaultValue?.regiao_id ?? '')
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (!name.trim() || !regiaoId.trim()) return; onSubmit({ name: name.trim(), regiao_id: regiaoId.trim() }) }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 13, color: '#374151' }}>Nome</span>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do ASC" style={{ padding: 12, borderRadius: 8, border: '1px solid #d1d5db' }} />
      </label>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 13, color: '#374151' }}>Região</span>
        <select value={regiaoId} onChange={(e) => setRegiaoId(e.target.value)} required style={{ padding: 12, borderRadius: 8, border: '1px solid #d1d5db', background: '#fff' }}>
          <option value="">— Selecionar —</option>
          {regioes.map((r) => (
            <option key={r.id} value={r.id}>{r.name || r.id}</option>
          ))}
        </select>
      </label>
      <div style={{ display: 'flex', gap: 8 }}>
        <Button type="submit" disabled={submitting}>{submitting ? 'A guardar…' : 'Guardar'}</Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>Cancelar</Button>
      </div>
    </form>
  )
}
