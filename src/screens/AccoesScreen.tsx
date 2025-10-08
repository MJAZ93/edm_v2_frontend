import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Card, Text } from '../components'
import { useAuth } from '../contexts/AuthContext'
import { AccoesApi, ASCApi, MaterialApi, type ModelAccoes, type ModelASC, type ModelMaterial } from '../services'

export default function AccoesScreen() {
  const { getApiConfig, getAuthorizationHeaderValue, logout } = useAuth()
  const api = useMemo(() => new AccoesApi(getApiConfig()), [getApiConfig])
  const ascApi = useMemo(() => new ASCApi(getApiConfig()), [getApiConfig])
  const materialApi = useMemo(() => new MaterialApi(getApiConfig()), [getApiConfig])
  const authHeader = useMemo(() => getAuthorizationHeaderValue(), [getAuthorizationHeaderValue])

  const [items, setItems] = useState<ModelAccoes[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [ui, setUi] = useState<{ loading: boolean; error: string | null }>({ loading: false, error: null })

  const [orderBy, setOrderBy] = useState<'created_at' | 'data_implementacao' | 'amount'>('created_at')
  const [orderDirection, setOrderDirection] = useState<'asc' | 'desc'>('desc')

  const [ascId, setAscId] = useState('')
  const [texto, setTexto] = useState('')
  const [ascs, setAscs] = useState<ModelASC[]>([])
  const [materials, setMaterials] = useState<ModelMaterial[]>([])

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
      const { data } = await api.privateAccoesGet(authHeader, page, pageSize, orderBy, orderDirection, ascId || undefined)
      if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      setItems((data as any).items ?? [])
      setTotal((data as any).total ?? 0)
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 401 || isUnauthorizedBody(err?.response?.data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      setUi({ loading: false, error: !status ? 'Sem ligação ao servidor.' : status >= 500 ? 'Erro do servidor ao carregar ações.' : 'Falha a obter ações.' })
      return
    }
    setUi({ loading: false, error: null })
  }, [api, authHeader, page, pageSize, orderBy, orderDirection, ascId])

  useEffect(() => { load() }, [load])
  useEffect(() => { (async () => { try { const { data } = await ascApi.privateAscsGet(authHeader, -1, undefined, 'name', 'asc'); if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return } setAscs((data as any).items ?? []) } catch {} })() }, [ascApi, authHeader])
  useEffect(() => { (async () => { try { const { data } = await materialApi.privateMateriaisGet(authHeader, -1, undefined, 'name', 'asc'); if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return } setMaterials((data as any).items ?? []) } catch {} })() }, [materialApi, authHeader])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const formatMoney = (n?: number) => (typeof n === 'number' && !Number.isNaN(n)) ? `${n.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT` : '—'
  const resolveAsc = (id?: string) => { const it = ascs.find((a) => a.id === id); return it?.name || id || '-' }
  const resolveMateriais = (list?: any[]) => Array.isArray(list) && list.length ? list.map((m) => (m.name || m.id)).filter(Boolean).join(', ') : '—'

  function toggleSort(key: 'created_at' | 'data_implementacao' | 'amount') {
    if (orderBy === key) setOrderDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setOrderBy(key); setOrderDirection('asc') }
  }

  function openCreate() {
    window.history.pushState({}, '', '/accoes/novo')
    window.dispatchEvent(new Event('locationchange'))
  }
  function openDetails(id?: string) { if (!id) return; window.history.pushState({}, '', `/accoes/${id}`); window.dispatchEvent(new Event('locationchange')) }
  function openEdit(id?: string) { if (!id) return; window.history.pushState({}, '', `/accoes/${id}/editar`); window.dispatchEvent(new Event('locationchange')) }
  async function handleDelete(id?: string) {
    if (!id) return
    if (!window.confirm('Eliminar ação?')) return
    try { await api.privateAccoesIdDelete(id, authHeader); await load() } catch { alert('Não foi possível eliminar.') }
  }

  const viewItems = useMemo(() => {
    const q = texto.trim().toLowerCase()
    return items.filter((it) => {
      if (!q) return true
      const fields = [String(it.accoes || ''), resolveAsc(it.asc_id), resolveMateriais((it as any).materiais)]
      return fields.some((s) => (s || '').toLowerCase().includes(q))
    })
  }, [items, texto, ascs, materials])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card title="Filtros">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Pesquisar por termo…" style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid #d1d5db', minWidth: 220 }} />
          <select value={ascId} onChange={(e) => setAscId(e.target.value)} style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid #d1d5db', background: '#fff' }}>
            <option value="">ASC (todas)</option>
            {ascs.map((a) => (<option key={a.id} value={a.id}>{a.name || a.id}</option>))}
          </select>
          <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid #d1d5db', background: '#fff' }}>
            <option value={10}>10 por página</option>
            <option value={20}>20 por página</option>
            <option value={50}>50 por página</option>
          </select>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <Button variant="secondary" onClick={() => { setTexto(''); setAscId(''); setOrderBy('created_at'); setOrderDirection('desc'); setPage(1) }}>Limpar</Button>
            <Button onClick={openCreate}>Nova ação</Button>
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
                <Th label="Implementação" active={orderBy === 'data_implementacao'} direction={orderDirection} onClick={() => toggleSort('data_implementacao')} />
                <Th label="Ação" active={false} />
                <Th label="ASC" active={false} />
                <Th label="Valor" active={orderBy === 'amount'} direction={orderDirection} onClick={() => toggleSort('amount')} />
                <Th label="Meses análise" active={false} />
                <th style={{ textAlign: 'left', padding: '10px 8px', borderBottom: '1px solid #e5e7eb', width: 260 }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {ui.loading ? (
                <tr><td colSpan={6} style={{ padding: 16, color: '#6b7280' }}>A carregar…</td></tr>
              ) : viewItems.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: 16, color: '#6b7280' }}>Sem ações para mostrar.</td></tr>
              ) : (
                viewItems.map((it) => (
                  <tr key={it.id}>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6' }}>{formatDate(it.created_at)}</td>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6' }}>{formatDate(it.data_implementacao)}</td>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6' }}>{it.accoes || '-'}</td>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6' }}>{resolveAsc(it.asc_id)}</td>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6' }}>{formatMoney(it.amount)}</td>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6' }}>{it.meses_analise != null ? String(it.meses_analise) : '-'}</td>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6', display: 'flex', gap: 8 }}>
                      <Button variant="secondary" onClick={() => openDetails(it.id)}>Ver detalhes</Button>
                      <Button variant="secondary" onClick={() => openEdit(it.id)}>Editar</Button>
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

function formatDate(iso?: string) {
  if (!iso) return '-'
  try { const d = new Date(iso as any); if (Number.isNaN(d.getTime())) return '-'; return d.toLocaleDateString('pt-PT') } catch { return '-' }
}
