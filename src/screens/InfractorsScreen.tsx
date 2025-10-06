import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Card, Heading, Text } from '../components'
import { useAuth } from '../contexts/AuthContext'
import { InfractorApi, type ModelInfractor } from '../services'

export default function InfractorsScreen() {
  const { getApiConfig, getAuthorizationHeaderValue, logout } = useAuth()
  const api = useMemo(() => new InfractorApi(getApiConfig()), [getApiConfig])
  const authHeader = useMemo(() => getAuthorizationHeaderValue(), [getAuthorizationHeaderValue])

  const [items, setItems] = useState<ModelInfractor[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [ui, setUi] = useState<{ loading: boolean; error: string | null }>({ loading: false, error: null })

  const [orderBy, setOrderBy] = useState<'created_at' | 'nome'>('created_at')
  const [orderDirection, setOrderDirection] = useState<'asc' | 'desc'>('desc')

  const [nome, setNome] = useState('')
  const [doc, setDoc] = useState('')

  const isUnauthorizedBody = (data: any) => { try { const raw = data?.code ?? data?.error?.code ?? data?.status ?? data?.error?.status ?? data?.error_code; if (raw == null) return false; const num = Number(raw); if (!Number.isNaN(num) && num === 401) return true; const code = String(raw).toUpperCase(); return code === 'UNAUTHORIZED' || code === 'UNAUTHENTICATED' } catch { return false } }

  const load = useCallback(async () => {
    setUi({ loading: true, error: null })
    try {
      const { data } = await api.privateInfractorsGet(authHeader, page, pageSize, orderBy, orderDirection, undefined, nome || undefined, doc || undefined)
      if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      setItems((data as any).items ?? [])
      setTotal((data as any).total ?? 0)
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 401 || isUnauthorizedBody(err?.response?.data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      setUi({ loading: false, error: !status ? 'Sem ligação ao servidor.' : status >= 500 ? 'Erro do servidor ao carregar infractores.' : 'Falha a obter infractores.' })
      return
    }
    setUi({ loading: false, error: null })
  }, [api, authHeader, page, pageSize, orderBy, orderDirection, nome, doc])

  useEffect(() => { load() }, [load])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  function toggleSort(key: 'created_at' | 'nome') {
    if (orderBy === key) setOrderDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setOrderBy(key); setOrderDirection('asc') }
  }

  function openDetails(id?: string) {
    if (!id) return
    window.history.pushState({}, '', `/infractores/${id}`)
    window.dispatchEvent(new Event('locationchange'))
  }
  function openEdit(id?: string) {
    if (!id) return
    window.history.pushState({}, '', `/infractores/${id}/editar`)
    window.dispatchEvent(new Event('locationchange'))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Heading level={2}>Infractores</Heading>

      <Card title="Filtros">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome" style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid #d1d5db', minWidth: 180 }} />
          <input value={doc} onChange={(e) => setDoc(e.target.value)} placeholder="Documento" style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid #d1d5db', minWidth: 180 }} />
          <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid #d1d5db', background: '#fff' }}>
            <option value={10}>10 por página</option>
            <option value={20}>20 por página</option>
            <option value={50}>50 por página</option>
          </select>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <Button variant="secondary" onClick={() => { setNome(''); setDoc(''); setOrderBy('created_at'); setOrderDirection('desc'); setPage(1) }}>Limpar</Button>
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
                <Th label="Nome" active={orderBy === 'nome'} direction={orderDirection} onClick={() => toggleSort('nome')} />
                <Th label="Documento" active={false} />
                <Th label="Tipo doc." active={false} />
                <th style={{ textAlign: 'left', padding: '10px 8px', borderBottom: '1px solid #e5e7eb', width: 260 }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {ui.loading ? (
                <tr><td colSpan={5} style={{ padding: 16, color: '#6b7280' }}>A carregar…</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: 16, color: '#6b7280' }}>Sem infractores para mostrar.</td></tr>
              ) : (
                items.map((it) => (
                  <tr key={it.id}>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6' }}>{formatDate(it.created_at)}</td>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6' }}>{it.nome || '-'}</td>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6' }}>{it.nr_identificacao || '-'}</td>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6' }}>{it.tipo_identificacao || '-'}</td>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6', display: 'flex', gap: 8 }}>
                      <Button variant="secondary" onClick={() => openDetails(it.id)}>Ver detalhes</Button>
                      <Button variant="secondary" onClick={() => openEdit(it.id)}>Editar</Button>
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
    <th
      onClick={onClick}
      style={{ textAlign: 'left', padding: '10px 8px', borderBottom: '1px solid #e5e7eb', cursor: onClick ? 'pointer' : 'default', whiteSpace: 'nowrap' }}
      title={onClick ? 'Ordenar' : undefined}
    >
      {label} {active ? (direction === 'asc' ? '▲' : '▼') : ''}
    </th>
  )
}

function formatDate(iso?: string) { if (!iso) return '-'; try { const d = new Date(iso); if (Number.isNaN(d.getTime())) return '-'; return d.toLocaleString('pt-PT') } catch { return '-' } }

