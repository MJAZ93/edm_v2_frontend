import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Card, Heading, Text, Pagination } from '../components'
import { useAuth } from '../contexts/AuthContext'
import { InstallationsApi, RegiaoApi, ModelInstallation } from '../services'

export default function ClientesScreen() {
  const { getApiConfig, getAuthorizationHeaderValue, logout } = useAuth()
  const api = useMemo(() => new InstallationsApi(getApiConfig()), [getApiConfig])
  const regiaoApi = useMemo(() => new RegiaoApi(getApiConfig()), [getApiConfig])
  const authHeader = useMemo(() => getAuthorizationHeaderValue(), [getAuthorizationHeaderValue])

  const [items, setItems] = useState<ModelInstallation[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [ui, setUi] = useState<{ loading: boolean; error: string | null }>({ loading: false, error: null })

  const [orderBy, setOrderBy] = useState<'mes' | 'score' | 'compras_6_meses'>('mes')
  const [orderDirection, setOrderDirection] = useState<'asc' | 'desc'>('desc')

  // Filtros
  const [texto, setTexto] = useState('')
  const [pf, setPf] = useState('')
  const [nome, setNome] = useState('')
  const [regiaoId, setRegiaoId] = useState('')
  const [tendencia, setTendencia] = useState('')
  const [acaoCorrente, setAcaoCorrente] = useState<'sim' | 'nao' | ''>('')
  const [regioes, setRegioes] = useState<Array<{ id?: string; name?: string }>>([])

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
      const { data } = await api.privateInstallationsGet(
        authHeader,
        page,
        pageSize,
        orderBy,
        orderDirection,
        pf || undefined,
        regiaoId || undefined,
        undefined,
        undefined,
        acaoCorrente === 'nao' ? true : undefined,
        nome || undefined,
        tendencia || undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined
      )
      if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      setItems(((data as any)?.items) ?? [])
      setTotal(Number((data as any)?.total ?? 0))
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 401 || isUnauthorizedBody(err?.response?.data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      setUi({ loading: false, error: !status ? 'Sem ligação ao servidor.' : status >= 500 ? 'Erro do servidor ao carregar instalações.' : 'Falha a obter instalações.' })
      return
    }
    setUi({ loading: false, error: null })
  }, [api, authHeader, page, pageSize, orderBy, orderDirection, pf, regiaoId, nome, tendencia, acaoCorrente])

  useEffect(() => { load() }, [load])
  useEffect(() => { (async () => { try { const { data } = await regiaoApi.privateRegioesGet(authHeader, -1, undefined, 'name', 'asc'); if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return } setRegioes(((data as any)?.items) ?? []) } catch {} })() }, [regiaoApi, authHeader])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  function toggleSort(key: 'mes' | 'score' | 'compras_6_meses') {
    if (orderBy === key) setOrderDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setOrderBy(key); setOrderDirection('asc') }
    setPage(1)
  }

  const viewItems = useMemo(() => {
    const q = texto.trim().toLowerCase()
    const base = items.filter((it) => {
      if (acaoCorrente === 'sim' && !(it as any).has_current_accao) return false
      if (acaoCorrente === 'nao' && (it as any).has_current_accao) return false
      return true
    })
    if (!q) return base
    return base.filter((it) => {
      const fields = [it.pf || '', it.nome || '', it.pt_name || '', (it as any).asc_name || '']
      return fields.some((s) => String(s).toLowerCase().includes(q))
    })
  }, [items, texto, acaoCorrente])

  const sortedItems = useMemo(() => {
    const arr = [...viewItems]
    const dir = orderDirection === 'asc' ? 1 : -1
    arr.sort((a, b) => {
      let av: any
      let bv: any
      if (orderBy === 'mes') {
        const at = a.mes ? Date.parse(String(a.mes)) : 0
        const bt = b.mes ? Date.parse(String(b.mes)) : 0
        av = at; bv = bt
      } else if (orderBy === 'compras_6_meses') {
        av = (a.compras_6_meses ?? 0)
        bv = (b.compras_6_meses ?? 0)
      } else {
        av = (a.score ?? 0)
        bv = (b.score ?? 0)
      }
      if (av < bv) return -1 * dir
      if (av > bv) return 1 * dir
      return 0
    })
    return arr
  }, [viewItems, orderBy, orderDirection])

  function abrirDetalhes(it: ModelInstallation) {
    const pfv = it.pf
    const mes = it.mes
    if (!pfv || !mes) return
    const url = `/instalacoes/${encodeURIComponent(pfv)}?mes=${encodeURIComponent(String(mes))}`
    window.history.pushState({}, '', url)
    window.dispatchEvent(new Event('locationchange'))
  }

  function limparFiltros() {
    setTexto('')
    setPf('')
    setNome('')
    setRegiaoId('')
    setTendencia('')
    setAcaoCorrente('')
    setOrderBy('mes')
    setOrderDirection('desc')
    setPage(1)
  }

  const resolveRegiao = (id?: string) => { const it = regioes.find((r) => r.id === id); return it?.name || id || '-' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Heading level={2}>Clientes</Heading>

      <Card title="Filtros">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Pesquisar por PF/Nome/PT" style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid #d1d5db', flex: '1 1 240px' }} />
          <input value={pf} onChange={(e) => setPf(e.target.value)} placeholder="PF" style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid #d1d5db', width: 160 }} />
          <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome" style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid #d1d5db', flex: '1 1 220px' }} />
          <select value={regiaoId} onChange={(e) => setRegiaoId(e.target.value)} style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid #d1d5db' }}>
            <option value="">Todas as regiões</option>
            {regioes.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
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
          <select value={acaoCorrente} onChange={(e) => setAcaoCorrente(e.target.value as any)} style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid #d1d5db' }}>
            <option value="">Ação corrente?</option>
            <option value="sim">Sim</option>
            <option value="nao">Não</option>
          </select>
          <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid #d1d5db' }}>
            <option value={10}>10 por página</option>
            <option value={20}>20 por página</option>
            <option value={50}>50 por página</option>
          </select>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <Button variant="secondary" onClick={limparFiltros}>Limpar</Button>
            <Button onClick={() => { setPage(1); load() }}>Aplicar</Button>
          </div>
        </div>
        {ui.error ? <div style={{ background: '#fee2e2', color: '#991b1b', padding: 10, borderRadius: 8, marginTop: 10 }}>{ui.error}</div> : null}
      </Card>

      <Card>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <Th label="Mês" active={orderBy === 'mes'} direction={orderDirection} onClick={() => toggleSort('mes')} />
                <Th label="PF" />
                <Th label="Nome" />
                <Th label="ASC" />
                <Th label="PT" />
                <Th label="Compras (6m)" active={orderBy === 'compras_6_meses'} direction={orderDirection} onClick={() => toggleSort('compras_6_meses')} />
                <Th label="Consumo Calculado (6m)" />
                <Th label="Score" active={orderBy === 'score'} direction={orderDirection} onClick={() => toggleSort('score')} />
                <Th label="Tendência" />
                <Th label="Ação corrente?" />
                <th style={{ textAlign: 'left', padding: '10px 8px', borderBottom: '1px solid #e5e7eb', width: 200 }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {ui.loading ? (
                <tr><td colSpan={11} style={{ padding: 16, color: '#6b7280' }}>A carregar…</td></tr>
              ) : viewItems.length === 0 ? (
                <tr><td colSpan={11} style={{ padding: 16, color: '#6b7280' }}>Sem instalações para mostrar.</td></tr>
              ) : (
                sortedItems.map((it, idx) => {
                  const compras = it.compras_6_meses ?? 0
                  const consumo = (it as any).equipamentos_6_meses ?? 0
                  const highlight = (compras == null || compras === 0) ? (consumo > 0) : (consumo > compras * 1.5)
                  const trend = it.tendencia_compras as any
                  const trendStyle = getTrendStyle(trend)
                  return (
                  <tr key={`${it.pf}-${it.mes}-${idx}`} style={{ background: highlight ? '#fef2f2' : undefined }}>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6' }}>{formatMonth(it.mes)}</td>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6' }}>{it.pf || '-'}</td>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6' }}>{it.nome || '-'}</td>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6' }}>{(it as any).asc_name || '-'}</td>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6' }}>{it.pt_name || it.pt_id || '-'}</td>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6' }}>{formatKwh(it.compras_6_meses)}</td>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6' }}>{formatKwh((it as any).equipamentos_6_meses)}</td>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6' }}>{formatPercent(it.score)}</td>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6', color: trendStyle.color }}>{formatTendencia(it.tendencia_compras)}</td>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6' }}>{(it as any).has_current_accao ? 'Sim' : 'Não'}</td>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6', display: 'flex', gap: 8 }}>
                      <Button variant="secondary" onClick={() => abrirDetalhes(it)} disabled={!it.pf || !it.mes}>Ver detalhes</Button>
                    </td>
                  </tr>
                )})
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
          showQuickJump={true}
          showFirstLast={true}
        />
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

function formatNumber(n?: number) { return typeof n === 'number' && !Number.isNaN(n) ? String(n) : '-' }
function formatKwh(n?: number) {
  if (typeof n !== 'number' || Number.isNaN(n)) return '-'
  try { return `${n.toLocaleString('pt-PT')} kWh` } catch { return `${n} kWh` }
}
function formatPercent(n?: number) {
  if (typeof n !== 'number' || Number.isNaN(n)) return '-'
  const v = n * 100
  try { return `${v.toLocaleString('pt-PT', { maximumFractionDigits: 1 })}%` } catch { return `${v.toFixed(1)}%` }
}
function formatMonth(iso?: string) { if (!iso) return '-'; try { const d = new Date(iso as any); if (Number.isNaN(d.getTime())) return '-'; return d.toLocaleDateString('pt-PT', { year: 'numeric', month: '2-digit' }) } catch { return '-' } }
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
function getTrendStyle(t?: any) {
  const v = String(t || '')
  // cores suaves
  if (v === 'CRESCENTE' || v === 'MUITO_CRESCENTE') return { color: '#047857' } // verde suave
  if (v === 'NORMAL' || v === 'SEM_COMPRAS') return { color: '#6b7280' } // neutro
  if (v === 'DECRESCENTE' || v === 'MUITO_DECRESCENTE') return { color: '#b91c1c' } // vermelho suave
  return { color: '#6b7280' }
}
