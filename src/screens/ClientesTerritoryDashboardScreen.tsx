import React, { useEffect, useMemo, useState } from 'react'
import { Card } from '../components'
import { useAuth } from '../contexts/AuthContext'
import { ASCApi, InspeccoesApi, RegiaoApi, type ModelASC, type ModelRegiao } from '../services'
import ClientesDashboardScreen from './ClientesDashboardScreen'

type Mode = 'regiao' | 'asc'
type TerritoryCardItem = {
  id: string
  name: string
  subtitle?: string
  regiaoId?: string
  count: number
}

type Props = {
  mode: Mode
}

function ClientesTerritoryDashboardScreen({ mode }: Props) {
  const { getApiConfig, getAuthorizationHeaderValue, logout } = useAuth()
  const auth = useMemo(() => getAuthorizationHeaderValue(), [getAuthorizationHeaderValue])
  const regioesApi = useMemo(() => new RegiaoApi(getApiConfig()), [getApiConfig])
  const ascsApi = useMemo(() => new ASCApi(getApiConfig()), [getApiConfig])
  const inspeccoesApi = useMemo(() => new InspeccoesApi(getApiConfig()), [getApiConfig])

  const [regioes, setRegioes] = useState<ModelRegiao[]>([])
  const [regionScopeId, setRegionScopeId] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [cards, setCards] = useState<TerritoryCardItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isUnauthorizedBody = (data: any) => {
    try {
      const raw = data?.code ?? data?.error?.code ?? data?.status ?? data?.error?.status ?? data?.error_code
      if (raw == null) return false
      const num = Number(raw)
      if (!Number.isNaN(num) && num === 401) return true
      const code = String(raw).toUpperCase()
      return code === 'UNAUTHORIZED' || code === 'UNAUTHENTICATED'
    } catch { return false }
  }

  useEffect(() => {
    const syncFromUrl = () => {
      const params = new URLSearchParams(window.location.search)
      if (mode === 'regiao') {
        setSelectedId(params.get('regiaoId') || '')
        setRegionScopeId('')
      } else {
        setSelectedId(params.get('ascId') || '')
        setRegionScopeId(params.get('regiaoId') || '')
      }
    }

    syncFromUrl()
    window.addEventListener('popstate', syncFromUrl)
    window.addEventListener('locationchange', syncFromUrl)
    return () => {
      window.removeEventListener('popstate', syncFromUrl)
      window.removeEventListener('locationchange', syncFromUrl)
    }
  }, [mode])

  const updateSearch = (nextSelectedId: string, nextRegionScopeId?: string) => {
    const params = new URLSearchParams()
    const basePath = mode === 'regiao' ? '/instalacoes/dashboard/regioes' : '/instalacoes/dashboard/ascs'
    if (mode === 'regiao') {
      if (nextSelectedId) params.set('regiaoId', nextSelectedId)
    } else {
      if (nextRegionScopeId) params.set('regiaoId', nextRegionScopeId)
      if (nextSelectedId) params.set('ascId', nextSelectedId)
    }
    const nextPath = params.toString() ? `${basePath}?${params.toString()}` : basePath
    window.history.pushState({}, '', nextPath)
    window.dispatchEvent(new Event('locationchange'))
  }

  useEffect(() => {
    ;(async () => {
      try {
        const { data } = await regioesApi.privateRegioesGet(auth, 1, 300, 'name', 'asc')
        if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
        setRegioes(((data as any)?.items) ?? [])
      } catch (err: any) {
        const status = err?.response?.status
        if (status === 401 || isUnauthorizedBody(err?.response?.data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      }
    })()
  }, [regioesApi, auth, logout])

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        if (mode === 'regiao') {
          const [{ data: regioesData }, { data: countsData }] = await Promise.all([
            regioesApi.privateRegioesGet(auth, 1, 300, 'name', 'asc'),
            inspeccoesApi.privateInspeccoesContagensGet(auth, 'regiao'),
          ])
          if (isUnauthorizedBody(regioesData) || isUnauthorizedBody(countsData)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
          const countsMap = new Map<string, number>((((countsData as any)?.items) ?? []).map((item: any) => [String(item?.group_id || ''), Number(item?.total || 0)]))
          const nextCards = ((((regioesData as any)?.items) ?? []) as ModelRegiao[]).map((item) => ({
            id: String(item.id || ''),
            name: String(item.name || item.id || '—'),
            count: countsMap.get(String(item.id || '')) || 0,
          }))
          setCards(nextCards)
        } else {
          const [{ data: ascsData }, { data: countsData }] = await Promise.all([
            ascsApi.privateAscsGet(auth, 1, 500, 'name', 'asc', undefined, regionScopeId || undefined),
            inspeccoesApi.privateInspeccoesContagensGet(auth, 'asc' as any),
          ])
          if (isUnauthorizedBody(ascsData) || isUnauthorizedBody(countsData)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
          const countsMap = new Map<string, number>((((countsData as any)?.items) ?? []).map((item: any) => [String(item?.group_id || ''), Number(item?.total || 0)]))
          const regiaoNameById = new Map<string, string>((regioes || []).map((item) => [String(item.id || ''), String(item.name || item.id || '')]))
          const nextCards = ((((ascsData as any)?.items) ?? []) as ModelASC[]).map((item) => ({
            id: String(item.id || ''),
            name: String(item.name || item.id || '—'),
            subtitle: regiaoNameById.get(String(item.regiao_id || '')) || 'Sem região',
            regiaoId: String(item.regiao_id || ''),
            count: countsMap.get(String(item.id || '')) || 0,
          }))
          setCards(nextCards)
        }
      } catch (err: any) {
        const status = err?.response?.status
        if (status === 401 || isUnauthorizedBody(err?.response?.data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
        setError(!status ? 'Sem ligação ao servidor.' : 'Falha ao carregar cartões de seleção.')
      } finally {
        setLoading(false)
      }
    })()
  }, [mode, regioesApi, ascsApi, inspeccoesApi, auth, logout, regionScopeId, regioes])

  const filteredCards = useMemo(() => {
    return (cards || []).filter((item) => {
      if (mode === 'asc' && regionScopeId && item.regiaoId !== regionScopeId) return false
      return true
    })
  }, [cards, mode, regionScopeId])

  const selectedCard = (cards || []).find((item) => item.id === selectedId)

  useEffect(() => {
    if (selectedId || !filteredCards.length) return
    const first = filteredCards[0]
    if (!first) return
    updateSearch(first.id, mode === 'asc' ? (first.regiaoId || regionScopeId) : undefined)
  }, [selectedId, filteredCards, mode, regionScopeId])

  const leadContent = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {mode === 'asc' ? (
        <label style={fieldGroupStyle}>
          <span style={fieldLabelStyle}>Filtrar por região</span>
          <select value={regionScopeId} onChange={(e) => updateSearch('', e.target.value)} style={fieldControlStyle}>
            <option value="">Todas as regiões</option>
            {(regioes || []).map((item) => (
              <option key={item.id} value={item.id}>{item.name || item.id}</option>
            ))}
          </select>
        </label>
      ) : null}

      {error ? (
        <div style={{ background: '#fff4e8', color: '#8d4a17', padding: 12, borderRadius: 14, border: '1px solid rgba(141, 74, 23, 0.16)' }}>
          {error}
        </div>
      ) : null}

      {loading ? (
        <div style={{ padding: 24, textAlign: 'center', color: '#7b8494' }}>A carregar cartões de seleção…</div>
      ) : (
        <div style={{ width: '100%', minWidth: 0, maxWidth: '100%', overflowX: 'auto', overflowY: 'hidden', paddingBottom: 8 }}>
          <div
            style={{
              display: 'grid',
              gridAutoFlow: 'column',
              gridAutoColumns: '240px',
              gap: 14,
              width: '100%',
              minWidth: 'max-content',
            }}
          >
            {filteredCards.map((item) => {
              const selected = item.id === selectedId
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => updateSearch(item.id, mode === 'asc' ? (item.regiaoId || regionScopeId) : undefined)}
                  style={{
                    width: 240,
                    minWidth: 240,
                    maxWidth: 240,
                    boxSizing: 'border-box',
                    textAlign: 'left',
                    padding: 18,
                    borderRadius: 22,
                    border: selected ? '1px solid rgba(201, 109, 31, 0.30)' : '1px solid rgba(101, 74, 32, 0.14)',
                    background: selected
                      ? 'linear-gradient(180deg, rgba(255, 244, 230, 0.98) 0%, rgba(248, 231, 205, 0.92) 100%)'
                      : 'linear-gradient(180deg, rgba(255,252,247,.94) 0%, rgba(248,241,230,.88) 100%)',
                    boxShadow: selected ? '0 18px 34px rgba(76, 57, 24, 0.12)' : '0 12px 24px rgba(76, 57, 24, 0.06)',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 12 }}>
                    <span style={carouselEyebrowStyle}>{mode === 'regiao' ? 'Região' : 'ASC'}</span>
                    <span style={carouselCountPillStyle}>{item.count.toLocaleString('pt-PT')} clientes</span>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#1f2937', lineHeight: 1.2 }}>{item.name}</div>
                  <div style={{ marginTop: 6, minHeight: 20, color: '#6b7280', fontSize: 13 }}>
                    {item.subtitle || (mode === 'regiao' ? 'Dashboard territorial dedicado' : 'Dashboard operacional dedicado')}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0, width: '100%', overflowX: 'hidden' }}>
      {selectedId ? (
        <ClientesDashboardScreen
          scopeMode={mode}
          lockedRegiaoId={mode === 'regiao' ? selectedId : (selectedCard?.regiaoId || regionScopeId || '')}
          lockedAscId={mode === 'asc' ? selectedId : undefined}
          onRegiaoCardSelect={(nextRegiaoId) => updateSearch(nextRegiaoId)}
          onAscCardSelect={(nextAscId, nextRegiaoId) => updateSearch(nextAscId, nextRegiaoId || regionScopeId)}
          filtersCardLead={leadContent}
          filtersTitle={mode === 'regiao' ? 'Dashboard por Região' : 'Dashboard por ASC'}
          filtersSubtitle={mode === 'regiao'
            ? 'Escolha uma região no carrossel e refine a análise no mesmo painel.'
            : 'Filtre por região, escolha uma ASC no carrossel e refine a análise no mesmo painel.'}
        />
      ) : (
        <Card title={mode === 'regiao' ? 'Dashboard por Região' : 'Dashboard por ASC'} subtitle="Escolha um cartão acima para abrir o dashboard dedicado.">
          {leadContent}
        </Card>
      )}
    </div>
  )
}

export function ClientesRegioesDashboardScreen() {
  return <ClientesTerritoryDashboardScreen mode="regiao" />
}

export function ClientesAscsDashboardScreen() {
  return <ClientesTerritoryDashboardScreen mode="asc" />
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
  borderRadius: 14,
  border: '1px solid rgba(101, 74, 32, 0.14)',
  background: '#fffdf9',
  color: '#1f2937',
  boxShadow: '0 10px 24px rgba(101, 74, 32, 0.05)',
}

const carouselEyebrowStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: '.12em',
  textTransform: 'uppercase',
  color: '#8d4a17',
}

const carouselCountPillStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  minHeight: 30,
  padding: '0 10px',
  borderRadius: 999,
  background: 'rgba(255, 253, 248, 0.82)',
  border: '1px solid rgba(101, 74, 32, 0.10)',
  color: '#8d4a17',
  fontSize: 12,
  fontWeight: 800,
}
