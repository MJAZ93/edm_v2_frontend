import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Card, Text } from '../components'
import { useAuth } from '../contexts/AuthContext'
import { InfractionApi, SectorInfracaoApi, TipoInfracaoApi, type ModelInfraction, type ModelSectorInfracao, type ModelTipoInfracao } from '../services'

export default function InfractionsScreen() {
  const { getApiConfig, getAuthorizationHeaderValue, logout } = useAuth()
  const api = useMemo(() => new InfractionApi(getApiConfig()), [getApiConfig])
  const sectorApi = useMemo(() => new SectorInfracaoApi(getApiConfig()), [getApiConfig])
  const tipoApi = useMemo(() => new TipoInfracaoApi(getApiConfig()), [getApiConfig])
  const authHeader = useMemo(() => getAuthorizationHeaderValue(), [getAuthorizationHeaderValue])

  const [items, setItems] = useState<ModelInfraction[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [ui, setUi] = useState<{ loading: boolean; error: string | null }>({ loading: false, error: null })

  const [orderBy, setOrderBy] = useState<'created_at' | 'valor' | 'quantidade'>('created_at')
  const [orderDirection, setOrderDirection] = useState<'asc' | 'desc'>('desc')

  const [sectorId, setSectorId] = useState('')
  const [tipoId, setTipoId] = useState('')
  const [texto, setTexto] = useState('')
  const [dataInicio, setDataInicio] = useState<string | null>(null)
  const [dataFim, setDataFim] = useState<string | null>(null)
  const [setores, setSetores] = useState<ModelSectorInfracao[]>([])
  const [tipos, setTipos] = useState<ModelTipoInfracao[]>([])

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
      const { data } = await api.privateInfractionsGet(
        authHeader,
        page,
        pageSize,
        orderBy,
        orderDirection,
        tipoId || undefined,
        sectorId || undefined
      )
      if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      setItems((data as any).items ?? [])
      setTotal((data as any).total ?? 0)
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 401 || isUnauthorizedBody(err?.response?.data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      setUi({ loading: false, error: !status ? 'Sem ligação ao servidor.' : status >= 500 ? 'Erro do servidor ao carregar infrações.' : 'Falha a obter infrações.' })
      return
    }
    setUi({ loading: false, error: null })
  }, [api, authHeader, page, pageSize, orderBy, orderDirection, sectorId, tipoId, texto, dataInicio, dataFim])

  useEffect(() => { load() }, [load])

  useEffect(() => { (async () => { try { const { data } = await sectorApi.privateSectorInfracaoGet(authHeader, -1, undefined, 'name', 'asc'); if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return } setSetores((data as any).items ?? []) } catch {} })() }, [sectorApi, authHeader])
  useEffect(() => { (async () => { try { const { data } = await tipoApi.privateTiposInfracaoGet(authHeader, -1, undefined, 'name', 'asc'); if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return } setTipos((data as any).items ?? []) } catch {} })() }, [tipoApi, authHeader])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  function toggleSort(key: 'created_at' | 'valor' | 'quantidade') {
    if (orderBy === key) setOrderDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setOrderBy(key); setOrderDirection('asc') }
  }

  const resolveNome = (arr: { id?: string; name?: string }[], id?: string) => {
    if (!id) return '-'
    const it = arr.find((x) => x.id === id)
    return it?.name || id
  }

  const viewItems = useMemo(() => {
    const startTs = dataInicio ? Date.parse(dataInicio) : null
    const endTs = dataFim ? Date.parse(dataFim) : null
    const q = texto.trim().toLowerCase()
    return items.filter((it) => {
      // local date filter on created_at
      const t = it.created_at ? Date.parse(String(it.created_at)) : null
      if (startTs && (t == null || t < startTs)) return false
      if (endTs) {
        const endOfDay = endTs + 24 * 60 * 60 * 1000
        if (t == null || t >= endOfDay) return false
      }
      if (!q) return true
      const fields = [
        resolveNome(setores, it.sector_infracao_id),
        resolveNome(tipos, it.tipo_infracao_id),
        String((it as any).material?.name || (it as any).material_id || it.tipo_material || ''),
      ]
      return fields.some((s) => (s || '').toLowerCase().includes(q))
    })
  }, [items, dataInicio, dataFim, texto, setores, tipos])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card title="Filtros">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <select value={sectorId} onChange={(e) => setSectorId(e.target.value)} style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid #d1d5db', background: '#fff' }}>
            <option value="">Sector (todos)</option>
            {setores.map((s) => (<option key={s.id} value={s.id}>{s.name || s.id}</option>))}
          </select>
          <select value={tipoId} onChange={(e) => setTipoId(e.target.value)} style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid #d1d5db', background: '#fff' }}>
            <option value="">Tipo (todos)</option>
            {tipos.map((t) => (<option key={t.id} value={t.id}>{t.name || t.id}</option>))}
          </select>
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Pesquisar por termo…"
            style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid #d1d5db', minWidth: 220 }}
          />
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, color: '#374151' }}>Início</span>
            <input type="date" value={dataInicio ?? ''} onChange={(e) => setDataInicio(e.target.value || null)} style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid #d1d5db' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, color: '#374151' }}>Fim</span>
            <input type="date" value={dataFim ?? ''} onChange={(e) => setDataFim(e.target.value || null)} style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid #d1d5db' }} />
          </label>
          <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid #d1d5db', background: '#fff' }}>
            <option value={10}>10 por página</option>
            <option value={20}>20 por página</option>
            <option value={50}>50 por página</option>
          </select>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <Button variant="secondary" onClick={() => { setSectorId(''); setTipoId(''); setTexto(''); setDataInicio(null); setDataFim(null); setOrderBy('created_at'); setOrderDirection('desc'); setPage(1) }}>Limpar</Button>
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
                <Th label="Sector" active={false} />
                <Th label="Tipo" active={false} />
                <Th label="Material" active={false} />
                <Th label="Quantidade" active={orderBy === 'quantidade'} direction={orderDirection} onClick={() => toggleSort('quantidade')} />
                <Th label="Valor" active={orderBy === 'valor'} direction={orderDirection} onClick={() => toggleSort('valor')} />
                <th style={{ textAlign: 'left', padding: '10px 8px', borderBottom: '1px solid #e5e7eb', width: 260 }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {ui.loading ? (
                <tr><td colSpan={6} style={{ padding: 16, color: '#6b7280' }}>A carregar…</td></tr>
              ) : viewItems.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: 16, color: '#6b7280' }}>Sem infrações para mostrar.</td></tr>
              ) : (
                viewItems.map((it) => (
                  <tr key={it.id}>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6' }}>{formatDate(it.created_at)}</td>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6' }}>{resolveNome(setores, it.sector_infracao_id)}</td>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6' }}>{resolveNome(tipos, it.tipo_infracao_id)}</td>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6' }}>{(it as any).material?.name || (it as any).material_id || it.tipo_material || '-'}</td>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6' }}>{it.quantidade != null ? String(it.quantidade) : '-'}</td>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6' }}>{it.valor != null ? formatMoney(it.valor) : '-'}</td>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6', display: 'flex', gap: 8 }}>
                      <Button variant="secondary" onClick={() => { if (it.id) { window.history.pushState({}, '', `/infracoes/${it.id}`); window.dispatchEvent(new Event('locationchange')) } }}>Ver detalhes</Button>
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

function formatDate(iso?: string) {
  if (!iso) return '-'
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return '-'
    return d.toLocaleString('pt-PT')
  } catch { return '-'}
}

function formatMoney(n?: number) {
  if (typeof n !== 'number' || Number.isNaN(n)) return '-'
  try { return `${n.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT` } catch { return `${n.toFixed(2)} MT` }
}
