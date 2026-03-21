import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Card, Button, Text, Pagination } from '../components'
import { MapPicker } from '../components/ui/MapPicker'
import { OccurrenceApi, RegiaoApi, ASCApi, FormaConhecimentoApi, SectorInfracaoApi, TipoInfracaoApi, DirecaoTransportesApi, type ModelOccurrence, type OccurrenceCreateOccurrenceRequest, type OccurrenceUpdateOccurrenceRequest, type OccurrenceCreateOccurrenceInfraction, type OccurrenceCreateOccurrenceInfractor, type ModelRegiao, type ModelASC, type ModelFormaConhecimento, type ModelSectorInfracao, type ModelTipoInfracao, type ModelDirecaoTransportes } from '../services'
import { useAuth } from '../contexts/AuthContext'

type UiState = { loading: boolean; error: string | null }

type OcorrenciasListState = {
  texto: string
  regiaoId: string
  ascId: string
  formaConhecimentoId: string
  direcaoTransportesId: string
  dataInicio: string | null
  dataFim: string | null
  page: number
  pageSize: number
  orderBy: 'created_at' | 'data_facto' | 'local'
  orderDirection: 'asc' | 'desc'
}

export default function OcorrenciasScreen() {
  const initialListState = useMemo(() => readOcorrenciasListStateFromUrl(), [])
  const didMountRef = useRef(false)
  const { getApiConfig, getAuthorizationHeaderValue, logout } = useAuth()
  const api = useMemo(() => new OccurrenceApi(getApiConfig()), [getApiConfig])
  const regiaoApi = useMemo(() => new RegiaoApi(getApiConfig()), [getApiConfig])
  const ascApi = useMemo(() => new ASCApi(getApiConfig()), [getApiConfig])
  const formaApi = useMemo(() => new FormaConhecimentoApi(getApiConfig()), [getApiConfig])
  const sectorApi = useMemo(() => new SectorInfracaoApi(getApiConfig()), [getApiConfig])
  const tipoApi = useMemo(() => new TipoInfracaoApi(getApiConfig()), [getApiConfig])
  const authHeader = useMemo(() => getAuthorizationHeaderValue(), [getAuthorizationHeaderValue])
  const direcaoApi = useMemo(() => new DirecaoTransportesApi(getApiConfig()), [getApiConfig])

  const [items, setItems] = useState<ModelOccurrence[]>([])
  const [page, setPage] = useState(initialListState.page)
  const [pageSize, setPageSize] = useState(initialListState.pageSize)
  const [total, setTotal] = useState(0)
  const [ui, setUi] = useState<UiState>({ loading: false, error: null })

  const [orderBy, setOrderBy] = useState<'created_at' | 'data_facto' | 'local'>(initialListState.orderBy)
  const [orderDirection, setOrderDirection] = useState<'asc' | 'desc'>(initialListState.orderDirection)

  const [texto, setTexto] = useState(initialListState.texto)
  const [regiaoId, setRegiaoId] = useState(initialListState.regiaoId)
  const [ascId, setAscId] = useState(initialListState.ascId)
  const [formaConhecimentoId, setFormaConhecimentoId] = useState(initialListState.formaConhecimentoId)
  const [direcaoTransportesId, setDirecaoTransportesId] = useState(initialListState.direcaoTransportesId)
  const [dataInicio, setDataInicio] = useState<string | null>(initialListState.dataInicio)
  const [dataFim, setDataFim] = useState<string | null>(initialListState.dataFim)

  const [regioes, setRegioes] = useState<ModelRegiao[]>([])
  const [ascs, setAscs] = useState<ModelASC[]>([])
  const [formas, setFormas] = useState<ModelFormaConhecimento[]>([])
  const [setores, setSetores] = useState<ModelSectorInfracao[]>([])
  const [tiposInf, setTiposInf] = useState<ModelTipoInfracao[]>([])
  const [direcoes, setDirecoes] = useState<ModelDirecaoTransportes[]>([])

  // Edição passa a acontecer numa tela própria; removido modal inline
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
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

  function toRfc3339(d?: string | null): string | undefined {
    if (!d) return undefined
    try { return new Date(`${d}T00:00:00Z`).toISOString() } catch { return undefined }
  }
  function toRfc3339End(d?: string | null): string | undefined {
    if (!d) return undefined
    try { return new Date(`${d}T23:59:59Z`).toISOString() } catch { return undefined }
  }

  const load = useCallback(async () => {
    setUi({ loading: true, error: null })
    try {
      const { data } = await api.privateOccurrencesGet(
        authHeader,
        page,
        pageSize,
        orderBy,
        orderDirection,
        regiaoId || undefined,
        ascId || undefined,
        direcaoTransportesId || undefined,
        formaConhecimentoId || undefined,
        undefined,
        toRfc3339(dataInicio),
        toRfc3339End(dataFim),
        texto || undefined,
        undefined,
        undefined
      )
      if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      setItems(data.items ?? [])
      setTotal(data.total ?? 0)
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 401 || isUnauthorizedBody(err?.response?.data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      const msg = !status ? 'Sem ligação ao servidor.' : status >= 500 ? 'Erro do servidor ao carregar ocorrências.' : 'Falha a obter ocorrências.'
      setUi({ loading: false, error: msg })
      return
    }
    setUi({ loading: false, error: null })
  }, [api, authHeader, page, pageSize, orderBy, orderDirection, regiaoId, ascId, direcaoTransportesId, formaConhecimentoId, dataInicio, dataFim, texto])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('created') === '1') return
    const search = buildOcorrenciasListSearch({
      texto,
      regiaoId,
      ascId,
      formaConhecimentoId,
      direcaoTransportesId,
      dataInicio,
      dataFim,
      page,
      pageSize,
      orderBy,
      orderDirection,
    })
    const nextUrl = `${window.location.pathname}${search}`
    const currentUrl = `${window.location.pathname}${window.location.search}`
    if (nextUrl !== currentUrl) {
      window.history.replaceState(window.history.state, '', nextUrl)
    }
  }, [texto, regiaoId, ascId, formaConhecimentoId, direcaoTransportesId, dataInicio, dataFim, page, pageSize, orderBy, orderDirection])

  // Mensagem de sucesso ao voltar da criação
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search)
      if (sp.get('created') === '1') {
        setFlash('Ocorrência criada com sucesso.')
        const nextSearch = stripCreatedParamFromSearch(window.location.search)
        window.history.replaceState({}, '', `${window.location.pathname}${nextSearch}`)
        window.setTimeout(() => setFlash(null), 5000)
      }
    } catch {}
  }, [])

  const loadRegioes = useCallback(async () => {
    try {
      const { data } = await regiaoApi.privateRegioesGet(authHeader, 1, 200, 'name', 'asc')
      if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      setRegioes(data.items ?? [])
    } catch {}
  }, [regiaoApi, authHeader])

  const loadAscs = useCallback(async () => {
    try {
      const { data } = await ascApi.privateAscsGet(authHeader, 1, 200, 'name', 'asc', undefined, regiaoId || undefined)
      if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      setAscs(data.items ?? [])
    } catch {}
  }, [ascApi, authHeader, regiaoId])

  const loadDirecoes = useCallback(async () => {
    try {
      const { data } = await direcaoApi.privateDirecaoTransportesGet(authHeader, 1, 200, 'name', 'asc')
      if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      setDirecoes(data.items ?? [])
    } catch {}
  }, [direcaoApi, authHeader])

  const loadFormas = useCallback(async () => {
    try {
      const { data } = await formaApi.privateFormaConhecimentosGet(authHeader, 1, 200, 'name', 'asc')
      if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      setFormas(data.items ?? [])
    } catch {}
  }, [formaApi, authHeader])

  useEffect(() => { loadRegioes() }, [loadRegioes])
  useEffect(() => { loadAscs() }, [loadAscs])
  useEffect(() => { loadDirecoes() }, [loadDirecoes])
  useEffect(() => { loadFormas() }, [loadFormas])
  useEffect(() => { (async () => {
    try {
      const { data } = await sectorApi.privateSectorInfracaoGet(authHeader, 1, 200, 'name', 'asc')
      if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      setSetores(data.items ?? [])
    } catch {}
  })() }, [sectorApi, authHeader])
  useEffect(() => { (async () => {
    try {
      const { data } = await tipoApi.privateTiposInfracaoGet(authHeader, 1, 200, 'name', 'asc')
      if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      setTiposInf(data.items ?? [])
    } catch {}
  })() }, [tipoApi, authHeader])

  // Reinicia página quando filtros/ordenacao mudam
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true
      return
    }
    setPage(1)
  }, [texto, regiaoId, ascId, direcaoTransportesId, formaConhecimentoId, dataInicio, dataFim, pageSize, orderBy, orderDirection])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const activeFilterCount = [texto, regiaoId, ascId, direcaoTransportesId, formaConhecimentoId, dataInicio, dataFim].filter(Boolean).length

  function toggleSort(key: 'created_at' | 'data_facto' | 'local') {
    if (orderBy === key) setOrderDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setOrderBy(key); setOrderDirection('asc') }
  }

  async function handleCreate(input: OccurrenceCreateOccurrenceRequest) {
    setSubmitting(true); setSubmitError(null)
    try {
      const { data } = await api.privateOccurrencesPost(authHeader, input)
      if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      await load()
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 401 || isUnauthorizedBody(err?.response?.data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      setSubmitError(status === 400 ? 'Dados inválidos.' : !status ? 'Sem ligação ao servidor.' : 'Falha ao criar ocorrência.')
    } finally { setSubmitting(false) }
  }

  // handleUpdate removido; edição será tratada em OcorrenciaEditScreen

  async function handleDelete(id: string) {
    try {
      await api.privateOccurrencesIdDelete(id, authHeader)
      setPendingDeleteId(null)
      setDeleteError(null)
      await load()
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 401 || isUnauthorizedBody(err?.response?.data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      setDeleteError(!status ? 'Sem ligação ao servidor.' : status >= 500 ? 'Erro do servidor ao eliminar.' : 'Falha ao eliminar ocorrência.')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card
        title="Filtros"
        subtitle="Refine as ocorrências por termo, território, origem de conhecimento e período."
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
              onClick={() => { setTexto(''); setRegiaoId(''); setAscId(''); setDirecaoTransportesId(''); setFormaConhecimentoId(''); setDataInicio(null); setDataFim(null); setPage(1) }}
            >
              Limpar filtros
            </button>
          </div>
        }
      >
        {filtersOpen ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 14,
              alignItems: 'end'
            }}
          >
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 12, color: '#7b8494', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>Pesquisar</span>
              <input
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Pesquisar por termo…"
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 12, color: '#7b8494', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>Região</span>
              <select value={regiaoId} onChange={(e) => { setRegiaoId(e.target.value); setAscId('') }}>
                <option value="">Todas</option>
                {regioes.map((r) => (
                  <option key={r.id} value={r.id}>{r.name || r.id}</option>
                ))}
              </select>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 12, color: '#7b8494', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>ASC</span>
              <select value={ascId} onChange={(e) => setAscId(e.target.value)}>
                <option value="">Todas</option>
                {ascs.map((a) => (
                  <option key={a.id} value={a.id}>{a.name || a.id}</option>
                ))}
              </select>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 12, color: '#7b8494', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>Direção de Produção</span>
              <select value={direcaoTransportesId} onChange={(e) => setDirecaoTransportesId(e.target.value)}>
                <option value="">Todas</option>
                {direcoes.map((d) => (
                  <option key={d.id} value={d.id}>{d.name || d.id}</option>
                ))}
              </select>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 12, color: '#7b8494', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>Forma de conhecimento</span>
              <select value={formaConhecimentoId} onChange={(e) => setFormaConhecimentoId(e.target.value)}>
                <option value="">Todas</option>
                {formas.map((f) => (
                  <option key={f.id} value={f.id}>{f.name || f.id}</option>
                ))}
              </select>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 12, color: '#7b8494', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>Início</span>
              <input type="date" value={dataInicio ?? ''} onChange={(e) => setDataInicio(e.target.value || null)} />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 12, color: '#7b8494', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>Fim</span>
              <input type="date" value={dataFim ?? ''} onChange={(e) => setDataFim(e.target.value || null)} />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 12, color: '#7b8494', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>Itens por página</span>
              <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </label>
          </div>
        ) : (
          <div style={collapsedFiltersHintStyle}>
            <span>Filtros recolhidos para dar mais espaço à listagem.</span>
            <span>{activeFilterCount > 0 ? `${activeFilterCount} filtro(s) ativo(s)` : 'Sem filtros ativos'}</span>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
          <span style={occChipStyle}>Resultados: {total.toLocaleString('pt-PT')}</span>
          <span style={occChipStyle}>Página: {page}/{totalPages}</span>
          {regiaoId ? <span style={occChipStyle}>Região: {resolveNome(regioes, regiaoId)}</span> : null}
          {ascId ? <span style={occChipStyle}>ASC: {resolveNome(ascs, ascId)}</span> : null}
        </div>

        {ui.error ? <div style={{ background: '#fee2e2', color: '#991b1b', padding: 10, borderRadius: 8, marginTop: 10 }}>{ui.error}</div> : null}
        {flash ? <div style={{ background: '#ecfdf5', color: '#065f46', padding: 10, borderRadius: 8, marginTop: 10 }}>{flash}</div> : null}
      </Card>

      <Card title="Resultados" subtitle="Lista paginada e ordenável de ocorrências.">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <Th label="Data do facto" active={orderBy === 'data_facto'} direction={orderDirection} onClick={() => toggleSort('data_facto')} />
                <Th label="Local" active={orderBy === 'local'} direction={orderDirection} onClick={() => toggleSort('local')} />
                <Th label="Região" active={false} />
                <Th label="ASC" active={false} />
                <Th label="Direção de Produção" active={false} />
                <Th label="Criado em" active={orderBy === 'created_at'} direction={orderDirection} onClick={() => toggleSort('created_at')} />
                <th style={{ textAlign: 'left', padding: '12px 8px', borderBottom: '1px solid rgba(101, 74, 32, 0.12)', width: 260, color: '#3f4652' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {ui.loading ? (
                <tr><td colSpan={7} style={{ padding: 16, color: '#7b8494' }}>A carregar…</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 16, color: '#7b8494' }}>Sem ocorrências para mostrar.</td></tr>
              ) : (
                items.map((o) => (
                  <tr key={o.id}>
                    <td style={{ padding: '12px 8px', borderBottom: '1px solid rgba(101, 74, 32, 0.08)' }}>
                      <span style={occDateBadgeStyle}>{formatDate(o.data_facto)}</span>
                    </td>
                    <td style={{ padding: '12px 8px', borderBottom: '1px solid rgba(101, 74, 32, 0.08)' }}>{o.local || '-'}</td>
                    <td style={{ padding: '12px 8px', borderBottom: '1px solid rgba(101, 74, 32, 0.08)' }}>{resolveNome(regioes, o.regiao_id)}</td>
                    <td style={{ padding: '12px 8px', borderBottom: '1px solid rgba(101, 74, 32, 0.08)' }}>{resolveNome(ascs, o.asc_id)}</td>
                    <td style={{ padding: '12px 8px', borderBottom: '1px solid rgba(101, 74, 32, 0.08)' }}>{resolveNome(direcoes, o.direcao_transportes_id)}</td>
                    <td style={{ padding: '12px 8px', borderBottom: '1px solid rgba(101, 74, 32, 0.08)' }}>{formatDate(o.created_at)}</td>
                    <td style={{ padding: '12px 8px', borderBottom: '1px solid rgba(101, 74, 32, 0.08)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <ActionIconButton
                        label="Ver detalhes"
                        variant="secondary"
                        onClick={() => {
                          if (o.id) {
                            window.history.pushState({}, '', `/ocorrencias/${o.id}${window.location.search}`)
                            window.dispatchEvent(new Event('locationchange'))
                          }
                        }}
                      >
                        <EyeIcon />
                      </ActionIconButton>
                      <ActionIconButton
                        label="Editar"
                        variant="secondary"
                        onClick={() => {
                          if (o.id) {
                            window.history.pushState({}, '', `/ocorrencias/${o.id}/editar${window.location.search}`)
                            window.dispatchEvent(new Event('locationchange'))
                          }
                        }}
                      >
                        <PencilIcon />
                      </ActionIconButton>
                      <ActionIconButton
                        label="Eliminar"
                        variant="danger"
                        onClick={() => { setDeleteError(null); setPendingDeleteId(o.id || null) }}
                      >
                        <TrashIcon />
                      </ActionIconButton>
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

      {pendingDeleteId ? (
        <DeleteConfirmModal
          loading={ui.loading}
          error={deleteError}
          onCancel={() => { setPendingDeleteId(null); setDeleteError(null) }}
          onConfirm={() => handleDelete(pendingDeleteId)}
        />
      ) : null}

      {/* Edição deslocada para OcorrenciaEditScreen (rota dedicada) */}
    </div>
  )
}

function Th({ label, active, direction, onClick }: { label: string; active: boolean; direction?: 'asc' | 'desc'; onClick?: () => void }) {
  return (
    <th
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default', userSelect: 'none', textAlign: 'left', padding: '12px 8px', borderBottom: '1px solid rgba(101, 74, 32, 0.12)', color: '#3f4652' }}
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
    return d.toLocaleDateString('pt-PT')
  } catch { return '-' }
}

function resolveNome(arr: { id?: string; name?: string }[], id?: string) {
  if (!id) return '-'
  const it = arr.find((x) => x.id === id)
  return it?.name || id
}

const occChipStyle: React.CSSProperties = {
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

const occDateBadgeStyle: React.CSSProperties = {
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

const occActionButtonStyle: React.CSSProperties = {
  width: 36,
  minWidth: 36,
  minHeight: 36,
  height: 36,
  padding: 0,
  borderRadius: 12,
}

const occActionButtonBaseStyle: React.CSSProperties = {
  ...occActionButtonStyle,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '1px solid rgba(101, 74, 32, 0.14)',
  background: '#fffdf8',
  color: '#4b5563',
  boxShadow: '0 10px 24px rgba(101, 74, 32, 0.08)',
  cursor: 'pointer',
  transition: 'transform 0.18s ease, background 0.18s ease, border-color 0.18s ease, color 0.18s ease, box-shadow 0.18s ease',
}

const occActionButtonHoverStyle: Record<'secondary' | 'danger', React.CSSProperties> = {
  secondary: {
    background: '#f8efe2',
    borderColor: 'rgba(201, 109, 31, 0.28)',
    color: '#8d4a17',
    transform: 'translateY(-1px)',
    boxShadow: '0 14px 28px rgba(201, 109, 31, 0.12)',
  },
  danger: {
    background: '#fff1f1',
    borderColor: 'rgba(200, 60, 60, 0.28)',
    color: '#b42318',
    transform: 'translateY(-1px)',
    boxShadow: '0 14px 28px rgba(180, 35, 24, 0.14)',
  },
}

const occModalBackdropStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 80,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 24,
  background: 'rgba(24, 31, 42, 0.42)',
  backdropFilter: 'blur(8px)',
}

const occModalCardStyle: React.CSSProperties = {
  width: 'min(100%, 520px)',
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
  padding: 24,
  borderRadius: 24,
  background: 'linear-gradient(180deg, rgba(255, 252, 246, 0.98) 0%, rgba(250, 244, 234, 0.96) 100%)',
  border: '1px solid rgba(101, 74, 32, 0.14)',
  boxShadow: '0 28px 70px rgba(55, 34, 8, 0.18)',
}

const occModalEyebrowStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  width: 'fit-content',
  minHeight: 30,
  padding: '0 12px',
  borderRadius: 999,
  background: 'rgba(168, 113, 51, 0.1)',
  color: '#8d4a17',
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: '.12em',
  textTransform: 'uppercase',
}

const occModalErrorStyle: React.CSSProperties = {
  padding: '12px 14px',
  borderRadius: 16,
  background: '#fff1f1',
  border: '1px solid rgba(200, 60, 60, 0.18)',
  color: '#b42318',
  fontSize: 14,
  fontWeight: 700,
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

function ActionIconButton({
  label,
  variant,
  children,
  onClick,
}: {
  label: string
  variant: 'secondary' | 'danger'
  children: React.ReactNode
  onClick: () => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...occActionButtonBaseStyle,
        ...(hovered ? occActionButtonHoverStyle[variant] : null),
      }}
    >
      {children}
    </button>
  )
}

function DeleteConfirmModal({
  loading,
  error,
  onCancel,
  onConfirm,
}: {
  loading: boolean
  error: string | null
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div style={occModalBackdropStyle} role="dialog" aria-modal="true" aria-labelledby="occ-delete-title">
      <div style={occModalCardStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={occModalEyebrowStyle}>Confirmação</span>
          <h3 id="occ-delete-title" style={{ margin: 0, fontSize: 24, lineHeight: 1.1, color: '#1f2937' }}>
            Eliminar ocorrência
          </h3>
          <p style={{ margin: 0, color: '#5f6673', lineHeight: 1.6 }}>
            Esta ação remove a ocorrência selecionada. Confirme apenas se pretende eliminar definitivamente este registo.
          </p>
        </div>

        {error ? <div style={occModalErrorStyle}>{error}</div> : null}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Button variant="secondary" onClick={onCancel} disabled={loading}>Cancelar</Button>
          <Button variant="danger" onClick={onConfirm} disabled={loading}>
            {loading ? 'A eliminar…' : 'Eliminar ocorrência'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M2 12C3.9 8.6 7.5 6.5 12 6.5C16.5 6.5 20.1 8.6 22 12C20.1 15.4 16.5 17.5 12 17.5C7.5 17.5 3.9 15.4 2 12Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

function PencilIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 20L7.8 19.2L18.4 8.6C19.2 7.8 19.2 6.6 18.4 5.8L18.2 5.6C17.4 4.8 16.2 4.8 15.4 5.6L4.8 16.2L4 20Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.8 7.2L16.8 10.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M9.5 3.5H14.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M18 7L17.2 18.1C17.1 19.2 16.2 20 15.1 20H8.9C7.8 20 6.9 19.2 6.8 18.1L6 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 11V16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M14 11V16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function readOcorrenciasListStateFromUrl(): OcorrenciasListState {
  const sp = new URLSearchParams(window.location.search)
  const orderBy = sp.get('orderBy')
  const orderDirection = sp.get('orderDirection')
  const page = Number(sp.get('page') || '1')
  const pageSize = Number(sp.get('pageSize') || '10')

  return {
    texto: sp.get('texto') || '',
    regiaoId: sp.get('regiaoId') || '',
    ascId: sp.get('ascId') || '',
    formaConhecimentoId: sp.get('formaConhecimentoId') || '',
    direcaoTransportesId: sp.get('direcaoTransportesId') || '',
    dataInicio: sp.get('dataInicio') || null,
    dataFim: sp.get('dataFim') || null,
    page: Number.isFinite(page) && page > 0 ? page : 1,
    pageSize: [10, 20, 50].includes(pageSize) ? pageSize : 10,
    orderBy: orderBy === 'data_facto' || orderBy === 'local' ? orderBy : 'created_at',
    orderDirection: orderDirection === 'asc' ? 'asc' : 'desc',
  }
}

function buildOcorrenciasListSearch(state: OcorrenciasListState) {
  const sp = new URLSearchParams()
  if (state.texto) sp.set('texto', state.texto)
  if (state.regiaoId) sp.set('regiaoId', state.regiaoId)
  if (state.ascId) sp.set('ascId', state.ascId)
  if (state.formaConhecimentoId) sp.set('formaConhecimentoId', state.formaConhecimentoId)
  if (state.direcaoTransportesId) sp.set('direcaoTransportesId', state.direcaoTransportesId)
  if (state.dataInicio) sp.set('dataInicio', state.dataInicio)
  if (state.dataFim) sp.set('dataFim', state.dataFim)
  if (state.page > 1) sp.set('page', String(state.page))
  if (state.pageSize !== 10) sp.set('pageSize', String(state.pageSize))
  if (state.orderBy !== 'created_at') sp.set('orderBy', state.orderBy)
  if (state.orderDirection !== 'desc') sp.set('orderDirection', state.orderDirection)
  const query = sp.toString()
  return query ? `?${query}` : ''
}

function stripCreatedParamFromSearch(search: string) {
  const sp = new URLSearchParams(search)
  sp.delete('created')
  const query = sp.toString()
  return query ? `?${query}` : ''
}

function OcorrenciaForm({ defaultValue, regioes, ascs, formas, setores, tiposInf, submitting, onSubmit, onCancel, mode }: {
  defaultValue?: ModelOccurrence
  regioes: ModelRegiao[]
  ascs: ModelASC[]
  formas: ModelFormaConhecimento[]
  setores: ModelSectorInfracao[]
  tiposInf: ModelTipoInfracao[]
  submitting?: boolean
  onSubmit: (input: OccurrenceCreateOccurrenceRequest | OccurrenceUpdateOccurrenceRequest) => void
  onCancel: () => void
  mode?: 'create' | 'edit'
}) {
  const [local, setLocal] = useState(defaultValue?.local ?? '')
  const [descricao, setDescricao] = useState(defaultValue?.descricao ?? '')
  const [regiaoId, setRegiaoId] = useState(defaultValue?.regiao_id ?? '')
  const [ascId, setAscId] = useState(defaultValue?.asc_id ?? '')
  const [formaId, setFormaId] = useState(defaultValue?.forma_conhecimento_id ?? '')
  const [lat, setLat] = useState<string>(defaultValue?.lat != null ? String(defaultValue.lat) : '')
  const [long, setLong] = useState<string>(defaultValue?.long != null ? String(defaultValue.long) : '')
  const [procCriminal, setProcCriminal] = useState<boolean>(Boolean((defaultValue as any)?.processo_criminal_aberto))
  const [autoTexto, setAutoTexto] = useState<string>(String((defaultValue as any)?.auto ?? ''))
  const [autoImagem, setAutoImagem] = useState<string>('')

  const [infractions, setInfractions] = useState<OccurrenceCreateOccurrenceInfraction[]>(() => [{ }])
  const apiBase = (import.meta as any).env?.VITE_API_BASE_URL || '/api'

  function submit() {
    if (mode === 'edit') {
      const payload: OccurrenceUpdateOccurrenceRequest = {
        local: local || undefined,
        descricao: descricao || undefined,
        lat: lat ? Number(lat) : undefined,
        long: long ? Number(long) : undefined
      }
      onSubmit(payload)
    } else {
      const cleanedInfractions = (infractions || []).map((inf) => ({
        sector_infracao_id: inf.sector_infracao_id || undefined,
        tipo_infracao_id: inf.tipo_infracao_id || undefined,
        tipo_material: inf.tipo_material || undefined,
        quantidade: (inf.quantidade != null && !Number.isNaN(Number(inf.quantidade)) && Number(inf.quantidade) >= 1) ? Number(inf.quantidade) : undefined,
        valor: inf.valor != null && !Number.isNaN(Number(inf.valor)) ? Number(inf.valor) : undefined,
        lat: inf.lat != null && !Number.isNaN(Number(inf.lat)) ? Number(inf.lat) : undefined,
        long: inf.long != null && !Number.isNaN(Number(inf.long)) ? Number(inf.long) : undefined,
        fotografias: (inf.fotografias || []).filter(Boolean),
        infractors: (inf.infractors || []).map((i) => ({
          nome: i.nome || undefined,
          nr_identificacao: i.nr_identificacao || undefined,
          tipo_identificacao: i.tipo_identificacao || undefined
        }))
      })).filter((it) => (
        it.sector_infracao_id || it.tipo_infracao_id || it.tipo_material ||
        (it.quantidade != null && it.quantidade >= 1) || it.valor != null || it.lat != null || it.long != null ||
        (Array.isArray(it.fotografias) && it.fotografias.length > 0) ||
        (Array.isArray(it.infractors) && it.infractors.length > 0)
      ))
      if (cleanedInfractions.length < 1) {
        alert('Adicione pelo menos uma infração.')
        return
      }
      const payload: OccurrenceCreateOccurrenceRequest = {
        local: local || undefined,
        descricao: descricao || undefined,
        regiao_id: regiaoId || undefined,
        asc_id: ascId || undefined,
        forma_conhecimento_id: formaId || undefined,
        lat: lat ? Number(lat) : undefined,
        long: long ? Number(long) : undefined,
        infractions: cleanedInfractions
      }
      const extra: any = { processo_criminal_aberto: !!procCriminal }
      if (procCriminal) {
        if (autoTexto) extra.auto = autoTexto
        if (autoImagem) extra.auto_image = autoImagem.startsWith('data:') ? (autoImagem.split(',')[1] || '') : autoImagem
      }
      onSubmit({ ...(payload as any), ...extra } as any)
    }
  }

  function updateInf(index: number, partial: Partial<OccurrenceCreateOccurrenceInfraction>) {
    setInfractions((arr) => updateAtIndex(arr, index, (old) => ({ ...old, ...partial })))
  }
  function addInf() { setInfractions((arr) => [...arr, {}]) }
  function removeInf(index: number) { setInfractions((arr) => arr.filter((_, i) => i !== index)) }
  function addPhoto(index: number) {
    setInfractions((arr) => updateAtIndex(arr, index, (old) => ({
      ...old,
      fotografias: [ ...(old.fotografias ?? []), (old as any)._newPhoto || '' ].filter(Boolean),
      _newPhoto: '' as any
    }) as any))
  }
  function updateInfTempPhoto(index: number, value: string) {
    setInfractions((arr) => updateAtIndex(arr, index, (old: any) => ({ ...old, _newPhoto: value })))
  }
  function removePhoto(index: number, pIndex: number) {
    setInfractions((arr) => updateAtIndex(arr, index, (old) => ({ ...old, fotografias: (old.fotografias ?? []).filter((_, i) => i !== pIndex) })))
  }
  function addInfractor(index: number) {
    setInfractions((arr) => updateAtIndex(arr, index, (old) => ({ ...old, infractors: [ ...(old.infractors ?? []), {} as OccurrenceCreateOccurrenceInfractor ] })))
  }
  function updateInfractor(index: number, iIndex: number, partial: Partial<OccurrenceCreateOccurrenceInfractor>) {
    setInfractions((arr) => updateAtIndex(arr, index, (old) => ({
      ...old,
      infractors: (old.infractors ?? []).map((it, k) => (k === iIndex ? { ...it, ...partial } : it))
    })))
  }
  function removeInfractor(index: number, iIndex: number) {
    setInfractions((arr) => updateAtIndex(arr, index, (old) => ({
      ...old,
      infractors: (old.infractors ?? []).filter((_, k) => k !== iIndex)
    })))
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit() }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 13, color: '#374151' }}>Local</span>
        <input value={local} onChange={(e) => setLocal(e.target.value)} placeholder="Ex.: Rua X, Bairro Y" style={{ padding: 12, borderRadius: 8, border: '1px solid #d1d5db' }} />
      </label>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 13, color: '#374151' }}>Descrição</span>
        <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descrição da ocorrência" rows={4} style={{ padding: 12, borderRadius: 8, border: '1px solid #d1d5db', resize: 'vertical' }} />
      </label>

      {mode !== 'edit' && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 200 }}>
            <span style={{ fontSize: 13, color: '#374151' }}>Região</span>
            <select value={regiaoId} onChange={(e) => { setRegiaoId(e.target.value); setAscId('') }} required style={{ padding: 12, borderRadius: 8, border: '1px solid #d1d5db', background: '#fff' }}>
              <option value="">— Selecionar —</option>
              {regioes.map((r) => (
                <option key={r.id} value={r.id}>{r.name || r.id}</option>
              ))}
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 200 }}>
            <span style={{ fontSize: 13, color: '#374151' }}>ASC</span>
            <select value={ascId} onChange={(e) => setAscId(e.target.value)} style={{ padding: 12, borderRadius: 8, border: '1px solid #d1d5db', background: '#fff' }}>
              <option value="">— Selecionar —</option>
              {ascs.filter((a) => !regiaoId || a.regiao_id === regiaoId).map((a) => (
                <option key={a.id} value={a.id}>{a.name || a.id}</option>
              ))}
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 200 }}>
            <span style={{ fontSize: 13, color: '#374151' }}>Forma de conhecimento</span>
            <select value={formaId} onChange={(e) => setFormaId(e.target.value)} style={{ padding: 12, borderRadius: 8, border: '1px solid #d1d5db', background: '#fff' }}>
              <option value="">— Selecionar —</option>
              {formas.map((f) => (
                <option key={f.id} value={f.id}>{f.name || f.id}</option>
              ))}
            </select>
          </label>
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 160 }}>
          <span style={{ fontSize: 13, color: '#374151' }}>Latitude</span>
          <input value={lat} onChange={(e) => setLat(e.target.value)} placeholder="-25.96" inputMode="decimal" style={{ padding: 12, borderRadius: 8, border: '1px solid #d1d5db' }} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 160 }}>
          <span style={{ fontSize: 13, color: '#374151' }}>Longitude</span>
          <input value={long} onChange={(e) => setLong(e.target.value)} placeholder="32.58" inputMode="decimal" style={{ padding: 12, borderRadius: 8, border: '1px solid #d1d5db' }} />
        </label>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 13, color: '#374151' }}>Localização no mapa</span>
        <MapPicker
          markerKind="occurrence"
          value={{ lat: lat !== '' && !Number.isNaN(Number(lat)) ? Number(lat) : undefined, lng: long !== '' && !Number.isNaN(Number(long)) ? Number(long) : undefined }}
          onChange={(pos) => { setLat(String(pos.lat)); setLong(String(pos.lng)) }}
          height={280}
        />
      </div>

      {mode !== 'edit' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={procCriminal} onChange={(e) => setProcCriminal(e.target.checked)} />
              <span style={{ fontSize: 13, color: '#374151' }}>Processo criminal aberto</span>
            </label>
          </div>
          {procCriminal && (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 220 }}>
                <span style={{ fontSize: 13, color: '#374151' }}>Dados do auto</span>
                <input value={autoTexto} onChange={(e) => setAutoTexto(e.target.value)} placeholder="Número/descrição do auto" style={{ padding: 12, borderRadius: 8, border: '1px solid #d1d5db' }} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 260 }}>
                <span style={{ fontSize: 13, color: '#374151' }}>Anexo do auto (imagem)</span>
                <input type="file" accept="image/*" onChange={async (e) => {
                  const f = e.target.files?.[0]
                  if (!f) { setAutoImagem(''); return }
                  const toDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
                    const reader = new FileReader()
                    reader.onload = () => resolve(String(reader.result))
                    reader.onerror = () => reject(reader.error)
                    reader.readAsDataURL(file)
                  })
                  try { setAutoImagem(await toDataUrl(f)) } catch { setAutoImagem('') }
                }} />
                {autoImagem ? (
                  <img src={autoImagem} alt="Auto" style={{ marginTop: 6, width: 160, height: 120, objectFit: 'cover', borderRadius: 8, border: '1px solid #e5e7eb' }} />
                ) : null}
              </label>
            </div>
          )}
        </div>
      )}

      {mode !== 'edit' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
          <h4 style={{ margin: '12px 0 0 0' }}>Infrações</h4>
          {infractions.map((inf, idx) => (
            <div key={idx} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 12 }}>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 200 }}>
                  <span style={{ fontSize: 13, color: '#374151' }}>Sector de Infração</span>
                  <select value={inf.sector_infracao_id ?? ''} onChange={(e) => updateInf(idx, { sector_infracao_id: e.target.value || undefined })} style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db', background: '#fff' }}>
                    <option value="">— Selecionar —</option>
                    {setores.map((s) => <option key={s.id} value={s.id}>{s.name || s.id}</option>)}
                  </select>
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 200 }}>
                  <span style={{ fontSize: 13, color: '#374151' }}>Tipo de Infração</span>
                  <select value={inf.tipo_infracao_id ?? ''} onChange={(e) => updateInf(idx, { tipo_infracao_id: e.target.value || undefined })} style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db', background: '#fff' }}>
                    <option value="">— Selecionar —</option>
                    {tiposInf.map((t) => <option key={t.id} value={t.id}>{t.name || t.id}</option>)}
                  </select>
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 180 }}>
                  <span style={{ fontSize: 13, color: '#374151' }}>Tipo de material</span>
                  <input value={inf.tipo_material ?? ''} onChange={(e) => updateInf(idx, { tipo_material: e.target.value })} placeholder="ex.: Cabo, Ferro…" style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db' }} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 140 }}>
                  <span style={{ fontSize: 13, color: '#374151' }}>Quantidade</span>
                  <input
                    type="number"
                    min={1}
                    step="any"
                    value={inf.quantidade ?? ''}
                    onChange={(e) => {
                      const val = e.target.value
                      if (val === '') { updateInf(idx, { quantidade: undefined as any }); return }
                      const num = Number(val)
                      if (Number.isNaN(num)) return
                      updateInf(idx, { quantidade: (num < 1 ? 1 : num) as any })
                    }}
                    placeholder="1"
                    style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db' }}
                  />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 140 }}>
                  <span style={{ fontSize: 13, color: '#374151' }}>Valor</span>
                  <input value={inf.valor ?? ''} onChange={(e) => updateInf(idx, { valor: e.target.value ? Number(e.target.value) as any : undefined })} inputMode="decimal" placeholder="0" style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db' }} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 160 }}>
                  <span style={{ fontSize: 13, color: '#374151' }}>Latitude</span>
                  <input value={inf.lat ?? ''} onChange={(e) => updateInf(idx, { lat: e.target.value ? Number(e.target.value) as any : undefined })} inputMode="decimal" placeholder="-25.96" style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db' }} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 160 }}>
                  <span style={{ fontSize: 13, color: '#374151' }}>Longitude</span>
                  <input value={inf.long ?? ''} onChange={(e) => updateInf(idx, { long: e.target.value ? Number(e.target.value) as any : undefined })} inputMode="decimal" placeholder="32.58" style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db' }} />
                </label>
              </div>

              <div style={{ marginTop: 10 }}>
                <strong>Fotografias</strong>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                  {(inf.fotografias ?? []).map((img, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid #e5e7eb', borderRadius: 8, padding: 6 }}>
                      <img src={`${apiBase}/public/images/${img}`} alt="Foto" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 6 }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '0.3' }} />
                      <span style={{ fontSize: 12, color: '#374151' }}>{img}</span>
                      <Button variant="danger" onClick={() => removePhoto(idx, i)}>
                        Remover
                      </Button>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <input placeholder="ID/ficheiro da imagem" value={(inf as any)._newPhoto ?? ''} onChange={(e) => updateInfTempPhoto(idx, e.target.value)} style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db', flex: 1 }} />
                  <Button type="button" variant="secondary" onClick={() => addPhoto(idx)}>Adicionar imagem</Button>
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <strong>Infractores</strong>
                {(inf.infractors ?? []).length === 0 ? (
                  <div style={{ color: '#6b7280', margin: '6px 0 8px 0' }}>Sem infractores (opcional).</div>
                ) : null}
                {(inf.infractors ?? []).map((it, k) => (
                  <div key={k} style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap', border: '1px dashed #e5e7eb', padding: 8, borderRadius: 8, marginTop: 8 }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 200 }}>
                      <span style={{ fontSize: 13, color: '#374151' }}>Nome</span>
                      <input value={it.nome ?? ''} onChange={(e) => updateInfractor(idx, k, { nome: e.target.value })} placeholder="Nome" style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db' }} />
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 180 }}>
                      <span style={{ fontSize: 13, color: '#374151' }}>Documento</span>
                      <input value={it.nr_identificacao ?? ''} onChange={(e) => updateInfractor(idx, k, { nr_identificacao: e.target.value })} placeholder="Nr. identificação" style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db' }} />
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 200 }}>
                      <span style={{ fontSize: 13, color: '#374151' }}>Tipo de identificação</span>
                      <input value={it.tipo_identificacao ?? ''} onChange={(e) => updateInfractor(idx, k, { tipo_identificacao: e.target.value })} placeholder="BI, Passaporte…" style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db' }} />
                    </label>
                    <Button type="button" variant="danger" onClick={() => removeInfractor(idx, k)}>Remover</Button>
                  </div>
                ))}
                <div style={{ marginTop: 8 }}>
                  <Button type="button" variant="secondary" onClick={() => addInfractor(idx)}>Adicionar infractor</Button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
                <Button type="button" variant="danger" onClick={() => removeInf(idx)} disabled={infractions.length <= 1}>Remover infração</Button>
                {idx === infractions.length - 1 && (
                  <Button type="button" variant="secondary" onClick={addInf}>Adicionar infração</Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <Button type="submit" disabled={submitting}>{submitting ? 'A guardar…' : 'Guardar'}</Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>Cancelar</Button>
      </div>
    </form>
  )
}

function updateAtIndex<T>(arr: T[], idx: number, updater: (old: T) => T): T[] {
  return arr.map((it, i) => (i === idx ? updater(it) : it))
}
