import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Card, Pagination } from '../components'
import { useAuth } from '../contexts/AuthContext'
import { InfractionApi, SectorInfracaoApi, TipoInfracaoApi, type ModelInfraction, type ModelSectorInfracao, type ModelTipoInfracao } from '../services'
import { BORDER_COLOR, RADIUS, SEMANTIC_COLORS, TEXT_PRIMARY } from '../utils/theme'

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
  const [filtersOpen, setFiltersOpen] = useState(false)

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
  useEffect(() => { setPage(1) }, [sectorId, tipoId, texto, dataInicio, dataFim, pageSize, orderBy, orderDirection])

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
        String((it as any).material?.name || (it as any).material_id || (it as any).tipo_material || ''),
      ]
      return fields.some((s) => (s || '').toLowerCase().includes(q))
    })
  }, [items, dataInicio, dataFim, texto, setores, tipos])

  const activeFilterCount = [
    sectorId,
    tipoId,
    texto.trim(),
    dataInicio,
    dataFim,
  ].filter(Boolean).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card
        title="Filtros"
        subtitle="Refine a listagem por sector, tipo, período e termo pesquisado."
        extra={
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button
              type="button"
              style={filtersOpen ? filterHeaderButtonActiveStyle : filterHeaderButtonStyle}
              onClick={() => setFiltersOpen((open) => !open)}
            >
              {filtersOpen ? 'Ocultar filtros' : 'Mostrar filtros'}
            </button>
            <button
              type="button"
              style={filterHeaderButtonStyle}
              onClick={() => { setSectorId(''); setTipoId(''); setTexto(''); setDataInicio(null); setDataFim(null); setOrderBy('created_at'); setOrderDirection('desc'); setPage(1) }}
            >
              Limpar filtros
            </button>
          </div>
        }
      >
        {filtersOpen ? (
          <div style={filtersGridStyle}>
            <label style={fieldGroupStyle}>
              <span style={fieldLabelStyle}>Sector</span>
              <select value={sectorId} onChange={(e) => setSectorId(e.target.value)} style={fieldControlStyle}>
                <option value="">Todos</option>
                {setores.map((s) => (<option key={s.id} value={s.id}>{s.name || s.id}</option>))}
              </select>
            </label>

            <label style={fieldGroupStyle}>
              <span style={fieldLabelStyle}>Tipo</span>
              <select value={tipoId} onChange={(e) => setTipoId(e.target.value)} style={fieldControlStyle}>
                <option value="">Todos</option>
                {tipos.map((t) => (<option key={t.id} value={t.id}>{t.name || t.id}</option>))}
              </select>
            </label>

            <label style={fieldGroupStyle}>
              <span style={fieldLabelStyle}>Pesquisar</span>
              <input
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Pesquisar por termo…"
                style={fieldControlStyle}
              />
            </label>

            <label style={fieldGroupStyle}>
              <span style={fieldLabelStyle}>Início</span>
              <input type="date" value={dataInicio ?? ''} onChange={(e) => setDataInicio(e.target.value || null)} style={fieldControlStyle} />
            </label>

            <label style={fieldGroupStyle}>
              <span style={fieldLabelStyle}>Fim</span>
              <input type="date" value={dataFim ?? ''} onChange={(e) => setDataFim(e.target.value || null)} style={fieldControlStyle} />
            </label>
          </div>
        ) : (
          <div style={collapsedFiltersHintStyle}>
            <span>Filtros recolhidos para dar mais foco aos resultados.</span>
            <span>{activeFilterCount > 0 ? `${activeFilterCount} filtro(s) ativo(s)` : 'Sem filtros ativos'}</span>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
          <span style={summaryChipStyle}>Resultados: {total.toLocaleString('pt-PT')}</span>
          <span style={summaryChipStyle}>Página: {page}/{totalPages}</span>
          {sectorId ? <span style={summaryChipStyle}>Sector: {resolveNome(setores, sectorId)}</span> : null}
          {tipoId ? <span style={summaryChipStyle}>Tipo: {resolveNome(tipos, tipoId)}</span> : null}
        </div>
        {ui.error ? <div style={{ background: '#fee2e2', color: '#991b1b', padding: 10, borderRadius: 8, marginTop: 10 }}>{ui.error}</div> : null}
      </Card>

      <Card
        title="Resultados"
        subtitle="Lista paginada e ordenável de infrações."
      >
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
                <th style={{ textAlign: 'left', padding: '12px 8px', borderBottom: '1px solid rgba(101, 74, 32, 0.12)', width: 260, color: '#3f4652' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {ui.loading ? (
                <tr><td colSpan={7} style={{ padding: 16, color: '#7b8494' }}>A carregar…</td></tr>
              ) : viewItems.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 16, color: '#7b8494' }}>Sem infrações para mostrar.</td></tr>
              ) : (
                viewItems.map((it) => (
                  <tr key={it.id}>
                    <td style={{ padding: '12px 8px', borderBottom: '1px solid rgba(101, 74, 32, 0.08)' }}>
                      <span style={dateBadgeStyle}>{formatDate(it.created_at)}</span>
                    </td>
                    <td style={{ padding: '12px 8px', borderBottom: '1px solid rgba(101, 74, 32, 0.08)' }}>{resolveNome(setores, it.sector_infracao_id)}</td>
                    <td style={{ padding: '12px 8px', borderBottom: '1px solid rgba(101, 74, 32, 0.08)' }}>{resolveNome(tipos, it.tipo_infracao_id)}</td>
                    <td style={{ padding: '12px 8px', borderBottom: '1px solid rgba(101, 74, 32, 0.08)' }}>{(it as any).material?.name || (it as any).material_id || (it as any).tipo_material || '-'}</td>
                    <td style={{ padding: '12px 8px', borderBottom: '1px solid rgba(101, 74, 32, 0.08)' }}>{it.quantidade != null ? String(it.quantidade) : '-'}</td>
                    <td style={{ padding: '12px 8px', borderBottom: '1px solid rgba(101, 74, 32, 0.08)' }}>
                      <span style={valueBadgeStyle}>{it.valor != null ? formatMoney(it.valor) : '-'}</span>
                    </td>
                    <td style={{ padding: '12px 8px', borderBottom: '1px solid rgba(101, 74, 32, 0.08)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <Button variant="secondary" onClick={() => { if (it.id) { window.history.pushState({}, '', `/infracoes/${it.id}`); window.dispatchEvent(new Event('locationchange')) } }}>Ver detalhes</Button>
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
    </div>
  )
}

function Th({ label, active, direction, onClick }: { label: string; active?: boolean; direction?: 'asc' | 'desc'; onClick?: () => void }) {
  return (
    <th
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default', userSelect: 'none', textAlign: 'left', padding: '12px 8px', borderBottom: '1px solid rgba(101, 74, 32, 0.12)', color: '#3f4652' }}
      title={onClick ? 'Ordenar' : undefined}
      aria-sort={active ? (direction === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <span>{label}</span>{' '}
      {active ? <span aria-hidden>{direction === 'asc' ? '▲' : '▼'}</span> : null}
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

const filtersGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 14,
  alignItems: 'end',
}

const fieldGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
}

const fieldLabelStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#7b8494',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '.06em',
}

const fieldControlStyle: React.CSSProperties = {
  minHeight: 46,
  padding: '0 14px',
  borderRadius: RADIUS.lg,
  border: `1px solid ${BORDER_COLOR}`,
  background: 'rgba(255, 255, 255, 0.95)',
  color: TEXT_PRIMARY,
  boxShadow: '0 10px 24px rgba(101, 74, 32, 0.05)',
}

const collapsedFiltersHintStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  flexWrap: 'wrap',
  minHeight: 52,
  padding: '14px 16px',
  borderRadius: 18,
  background: 'rgba(255, 252, 246, 0.9)',
  border: '1px dashed rgba(101, 74, 32, 0.18)',
  color: '#5f6673',
  fontSize: 14,
  fontWeight: 600,
}

const summaryChipStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  minHeight: 34,
  padding: '0 12px',
  borderRadius: 999,
  background: 'linear-gradient(180deg, #faf1e3 0%, #f5ead9 100%)',
  border: '1px solid rgba(101, 74, 32, 0.14)',
  color: '#5f6673',
  fontSize: 12,
  fontWeight: 700,
}

const dateBadgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  minHeight: 32,
  padding: '0 10px',
  borderRadius: 999,
  background: 'linear-gradient(180deg, rgba(255, 244, 230, 0.98) 0%, rgba(248, 231, 205, 0.92) 100%)',
  border: '1px solid rgba(201, 109, 31, 0.20)',
  color: '#8d4a17',
  fontSize: 12,
  fontWeight: 800,
  whiteSpace: 'nowrap',
}

const valueBadgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  minHeight: 32,
  padding: '0 12px',
  borderRadius: 999,
  background: 'rgba(22, 163, 74, 0.10)',
  color: SEMANTIC_COLORS.success,
  fontSize: 13,
  fontWeight: 800,
}

const filterHeaderButtonStyle: React.CSSProperties = {
  minHeight: 42,
  padding: '0 16px',
  borderRadius: 14,
  background: 'linear-gradient(180deg, #fffaf2 0%, #f6ecde 100%)',
  border: '1px solid rgba(101, 74, 32, 0.16)',
  color: '#8d4a17',
  fontWeight: 700,
  boxShadow: '0 8px 18px rgba(76, 57, 24, 0.08)',
  cursor: 'pointer',
}

const filterHeaderButtonActiveStyle: React.CSSProperties = {
  ...filterHeaderButtonStyle,
  border: '1px solid rgba(201, 109, 31, 0.28)',
  background: 'linear-gradient(180deg, rgba(255, 244, 230, 0.98) 0%, rgba(248, 231, 205, 0.92) 100%)',
  color: '#8d4a17',
  boxShadow: '0 12px 24px rgba(76, 57, 24, 0.10)',
}
