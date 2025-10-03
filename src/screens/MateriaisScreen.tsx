import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Card, Button, Heading, Text } from '../components'
import { MaterialApi, SectorInfracaoApi, type MaterialCreateMaterialRequest, type MaterialUpdateMaterialRequest, type ModelSectorInfracao } from '../services'
import { useAuth } from '../contexts/AuthContext'

type Material = { id?: string; name?: string; unidade?: string; scrapyard_id?: string; sector_infracao_id?: string }
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
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
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
    } catch { return false }
  }

  const load = useCallback(async () => {
    setUi({ loading: true, error: null })
    try {
      const { data } = await api.privateMateriaisGet(authHeader, page, pageSize, orderBy, orderDirection, undefined, filterSectorId || undefined, filterName || undefined)
      if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      setItems(data.items as any || [])
      setTotal(data.total ?? 0)
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 401 || isUnauthorizedBody(err?.response?.data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      const msg = !status ? 'Sem ligação ao servidor.' : status >= 500 ? 'Erro do servidor ao carregar materiais.' : 'Falha a obter materiais.'
      setUi({ loading: false, error: msg })
      return
    }
    setUi({ loading: false, error: null })
  }, [api, authHeader, page, pageSize, filterName, filterSectorId, orderBy, orderDirection])

  useEffect(() => { load() }, [load])

  const loadSectors = useCallback(async () => {
    try {
      const { data } = await sectorApi.privateSectorInfracaoGet(authHeader, 1, 100, 'name', 'asc')
      if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      setSectors(data.items ?? [])
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 401 || isUnauthorizedBody(err?.response?.data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      // silencioso
    }
  }, [sectorApi, authHeader])

  useEffect(() => { loadSectors() }, [loadSectors])
  useEffect(() => { setPage(1) }, [filterName, filterSectorId, pageSize, orderBy, orderDirection])

  function toggleSort(key: 'name' | 'created_at') {
    if (orderBy === key) {
      setOrderDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setOrderBy(key)
      setOrderDirection('asc')
    }
  }

  async function handleCreate(input: Material) {
    setSubmitting(true); setSubmitError(null)
    try {
      const payload: MaterialCreateMaterialRequest = { name: input.name, unidade: input.unidade, sector_infracao_id: input.sector_infracao_id }
      const { data } = await api.privateMateriaisPost(authHeader, payload)
      if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      setShowCreate(false)
      await load()
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 401 || isUnauthorizedBody(err?.response?.data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      setSubmitError(status === 400 ? 'Dados inválidos.' : !status ? 'Sem ligação ao servidor.' : 'Falha ao criar material.')
    } finally { setSubmitting(false) }
  }

  async function handleUpdate(id: string, input: Material) {
    setSubmitting(true); setSubmitError(null)
    try {
      const payload: MaterialUpdateMaterialRequest = { name: input.name, unidade: input.unidade, sector_infracao_id: input.sector_infracao_id }
      const { data } = await api.privateMateriaisIdPut(id, authHeader, payload)
      if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      setEditing(null)
      await load()
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 401 || isUnauthorizedBody(err?.response?.data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      setSubmitError(status === 400 ? 'Dados inválidos.' : !status ? 'Sem ligação ao servidor.' : 'Falha ao atualizar material.')
    } finally { setSubmitting(false) }
  }

  async function handleDelete(id: string) {
    const ok = confirm('Eliminar o material selecionado?'); if (!ok) return
    try {
      const res = await api.privateMateriaisIdDelete(id, authHeader)
      if (isUnauthorizedBody((res as any)?.data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      await load()
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 401 || isUnauthorizedBody(err?.response?.data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      alert('Não foi possível eliminar o material.')
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Heading level={2}>Materiais</Heading>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input value={filterName} onChange={(e) => setFilterName(e.target.value)} placeholder="Filtrar por nome" style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db' }} />
          <select value={filterSectorId} onChange={(e) => setFilterSectorId(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db', background: '#fff' }}>
            <option value="">Todos os setores</option>
            {sectors.map(s => <option key={s.id} value={s.id}>{s.name || s.id}</option>)}
          </select>
          <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db', background: '#fff' }}>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <Button onClick={() => { setShowCreate(true); if (sectors.length === 0) loadSectors() }}>Novo material</Button>
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
                <th style={{ padding: '10px 8px', borderBottom: '1px solid #e5e7eb' }}>Unidade</th>
                <th style={{ padding: '10px 8px', borderBottom: '1px solid #e5e7eb' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {ui.loading ? (
                <tr><td colSpan={3} style={{ padding: 16, color: '#6b7280' }}>A carregar…</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={3} style={{ padding: 16, color: '#6b7280' }}>Sem materiais para mostrar.</td></tr>
              ) : (
                items.map((m) => (
                  <tr key={m.id}>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6' }}>{m.name}</td>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6' }}>{m.unidade}</td>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6', display: 'flex', gap: 8 }}>
                      <Button variant="secondary" onClick={() => setEditing(m)}>Editar</Button>
                      <Button variant="danger" onClick={() => m.id && handleDelete(m.id)}>Eliminar</Button>
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
            <h3 style={{ marginTop: 0 }}>{showCreate ? 'Criar material' : 'Editar material'}</h3>
            {submitError ? <div style={{ background: '#fee2e2', color: '#991b1b', padding: 10, borderRadius: 8 }}>{submitError}</div> : null}
            <MaterialForm
              defaultValue={{ name: editing?.name ?? '', unidade: editing?.unidade ?? '', sector_infracao_id: editing?.sector_infracao_id ?? '' }}
              sectors={sectors}
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

function MaterialForm({ defaultValue, sectors, submitting, onSubmit, onCancel }: { defaultValue?: Material; sectors: { id?: string; name?: string }[]; submitting?: boolean; onSubmit: (input: Material) => void; onCancel: () => void }) {
  const [name, setName] = useState(defaultValue?.name ?? '')
  const [unidade, setUnidade] = useState(defaultValue?.unidade ?? '')
  const [sectorId, setSectorId] = useState(defaultValue?.sector_infracao_id ?? '')
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (!name.trim()) return; onSubmit({ name: name.trim(), unidade: unidade.trim() || undefined, sector_infracao_id: sectorId || undefined }) }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 13, color: '#374151' }}>Nome</span>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do material" style={{ padding: 12, borderRadius: 8, border: '1px solid #d1d5db' }} />
      </label>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 13, color: '#374151' }}>Unidade</span>
        <input value={unidade} onChange={(e) => setUnidade(e.target.value)} placeholder="ex.: kg, m, unid" style={{ padding: 12, borderRadius: 8, border: '1px solid #d1d5db' }} />
      </label>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 13, color: '#374151' }}>Sector de Infração</span>
        <select value={sectorId} onChange={(e) => setSectorId(e.target.value)} required style={{ padding: 12, borderRadius: 8, border: '1px solid #d1d5db', background: '#fff' }}>
          <option value="">— Selecionar —</option>
          {sectors.map((s) => (
            <option key={s.id} value={s.id}>{s.name || s.id}</option>
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
