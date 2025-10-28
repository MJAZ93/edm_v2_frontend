import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Card, Button, Heading, Text } from '../components'
import ScrapyardForm, { type ScrapyardFormValues } from '../components/forms/ScrapyardForm'
import { ScrapyardApi, type ModelScrapyard, type ScrapyardCreateScrapyardRequest, type ScrapyardUpdateScrapyardRequest } from '../services'
import { useAuth } from '../contexts/AuthContext'

type UiState = { loading: boolean; error: string | null }

export default function ScrapyardsScreen() {
  const { getApiConfig, getAuthorizationHeaderValue, logout } = useAuth()
  const [items, setItems] = useState<ModelScrapyard[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [ui, setUi] = useState<UiState>({ loading: false, error: null })
  const [filterText, setFilterText] = useState('')
  const [orderBy, setOrderBy] = useState<'nome' | 'nivel_confianca' | 'created_at'>('created_at')
  const [orderDirection, setOrderDirection] = useState<'asc' | 'desc'>('desc')

  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<ModelScrapyard | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const api = useMemo(() => new ScrapyardApi(getApiConfig()), [getApiConfig])
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
      const { data } = await api.privateScrapyardsGet(authHeader, page, pageSize, orderBy, orderDirection)
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
      let msg = 'Falha a obter sucatarias.'
      if (!status) msg = 'Sem ligação ao servidor.'
      else if (status >= 500) msg = 'Erro do servidor ao carregar sucatarias.'
      else if (status === 401) msg = 'Sessão expirada. Inicie sessão novamente.'
      setUi({ loading: false, error: msg })
      return
    }
    setUi({ loading: false, error: null })
  }, [api, authHeader, page, pageSize, orderBy, orderDirection])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [pageSize, filterText, orderBy, orderDirection])

  function toggleSort(key: 'nome' | 'nivel_confianca') {
    if (orderBy === key) {
      setOrderDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setOrderBy(key)
      setOrderDirection('asc')
    }
  }

  const formatPercent = (v?: number) => (typeof v === 'number' && !Number.isNaN(v)) ? `${(v * 100).toFixed(1)} %` : '—'

  async function handleCreateSubmit(values: ScrapyardFormValues) {
    setSubmitting(true)
    setSubmitError(null)
    try {
      const payload: ScrapyardCreateScrapyardRequest = {
        nome: values.nome,
        asc_id: values.asc_id,
        lat: values.lat,
        long: values.lng,
        nivel_confianca: values.nivel_confianca ?? 50,
        material_ids: values.material_ids ?? []
      }
      const { data } = await api.privateScrapyardsPost(authHeader, payload)
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
      else if (status === 409) setSubmitError('Conflito ao criar sucataria.')
      else if (status === 401) setSubmitError('Sessão expirada. Inicie sessão novamente.')
      else if (!status) setSubmitError('Sem ligação ao servidor.')
      else setSubmitError('Falha ao criar sucataria.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleEditSubmit(values: ScrapyardFormValues) {
    if (!editing?.id) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const payload: ScrapyardUpdateScrapyardRequest = {
        nome: values.nome,
        asc_id: values.asc_id || undefined,
        lat: values.lat,
        long: values.lng,
        nivel_confianca: values.nivel_confianca ?? 50,
        material_ids: values.material_ids ?? []
      }
      const { data } = await api.privateScrapyardsIdPut(editing.id, authHeader, payload)
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
      else setSubmitError('Falha ao atualizar sucataria.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(item: ModelScrapyard) {
    if (!item.id) return
    const ok = confirm(`Eliminar a sucataria "${item.nome}"?`)
    if (!ok) return
    try {
      const res = await api.privateScrapyardsIdDelete(item.id, authHeader)
      if ((res as any)?.data && isUnauthorizedBody((res as any).data)) {
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
      alert('Não foi possível eliminar a sucataria.')
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Heading level={2}>Sucatarias</Heading>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Pesquisar (nome)"
            style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db' }}
          />
          <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db', background: '#fff' }}>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <Button variant="secondary" onClick={() => {
            if (window.location.pathname !== '/sucatarias/mapa') window.history.pushState({}, '', '/sucatarias/mapa')
            window.dispatchEvent(new Event('popstate'))
            window.dispatchEvent(new Event('locationchange'))
          }}>Ver no mapa</Button>
          <Button onClick={() => setShowCreate(true)}>Nova sucataria</Button>
        </div>
      </div>

      {ui.error ? <div style={{ background: '#fef3c7', color: '#92400e', padding: 10, borderRadius: 8 }}>{ui.error}</div> : null}

      <Card>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#6b7280' }}>
                <th style={{ padding: '10px 8px', borderBottom: '1px solid #e5e7eb', cursor: 'pointer' }} onClick={() => toggleSort('nome')} title="Ordenar por nome">Nome {orderBy === 'nome' ? (orderDirection === 'asc' ? '▲' : '▼') : ''}</th>
                <th style={{ padding: '10px 8px', borderBottom: '1px solid #e5e7eb' }}>ASC</th>
                <th style={{ padding: '10px 8px', borderBottom: '1px solid #e5e7eb', cursor: 'pointer' }} onClick={() => toggleSort('nivel_confianca')} title="Ordenar por nível de desconfiança">Desconfiança</th>
                <th style={{ padding: '10px 8px', borderBottom: '1px solid #e5e7eb' }}>Materiais</th>
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
                  <td colSpan={5} style={{ padding: 16, color: '#6b7280' }}>Sem sucatarias para mostrar.</td>
                </tr>
              ) : (
                items
                  .filter((s) => {
                    if (!filterText.trim()) return true
                    const f = filterText.toLowerCase()
                    return (s.nome || '').toLowerCase().includes(f)
                  })
                  .map((s) => (
                  <tr key={s.id}>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6' }}>{s.nome}</td>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6' }}>{(s as any).asc_name || '—'}</td>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6' }}>{formatPercent(s.nivel_confianca as any)}</td>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6', maxWidth: 420 }}
                        title={(Array.isArray((s as any).materiais) && (s as any).materiais.length) ? (s as any).materiais.map((m: any) => m?.name).filter(Boolean).join(', ') : undefined}>
                      <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {(() => {
                          const list = Array.isArray((s as any).materiais) ? (s as any).materiais : []
                          const names = list.map((m: any) => m?.name).filter(Boolean) as string[]
                          if (names.length === 0) return '—'
                          const joined = names.join(', ')
                          return joined.length > 120 ? joined.slice(0, 117) + '…' : joined
                        })()}
                      </div>
                    </td>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6', display: 'flex', gap: 8 }}>
                      <Button variant="secondary" onClick={() => { if ((s as any).id) { window.history.pushState({}, '', `/sucatarias/${(s as any).id}`); window.dispatchEvent(new Event('locationchange')) } }}>Ver detalhes</Button>
                      <Button variant="secondary" onClick={() => setEditing(s)}>Editar</Button>
                      <Button variant="danger" onClick={() => handleDelete(s)}>Eliminar</Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, color: '#6b7280' }}>
          <Text>
            Página {page} de {Math.max(1, Math.ceil(total / pageSize))} · Total {total}
          </Text>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Anterior</Button>
            <Button variant="secondary" onClick={() => setPage((p) => Math.min(Math.max(1, Math.ceil(total / pageSize)), p + 1))} disabled={page >= Math.max(1, Math.ceil(total / pageSize))}>Seguinte</Button>
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
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 12, padding: 20, width: '100%', maxWidth: 560 }}>
            {showCreate ? (
              <ScrapyardForm mode="create" submitting={submitting} error={submitError} onSubmit={handleCreateSubmit} onCancel={() => { setShowCreate(false); setSubmitError(null) }} />
            ) : (
              <ScrapyardForm
                mode="edit"
                initialValues={{
                  nome: editing?.nome ?? '',
                  asc_id: editing?.asc_id ?? '',
                  lat: editing?.lat ?? undefined,
                  lng: editing?.long ?? undefined,
                  nivel_confianca: editing?.nivel_confianca ?? undefined,
                  material_ids: (editing?.materiais ?? []).map((m) => m?.id).filter(Boolean) as string[]
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
