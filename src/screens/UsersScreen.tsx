import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Card, Button, Heading, Text } from '../components'
import UserForm, { type UserFormValues } from '../components/forms/UserForm'
import { UsersApi, type ModelUser, type UserCreateUserRequest, type UserUpdateUserRequest } from '../services'
import { useAuth } from '../contexts/AuthContext'

type UiState = {
  loading: boolean
  error: string | null
}

export default function UsersScreen() {
  const { getApiConfig, getAuthorizationHeaderValue, logout } = useAuth()
  const [items, setItems] = useState<ModelUser[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [ui, setUi] = useState<UiState>({ loading: false, error: null })
  const [filterText, setFilterText] = useState('')
  const [orderBy, setOrderBy] = useState<'name' | 'username' | 'email' | 'created_at'>('created_at')
  const [orderDirection, setOrderDirection] = useState<'asc' | 'desc'>('desc')

  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<ModelUser | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

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
      let msg = 'Falha a obter utilizadores.'
      if (!status) msg = 'Sem ligação ao servidor.'
      else if (status >= 500) msg = 'Erro do servidor ao carregar utilizadores.'
      else if (status === 401) msg = 'Sessão expirada. Inicie sessão novamente.'
      setUi({ loading: false, error: msg })
      return
    }
    setUi({ loading: false, error: null })
  }, [api, authHeader, page, pageSize, orderBy, orderDirection])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [pageSize, filterText, orderBy, orderDirection])

  function toggleSort(key: 'name' | 'username' | 'email') {
    if (orderBy === key) {
      setOrderDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setOrderBy(key)
      setOrderDirection('asc')
    }
  }

  async function handleCreateSubmit(values: UserFormValues) {
    setSubmitting(true)
    setSubmitError(null)
    try {
      const payload: UserCreateUserRequest = {
        name: values.name,
        username: values.username,
        email: values.email,
        password: values.password,
        type: values.type as any,
        type_id: values.type_id
      }
      const { data } = await api.privateUsersPost(authHeader, payload)
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
      if (status === 400) setSubmitError('Dados inválidos. Verifique o formulário.')
      else if (status === 409) setSubmitError('Utilizador já existe.')
      else if (status === 401) setSubmitError('Sessão expirada. Inicie sessão novamente.')
      else if (!status) setSubmitError('Sem ligação ao servidor.')
      else setSubmitError('Falha ao criar utilizador.')
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
        type_id: values.type_id
      }
      const { data } = await api.privateUsersIdPut(editing.id, authHeader, payload)
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
      if (status === 400) setSubmitError('Dados inválidos. Verifique o formulário.')
      else if (status === 401) setSubmitError('Sessão expirada. Inicie sessão novamente.')
      else if (!status) setSubmitError('Sem ligação ao servidor.')
      else setSubmitError('Falha ao atualizar utilizador.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(user: ModelUser) {
    if (!user.id) return
    const ok = confirm(`Eliminar o utilizador "${user.username || user.email}"?`)
    if (!ok) return
    try {
      const res = await api.privateUsersIdDelete(user.id, authHeader)
      if (isUnauthorizedBody((res as any)?.data)) {
        logout('Sessão expirada. Inicie sessão novamente.')
        return
      }
      await load()
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 401 || isUnauthorizedBody(err?.response?.data)) {
        logout('Sessão expirada. Inicie sessão novamente.')
        return
      }
      alert('Não foi possível eliminar o utilizador.')
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Heading level={2}>Utilizadores</Heading>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Pesquisar (nome, utilizador, email)"
            style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db' }}
          />
          <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db', background: '#fff' }}>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <Button onClick={() => setShowCreate(true)}>Novo utilizador</Button>
        </div>
      </div>

      {ui.error ? <div style={{ background: '#fef3c7', color: '#92400e', padding: 10, borderRadius: 8 }}>{ui.error}</div> : null}

      <Card>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#6b7280' }}>
                <th style={{ padding: '10px 8px', borderBottom: '1px solid #e5e7eb', cursor: 'pointer' }} onClick={() => toggleSort('name')} title="Ordenar por nome">Nome {orderBy === 'name' ? (orderDirection === 'asc' ? '▲' : '▼') : ''}</th>
                <th style={{ padding: '10px 8px', borderBottom: '1px solid #e5e7eb', cursor: 'pointer' }} onClick={() => toggleSort('username')} title="Ordenar por utilizador">Utilizador {orderBy === 'username' ? (orderDirection === 'asc' ? '▲' : '▼') : ''}</th>
                <th style={{ padding: '10px 8px', borderBottom: '1px solid #e5e7eb', cursor: 'pointer' }} onClick={() => toggleSort('email')} title="Ordenar por email">Email {orderBy === 'email' ? (orderDirection === 'asc' ? '▲' : '▼') : ''}</th>
                <th style={{ padding: '10px 8px', borderBottom: '1px solid #e5e7eb' }}>Tipo</th>
                <th style={{ padding: '10px 8px', borderBottom: '1px solid #e5e7eb' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {ui.loading ? (
                <tr>
                  <td colSpan={5} style={{ padding: 16, color: '#6b7280' }}>A carregar…</td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: 16, color: '#6b7280' }}>Sem utilizadores para mostrar.</td>
                </tr>
              ) : (
                items
                  .filter((u) => {
                    if (!filterText.trim()) return true
                    const f = filterText.toLowerCase()
                    return (
                      (u.name || '').toLowerCase().includes(f) ||
                      (u.username || '').toLowerCase().includes(f) ||
                      (u.email || '').toLowerCase().includes(f)
                    )
                  })
                  .map((u) => (
                  <tr key={u.id}>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6' }}>{u.name}</td>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6' }}>{u.username}</td>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6' }}>{u.email}</td>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6' }}>{u.type}</td>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6', display: 'flex', gap: 8 }}>
                      <Button variant="secondary" onClick={() => setEditing(u)}>Editar</Button>
                      <Button variant="danger" onClick={() => handleDelete(u)}>Eliminar</Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, color: '#6b7280' }}>
          <Text>
            Página {page} de {totalPages} · Total {total}
          </Text>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
              Anterior
            </Button>
            <Button variant="secondary" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
              Seguinte
            </Button>
          </div>
        </div>
      </Card>

      {(showCreate || editing) && (
        <div
          role="dialog"
          aria-modal="true"
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => {
            if (submitting) return
            setShowCreate(false)
            setEditing(null)
            setSubmitError(null)
          }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 12, padding: 20, width: '100%', maxWidth: 520 }}>
            {showCreate ? (
              <UserForm mode="create" submitting={submitting} error={submitError} onSubmit={handleCreateSubmit} onCancel={() => { setShowCreate(false); setSubmitError(null) }} />
            ) : (
              <UserForm
                mode="edit"
                initialValues={{
                  name: editing?.name ?? '',
                  username: editing?.username ?? '',
                  email: editing?.email ?? '',
                  type: editing?.type as any,
                  type_id: editing?.type_id ?? ''
                }}
                submitting={submitting}
                error={submitError}
                onSubmit={handleEditSubmit}
                onCancel={() => {
                  setEditing(null)
                  setSubmitError(null)
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
