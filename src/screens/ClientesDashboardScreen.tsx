import React, { useEffect, useMemo, useState } from 'react'
import { Card } from '../components'
import { useAuth } from '../contexts/AuthContext'
import { InspeccoesApi, ASCApi, RegiaoApi, InstalacaoAccoesApi, InstalacaoAccaoTipoApi, type ModelASC, type ModelRegiao } from '../services'

type CountItem = { id?: string; label?: string; count?: number }

type ClientesDashboardScreenProps = {
  scopeMode?: 'default' | 'regiao' | 'asc'
  lockedRegiaoId?: string
  lockedAscId?: string
  onRegiaoCardSelect?: (regiaoId: string) => void
  onAscCardSelect?: (ascId: string, regiaoId?: string) => void
  filtersCardLead?: React.ReactNode
  filtersTitle?: string
  filtersSubtitle?: string
}

export default function ClientesDashboardScreen({
  scopeMode = 'default',
  lockedRegiaoId,
  lockedAscId,
  onRegiaoCardSelect,
  onAscCardSelect,
  filtersCardLead,
  filtersTitle,
  filtersSubtitle,
}: ClientesDashboardScreenProps) {
  const { getApiConfig, getAuthorizationHeaderValue, logout } = useAuth()
  const api = useMemo(() => new InspeccoesApi(getApiConfig()), [getApiConfig])
  const auth = useMemo(() => getAuthorizationHeaderValue(), [getAuthorizationHeaderValue])

  const [items, setItems] = useState<CountItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [regioes, setRegioes] = useState<ModelRegiao[]>([])
  const [ascs, setAscs] = useState<ModelASC[]>([])
  const [regiaoId, setRegiaoId] = useState('')
  const [ascId, setAscId] = useState('')
  const [tendencia, setTendencia] = useState('')
  const [marcacaoStatus, setMarcacaoStatus] = useState('')
  const [analiseStatus, setAnaliseStatus] = useState('')
  const [ascCounts, setAscCounts] = useState<CountItem[]>([])
  const [itemsASC, setItemsASC] = useState<CountItem[]>([])
  const [loadingASC, setLoadingASC] = useState(false)
  const [errorASC, setErrorASC] = useState<string | null>(null)
  const [deficitItems, setDeficitItems] = useState<Array<{ group_id?: string; deficit?: number }>>([])
  const [deficitLoading, setDeficitLoading] = useState(false)
  const [deficitError, setDeficitError] = useState<string | null>(null)
  const [deficitItemsASC, setDeficitItemsASC] = useState<Array<{ group_id?: string; deficit?: number }>>([])
  const [deficitLoadingASC, setDeficitLoadingASC] = useState(false)
  const [deficitErrorASC, setDeficitErrorASC] = useState<string | null>(null)
  // Filtro geral: Mês e Ano (análise de um mês)
  const now = new Date()
  const MONTH_NAMES_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'] as const
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  const [year, setYear] = useState<number>(currentYear)
  const [month, setMonth] = useState<number>(currentMonth)
  const [temporalItems, setTemporalItems] = useState<Array<{ mes?: string; total?: number; deficit?: number }>>([])
  const [semComprasTemporalItems, setSemComprasTemporalItems] = useState<Array<{ mes?: string; total?: number; deficit?: number }>>([])
  const [temporalLoading, setTemporalLoading] = useState(false)
  const [temporalError, setTemporalError] = useState<string | null>(null)
  const [semComprasTemporalLoading, setSemComprasTemporalLoading] = useState(false)
  const [semComprasTemporalError, setSemComprasTemporalError] = useState<string | null>(null)
  // Tendência (group_by=tendencia)
  const [tendCounts, setTendCounts] = useState<CountItem[]>([])
  const [tendLoading, setTendLoading] = useState(false)
  const [tendError, setTendError] = useState<string | null>(null)
  // Effectiveness de instalação-ações (valor recuperado por tipo de ação)
  const [effectivenessData, setEffectivenessData] = useState<any[]>([])
  const [effectivenessLoading, setEffectivenessLoading] = useState(false)
  const [effectivenessError, setEffectivenessError] = useState<string | null>(null)
  // Contagens de ações por instalação (por região)
  const [accoesCounts, setAccoesCounts] = useState<CountItem[]>([])
  const [accoesLoading, setAccoesLoading] = useState(false)
  const [accoesError, setAccoesError] = useState<string | null>(null)
  // Contagens de ações por instalação (por ASC)
  const [accoesCountsASC, setAccoesCountsASC] = useState<CountItem[]>([])
  const [accoesLoadingASC, setAccoesLoadingASC] = useState(false)
  const [accoesErrorASC, setAccoesErrorASC] = useState<string | null>(null)
  // Melhores por valor recuperado (via /valor_recuperado)
  const [bestItems, setBestItems] = useState<Array<{ id?: string; label?: string; value?: number }>>([])
  const [bestLoading, setBestLoading] = useState(false)
  const [bestError, setBestError] = useState<string | null>(null)
  // Melhores por valor recuperado (por ASC)
  const [bestItemsASC, setBestItemsASC] = useState<Array<{ id?: string; label?: string; value?: number }>>([])
  const [bestLoadingASC, setBestLoadingASC] = useState(false)
  const [bestErrorASC, setBestErrorASC] = useState<string | null>(null)
  // Toggles para alternar entre região e ASC
  const [clientesGroupBy, setClientesGroupBy] = useState<'regiao' | 'asc'>('regiao')
  const [deficitGroupBy, setDeficitGroupBy] = useState<'regiao' | 'asc'>('regiao')
  const [accoesGroupBy, setAccoesGroupBy] = useState<'regiao' | 'asc'>('regiao')
  const [bestGroupBy, setBestGroupBy] = useState<'regiao' | 'asc'>('regiao')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const hideRegiaoFilter = scopeMode === 'regiao' || scopeMode === 'asc'
  const hideAscFilter = scopeMode === 'asc'
  const filtersExpanded = scopeMode === 'default' ? filtersOpen : true
  const scopedDashboard = scopeMode === 'regiao' || scopeMode === 'asc'
  const scopedAscDashboard = scopeMode === 'asc'
  const effectiveDeficitGroupBy = scopedDashboard ? 'asc' : deficitGroupBy
  const effectiveAccoesGroupBy = scopedDashboard ? 'asc' : accoesGroupBy
  const effectiveBestGroupBy = scopedDashboard ? 'asc' : bestGroupBy

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
    if (scopeMode === 'regiao') {
      setRegiaoId(lockedRegiaoId || '')
      setAscId('')
      return
    }
    if (scopeMode === 'asc') {
      setRegiaoId(lockedRegiaoId || '')
      setAscId(lockedAscId || '')
    }
  }, [scopeMode, lockedRegiaoId, lockedAscId])

  useEffect(() => {
    if (!scopedDashboard) return
    setDeficitGroupBy('asc')
    setAccoesGroupBy('asc')
    setBestGroupBy('asc')
  }, [scopedDashboard])

  const handleRegiaoSelection = (nextRegiaoId: string) => {
    if (!nextRegiaoId) return
    if (onRegiaoCardSelect) {
      onRegiaoCardSelect(nextRegiaoId)
      return
    }
    setRegiaoId(nextRegiaoId)
    setAscId('')
  }

  const handleAscSelection = (nextAscId: string) => {
    if (!nextAscId) return
    const relatedAsc = (ascs || []).find((item) => String(item.id) === String(nextAscId))
    const nextRegiaoId = relatedAsc?.regiao_id ? String(relatedAsc.regiao_id) : regiaoId || undefined
    if (onAscCardSelect) {
      onAscCardSelect(nextAscId, nextRegiaoId)
      return
    }
    if (nextRegiaoId) setRegiaoId(nextRegiaoId)
    setAscId(nextAscId)
  }

  // Carregar contagens de clientes por região
  useEffect(() => {
    (async () => {
      setLoading(true); setError(null)
      try {
        const { data } = await api.privateInspeccoesContagensGet(auth, 'regiao', tendencia || undefined)
        if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
        const raw = ((data as any)?.items) ?? []
        const mapped: CountItem[] = raw.map((it: any) => ({ id: it?.group_id, label: it?.group_name, count: it?.total }))
        setItems(mapped)
      } catch (err: any) {
        const status = err?.response?.status
        if (status === 401 || isUnauthorizedBody(err?.response?.data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
        setError(!status ? 'Sem ligação ao servidor.' : 'Falha ao carregar contagens de inspeções.')
      } finally { setLoading(false) }
    })()
  }, [api, auth, tendencia])

  // Carregar contagens de clientes por ASC
  useEffect(() => {
    (async () => {
      setLoadingASC(true); setErrorASC(null)
      try {
        const { data } = await api.privateInspeccoesContagensGet(auth, 'asc' as any, tendencia || undefined)
        if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
        const raw = ((data as any)?.items) ?? []
        const mapped: CountItem[] = raw.map((it: any) => ({ id: it?.group_id, label: (ascs.find(a => a.id === it?.group_id)?.name) || it?.group_name, count: it?.total }))
        setItemsASC(mapped)
      } catch (err: any) {
        const status = err?.response?.status
        if (status === 401 || isUnauthorizedBody(err?.response?.data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
        setErrorASC(!status ? 'Sem ligação ao servidor.' : 'Falha ao carregar contagens de inspeções por ASC.')
      } finally { setLoadingASC(false) }
    })()
  }, [api, auth, tendencia, ascs])

  // Carregar filtros (Regiões e ASCs)
  const regiaoApi = useMemo(() => new RegiaoApi(getApiConfig()), [getApiConfig])
  const ascApi = useMemo(() => new ASCApi(getApiConfig()), [getApiConfig])
  const accoesApi = useMemo(() => new InstalacaoAccoesApi(getApiConfig()), [getApiConfig])
  useEffect(() => { (async () => { try { const { data } = await regiaoApi.privateRegioesGet(auth, 1, 200, 'name', 'asc'); if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return } setRegioes(((data as any)?.items) ?? []) } catch {} })() }, [regiaoApi, auth])
  useEffect(() => { (async () => { try { const { data } = await ascApi.privateAscsGet(auth, 1, 200, 'name', 'asc', undefined, regiaoId || undefined); if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return } setAscs(((data as any)?.items) ?? []) } catch {} })() }, [ascApi, auth, regiaoId])
  // Carregar contagens por ASC apenas quando houver Região selecionada
  useEffect(() => {
    (async () => {
      if (!regiaoId) { setAscCounts([]); return }
      try {
        const { data } = await api.privateInspeccoesContagensGet(auth, 'asc' as any, tendencia || undefined)
        if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
        const raw = ((data as any)?.items) ?? []
        const mapped: CountItem[] = raw.map((it: any) => ({ id: it?.group_id, label: it?.group_name, count: it?.total }))
        setAscCounts(mapped)
      } catch {}
    })()
  }, [api, auth, tendencia, regiaoId])

  // Aplicar filtros localmente (agrupado por Região/ASC)
  const ascRegiaoId = useMemo(() => (ascs.find(a => a.id === ascId)?.regiao_id) || '', [ascs, ascId])
  const filtered = useMemo(() => {
    const currentItems = clientesGroupBy === 'regiao' ? items : itemsASC
    const rId = regiaoId || ascRegiaoId || ''
    if (!rId) return currentItems
    if (clientesGroupBy === 'regiao') {
      return (currentItems || []).filter((it) => (it.id === rId || it.label === (regioes.find(r => r.id === rId)?.name)))
    } else {
      return (currentItems || []).filter((it) => (it.id === ascId || it.label === (ascs.find(a => a.id === ascId)?.name)))
    }
  }, [items, itemsASC, regiaoId, ascRegiaoId, ascId, regioes, ascs, clientesGroupBy])

  const donutData = (filtered || []).map((it) => ({ label: it.label || it.id || '—', value: Number(it.count || 0) }))
  const monthLabel = `${MONTH_NAMES_PT[Math.max(1, Math.min(12, month)) - 1]} ${year}`
  const activeFilterCount = [regiaoId, ascId, tendencia, marcacaoStatus, analiseStatus].filter(Boolean).length
  const totalClientesAtual = (filtered || []).reduce((sum, item) => sum + (item.count || 0), 0)
  const ascSelecionadaLabel = (ascs.find((item) => item.id === ascId)?.name) || ascId || 'ASC selecionada'

  // Carregar défice por região (mantém-se visível; filtragem aplicada na apresentação)
  useEffect(() => {
    (async () => {
      setDeficitLoading(true); setDeficitError(null)
      try {
        const { data } = await api.privateInspeccoesDeficitGet(auth, 'regiao', tendencia || undefined)
        if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
        setDeficitItems((((data as any)?.items) ?? []))
      } catch (err: any) {
        const status = err?.response?.status
        if (status === 401 || isUnauthorizedBody(err?.response?.data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
        setDeficitError(!status ? 'Sem ligação ao servidor.' : 'Falha ao carregar défices.')
      } finally { setDeficitLoading(false) }
    })()
  }, [api, auth, tendencia])

  // Carregar défice por ASC
  useEffect(() => {
    (async () => {
      setDeficitLoadingASC(true); setDeficitErrorASC(null)
      try {
        const { data } = await api.privateInspeccoesDeficitGet(auth, 'asc' as any, tendencia || undefined)
        if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
        setDeficitItemsASC((((data as any)?.items) ?? []))
      } catch (err: any) {
        const status = err?.response?.status
        if (status === 401 || isUnauthorizedBody(err?.response?.data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
        setDeficitErrorASC(!status ? 'Sem ligação ao servidor.' : 'Falha ao carregar défices por ASC.')
      } finally { setDeficitLoadingASC(false) }
    })()
  }, [api, auth, tendencia])

  const deficitWithLabels = useMemo(() => {
    const byId = new Map((regioes || []).map(r => [r.id, r.name]))
    return (deficitItems || []).map(it => ({ id: it.group_id || '', label: byId.get(it.group_id || '') || (it.group_id || '—'), value: Number(it.deficit || 0) }))
  }, [deficitItems, regioes])
  const deficitWithLabelsASC = useMemo(() => {
    const byId = new Map((ascs || []).map(a => [a.id, a.name]))
    return (deficitItemsASC || []).map(it => ({ id: it.group_id || '', label: byId.get(it.group_id || '') || (it.group_id || '—'), value: Number(it.deficit || 0) }))
  }, [deficitItemsASC, ascs])
  const deficitDonut = (effectiveDeficitGroupBy === 'regiao' ? deficitWithLabels : deficitWithLabelsASC || []).map(d => ({ label: d.label, value: Math.max(0, Number(d.value) || 0) }))
  const selectedRegiaoId = regiaoId || ascRegiaoId || ''
  const deficitFiltered = useMemo(() => {
    const currentDeficitData = effectiveDeficitGroupBy === 'regiao' ? deficitWithLabels : deficitWithLabelsASC
    if (effectiveDeficitGroupBy === 'regiao') {
      if (!selectedRegiaoId) return currentDeficitData
      return (currentDeficitData || []).filter((it) => it.id === selectedRegiaoId)
    }

    if (ascId) {
      return (currentDeficitData || []).filter((it) => it.id === ascId)
    }

    if (selectedRegiaoId) {
      const visibleAscIds = new Set((ascs || []).map((item) => String(item.id || '')))
      return (currentDeficitData || []).filter((it) => visibleAscIds.has(String(it.id || '')))
    }

    return currentDeficitData
  }, [deficitWithLabels, deficitWithLabelsASC, effectiveDeficitGroupBy, selectedRegiaoId, ascId, ascs])
  const deficitTotalAtual = (deficitFiltered || []).reduce((sum, item) => sum + (item.value || 0), 0)

  const accoesFiltered = useMemo(() => {
    const currentItems = effectiveAccoesGroupBy === 'regiao' ? accoesCounts : accoesCountsASC
    if (effectiveAccoesGroupBy === 'regiao') return currentItems || []
    if (ascId) return (currentItems || []).filter((item) => item.id === ascId || item.label === ascSelecionadaLabel)
    return currentItems || []
  }, [effectiveAccoesGroupBy, accoesCounts, accoesCountsASC, ascId, ascSelecionadaLabel])
  const accoesTotalAtual = (accoesFiltered || []).reduce((sum, item) => sum + Number(item.count || 0), 0)

  const valorRecuperadoFiltered = useMemo(() => {
    const currentItems = effectiveBestGroupBy === 'regiao' ? bestItems : bestItemsASC
    if (effectiveBestGroupBy === 'regiao') return currentItems || []
    if (ascId) return (currentItems || []).filter((item) => item.id === ascId || item.label === ascSelecionadaLabel)
    return currentItems || []
  }, [effectiveBestGroupBy, bestItems, bestItemsASC, ascId, ascSelecionadaLabel])
  const valorRecuperadoAtual = (valorRecuperadoFiltered || []).reduce((sum, item) => sum + Number(item.value || 0), 0)

  // Carregar dados temporais (sempre janela de 12 meses ancorada no mês/ano selecionados)
  useEffect(() => {
    (async () => {
      setTemporalLoading(true); setTemporalError(null)
      try {
        const nowY = now.getFullYear()
        const nowM = now.getMonth() + 1
        // Diferenca de meses do "agora" até ao mês/ano alvo (incluindo o mês alvo)
        let diffToTarget = (nowY - year) * 12 + (nowM - month) + 1
        if (!Number.isFinite(diffToTarget) || diffToTarget < 1) diffToTarget = 1
        // Para obter a janela completa de 12 meses até ao mês alvo, pedimos mais 11 meses para trás
        let monthsToFetch = diffToTarget + 11
        // Limites de segurança
        if (monthsToFetch < 12) monthsToFetch = 12
        if (monthsToFetch > 60) monthsToFetch = 60

        const { data } = await api.privateInspeccoesTemporalGet(
          auth,
          Math.max(12, monthsToFetch),
          tendencia || undefined,
          undefined,
          undefined,
          undefined
        )
        if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
        const allItems = (((data as any)?.items) ?? []) as Array<{ mes?: string; total?: number; deficit?: number }>

        // Construir lista de chaves YYYY-MM para os últimos 12 meses até ao alvo (inclusivo)
        const targetY = year
        const targetM = month
        const keys: string[] = []
        for (let i = 11; i >= 0; i--) {
          const d = new Date(Date.UTC(targetY, targetM - 1, 1))
          d.setUTCMonth(d.getUTCMonth() - i)
          const y = d.getUTCFullYear()
          const m = String(d.getUTCMonth() + 1).padStart(2, '0')
          keys.push(`${y}-${m}`)
        }
        // Mapear para os itens devolvidos, mantendo a ordem dos 12 meses
        const byKey: Record<string, { mes?: string; total?: number; deficit?: number }> = {}
        const toKey = (s: string) => {
          try {
            const m = /^(\d{4})-(\d{2})/.exec(s)
            if (m) return `${m[1]}-${m[2]}`
            const d = new Date(s)
            const y = d.getUTCFullYear()
            const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
            return `${y}-${mm}`
          } catch { return String(s).slice(0, 7) }
        }
        for (const it of allItems) {
          if (it?.mes) {
            const k = toKey(String(it.mes))
            byKey[k] = { ...it, mes: k }
          }
        }
        const window12 = keys.map((k) => byKey[k]).filter(Boolean)
        setTemporalItems(window12)
      } catch (err: any) {
        const status = err?.response?.status
        if (status === 401 || isUnauthorizedBody(err?.response?.data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
        setTemporalError(!status ? 'Sem ligação ao servidor.' : 'Falha ao carregar análise temporal.')
      } finally { setTemporalLoading(false) }
    })()
  }, [api, auth, month, year, tendencia])

  useEffect(() => {
    (async () => {
      setSemComprasTemporalLoading(true); setSemComprasTemporalError(null)
      try {
        const nowY = now.getFullYear()
        const nowM = now.getMonth() + 1
        let diffToTarget = (nowY - year) * 12 + (nowM - month) + 1
        if (!Number.isFinite(diffToTarget) || diffToTarget < 1) diffToTarget = 1
        let monthsToFetch = diffToTarget + 11
        if (monthsToFetch < 12) monthsToFetch = 12
        if (monthsToFetch > 60) monthsToFetch = 60

        const { data } = await api.privateInspeccoesTemporalGet(
          auth,
          Math.max(12, monthsToFetch),
          tendencia || undefined,
          undefined,
          undefined,
          true
        )
        if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
        const allItems = (((data as any)?.items) ?? []) as Array<{ mes?: string; total?: number; deficit?: number }>
        const keys: string[] = []
        for (let i = 11; i >= 0; i--) {
          const d = new Date(Date.UTC(year, month - 1, 1))
          d.setUTCMonth(d.getUTCMonth() - i)
          const y = d.getUTCFullYear()
          const m = String(d.getUTCMonth() + 1).padStart(2, '0')
          keys.push(`${y}-${m}`)
        }
        const byKey: Record<string, { mes?: string; total?: number; deficit?: number }> = {}
        const toKey = (s: string) => {
          try {
            const m = /^(\d{4})-(\d{2})/.exec(s)
            if (m) return `${m[1]}-${m[2]}`
            const d = new Date(s)
            const y = d.getUTCFullYear()
            const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
            return `${y}-${mm}`
          } catch { return String(s).slice(0, 7) }
        }
        for (const it of allItems) {
          if (it?.mes) {
            const k = toKey(String(it.mes))
            byKey[k] = { ...it, mes: k }
          }
        }
        const window12 = keys.map((k) => byKey[k]).filter(Boolean)
        setSemComprasTemporalItems(window12)
      } catch (err: any) {
        const status = err?.response?.status
        if (status === 401 || isUnauthorizedBody(err?.response?.data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
        setSemComprasTemporalError(!status ? 'Sem ligação ao servidor.' : 'Falha ao carregar série temporal de sem compras.')
      } finally {
        setSemComprasTemporalLoading(false)
      }
    })()
  }, [api, auth, month, year, tendencia])

  // Carregar contagens por tendência (distribuição)
  useEffect(() => {
    (async () => {
      setTendLoading(true); setTendError(null)
      try {
        const { data } = await api.privateInspeccoesContagensGet(auth, 'tendencia' as any)
        if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
        const raw = ((data as any)?.items) ?? []
        const mapped: CountItem[] = raw.map((it: any) => ({ id: it?.group_id, label: labelTendencia(it?.group_name || it?.group_id), count: it?.total }))
        setTendCounts(mapped)
      } catch (err: any) {
        const status = err?.response?.status
        if (status === 401 || isUnauthorizedBody(err?.response?.data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
        setTendError(!status ? 'Sem ligação ao servidor.' : 'Falha ao carregar contagens por tendência.')
      } finally { setTendLoading(false) }
    })()
  }, [api, auth])

  // Carregar dados de effectiveness de instalação-ações
  useEffect(() => {
    (async () => {
      setEffectivenessLoading(true); setEffectivenessError(null)
      try {
        const { data } = await accoesApi.privateInstalacaoAccoesEffectivenessGet(auth, -1)
        if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
        const items = ((data as any)?.items) ?? []
        setEffectivenessData(items)
      } catch (err: any) {
        const status = err?.response?.status
        if (status === 401 || isUnauthorizedBody(err?.response?.data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
        setEffectivenessError(!status ? 'Sem ligação ao servidor.' : 'Falha ao carregar dados de effectiveness de instalações.')
      } finally { setEffectivenessLoading(false) }
    })()
  }, [accoesApi, auth])

  // Carregar valor recuperado por região
  useEffect(() => {
    (async () => {
      setBestLoading(true); setBestError(null)
      try {
        const { data } = await accoesApi.privateInstalacaoAccoesValorRecuperadoGet(
          auth,
          'regiao',
          tendencia || undefined,
          marcacaoStatus || undefined,
          analiseStatus || undefined,
          regiaoId || undefined,
          undefined
        )
        if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
        const raw = ((data as any)?.items) ?? []
        const mapped = raw
          .map((it: any) => ({ id: it?.group_id, label: it?.group_name || (regioes.find(r => r.id === it?.group_id)?.name) || it?.group_id, value: Number(it?.valor || it?.value || 0) }))
          .sort((a: any, b: any) => (b.value || 0) - (a.value || 0))
          .slice(0, 10)
        setBestItems(mapped)
      } catch (err: any) {
        const status = err?.response?.status
        if (status === 401 || isUnauthorizedBody(err?.response?.data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
        setBestError(!status ? 'Sem ligação ao servidor.' : 'Falha ao carregar valor recuperado por região.')
      } finally { setBestLoading(false) }
    })()
  }, [accoesApi, auth, tendencia, marcacaoStatus, analiseStatus, regiaoId, regioes])

  // Carregar valor recuperado por ASC
  useEffect(() => {
    (async () => {
      setBestLoadingASC(true); setBestErrorASC(null)
      try {
        const { data } = await accoesApi.privateInstalacaoAccoesValorRecuperadoGet(
          auth,
          'asc' as any,
          tendencia || undefined,
          marcacaoStatus || undefined,
          analiseStatus || undefined,
          regiaoId || undefined,
          ascId || undefined
        )
        if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
        const raw = ((data as any)?.items) ?? []
        const mapped = raw
          .map((it: any) => ({ id: it?.group_id, label: it?.group_name || (ascs.find(a => a.id === it?.group_id)?.name) || it?.group_id, value: Number(it?.valor || it?.value || 0) }))
          .sort((a: any, b: any) => (b.value || 0) - (a.value || 0))
          .slice(0, 10)
        setBestItemsASC(mapped)
      } catch (err: any) {
        const status = err?.response?.status
        if (status === 401 || isUnauthorizedBody(err?.response?.data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
        setBestErrorASC(!status ? 'Sem ligação ao servidor.' : 'Falha ao carregar valor recuperado por ASC.')
      } finally { setBestLoadingASC(false) }
    })()
  }, [accoesApi, auth, tendencia, marcacaoStatus, analiseStatus, regiaoId, ascId, ascs])

  // Carregar contagens de ações por região
  useEffect(() => {
    (async () => {
      setAccoesLoading(true); setAccoesError(null)
      try {
        const { data } = await accoesApi.privateInstalacaoAccoesContagensGet(
          auth,
          'regiao',
          tendencia || undefined,
          marcacaoStatus || undefined,
          analiseStatus || undefined,
          regiaoId || undefined,
          undefined
        )
        if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
        const raw = ((data as any)?.items) ?? []
        const mapped: CountItem[] = raw.map((it: any) => ({ id: it?.group_id, label: (regioes.find(r => r.id === it?.group_id)?.name) || it?.group_id, count: it?.total }))
        setAccoesCounts(mapped)
      } catch (err: any) {
        const status = err?.response?.status
        if (status === 401 || isUnauthorizedBody(err?.response?.data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
        setAccoesError(!status ? 'Sem ligação ao servidor.' : 'Falha ao carregar contagens de ações.')
      } finally { setAccoesLoading(false) }
    })()
  }, [accoesApi, auth, tendencia, marcacaoStatus, analiseStatus, regiaoId, regioes])

  // Carregar contagens de ações por ASC
  useEffect(() => {
    (async () => {
      setAccoesLoadingASC(true); setAccoesErrorASC(null)
      try {
        const { data } = await accoesApi.privateInstalacaoAccoesContagensGet(
          auth,
          'asc' as any,
          tendencia || undefined,
          marcacaoStatus || undefined,
          analiseStatus || undefined,
          regiaoId || undefined,
          ascId || undefined
        )
        if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
        const raw = ((data as any)?.items) ?? []
        const mapped: CountItem[] = raw.map((it: any) => ({ id: it?.group_id, label: (ascs.find(a => a.id === it?.group_id)?.name) || it?.group_id, count: it?.total }))
        setAccoesCountsASC(mapped)
      } catch (err: any) {
        const status = err?.response?.status
        if (status === 401 || isUnauthorizedBody(err?.response?.data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
        setAccoesErrorASC(!status ? 'Sem ligação ao servidor.' : 'Falha ao carregar contagens de ações por ASC.')
      } finally { setAccoesLoadingASC(false) }
    })()
  }, [accoesApi, auth, tendencia, marcacaoStatus, analiseStatus, regiaoId, ascId, ascs])

  return (
    <div style={pageShellStyle}>
      <Card
        title={filtersTitle || 'Filtros'}
        subtitle={filtersSubtitle || 'Refine a análise por período, tendência e estado operacional.'}
        extra={(
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {scopeMode === 'default' ? (
              <button
                type="button"
                onClick={() => setFiltersOpen((open) => !open)}
                style={filtersOpen ? secondaryHeaderButtonActiveStyle : secondaryHeaderButtonStyle}
              >
                {filtersOpen ? 'Ocultar filtros' : 'Mostrar filtros'}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => {
                setYear(currentYear)
                setMonth(currentMonth)
                setRegiaoId(scopeMode === 'default' ? '' : (lockedRegiaoId || ''))
                setAscId(scopeMode === 'asc' ? (lockedAscId || '') : '')
                setTendencia('')
                setMarcacaoStatus('')
                setAnaliseStatus('')
              }}
              style={secondaryHeaderButtonStyle}
            >
              Limpar filtros
            </button>
          </div>
        )}
      >
        {filtersCardLead ? (
          <div style={{ marginBottom: 18 }}>
            {filtersCardLead}
          </div>
        ) : null}
        {scopeMode === 'default' ? (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
            <span style={summaryChipStyle}>Análise mensal</span>
            {regiaoId ? <span style={summaryChipStyle}>Região filtrada</span> : null}
            {ascId ? <span style={summaryChipStyle}>ASC filtrada</span> : null}
            {tendencia ? <span style={summaryChipStyle}>Tendência filtrada</span> : null}
          </div>
        ) : null}
        {filtersExpanded ? (
        <div style={filtersGridStyle}>
          <label style={fieldGroupStyle}>
            <span style={fieldLabelStyle}>Ano</span>
            <select 
              value={year} 
              onChange={(e) => setYear(Number(e.target.value))} 
              style={fieldControlStyle}
            >
              {[0,1,2,3,4,5].map((i) => (
                <option key={i} value={currentYear - i}>{currentYear - i}</option>
              ))}
            </select>
          </label>
          <label style={fieldGroupStyle}>
            <span style={fieldLabelStyle}>Mês</span>
            <select 
              value={month} 
              onChange={(e) => setMonth(Number(e.target.value))} 
              style={fieldControlStyle}
            >
              {MONTH_NAMES_PT.map((name, idx) => (
                <option key={name} value={idx + 1}>{name}</option>
              ))}
            </select>
          </label>
          {!hideRegiaoFilter ? (
            <label style={fieldGroupStyle}>
              <span style={fieldLabelStyle}>Região</span>
              <select 
                value={regiaoId} 
                onChange={(e) => { setRegiaoId(e.target.value); setAscId('') }} 
                style={fieldControlStyle}
              >
                <option value="">Todas as regiões</option>
                {(regioes || []).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </label>
          ) : null}
          {!hideAscFilter ? (
            <label style={fieldGroupStyle}>
              <span style={fieldLabelStyle}>ASC</span>
              <select 
                value={ascId} 
                onChange={(e) => setAscId(e.target.value)} 
                style={fieldControlStyle}
              >
                <option value="">Todas as ASCs</option>
                {(ascs || []).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </label>
          ) : null}
          <label style={fieldGroupStyle}>
            <span style={fieldLabelStyle}>Tendência</span>
            <select 
              value={tendencia} 
              onChange={(e) => setTendencia(e.target.value)} 
              style={fieldControlStyle}
            >
              <option value="">Todas as tendências</option>
              <option value="CRESCENTE">Crescente</option>
              <option value="MUITO_CRESCENTE">Muito crescente</option>
              <option value="NORMAL">Normal</option>
              <option value="DECRESCENTE">Decrescente</option>
              <option value="MUITO_DECRESCENTE">Muito decrescente</option>
              <option value="SEM_COMPRAS">Sem compras</option>
            </select>
          </label>
          <label style={fieldGroupStyle}>
            <span style={fieldLabelStyle}>Estado da Marcação</span>
            <select 
              value={marcacaoStatus} 
              onChange={(e) => setMarcacaoStatus(e.target.value)} 
              style={fieldControlStyle}
            >
              <option value="">Todos os estados</option>
              <option value="EXECUTADO">Executado</option>
              <option value="MARCADO">Marcado</option>
            </select>
          </label>
          <label style={fieldGroupStyle}>
            <span style={fieldLabelStyle}>Estado da Análise</span>
            <select 
              value={analiseStatus} 
              onChange={(e) => setAnaliseStatus(e.target.value)} 
              style={fieldControlStyle}
            >
              <option value="">Todos os estados</option>
              <option value="EM_ANALISE">Em análise</option>
              <option value="ANALISADO">Analisado</option>
            </select>
          </label>
        </div>
        ) : (
          <div style={collapsedFiltersHintStyle}>
            <span>Filtros recolhidos para dar prioridade aos gráficos e indicadores.</span>
            <span>{activeFilterCount > 0 ? `${activeFilterCount} filtro(s) ativo(s)` : 'Sem filtros ativos'}</span>
          </div>
        )}
      </Card>

      {/* Seção de Clientes */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <SectionTitle eyebrow="Clientes" title="Análise de clientes" subtitle="Leitura comparativa de contagens, défice e distribuição territorial." />

        {scopedAscDashboard ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16 }}>
            <SummaryMetricCard
              label="Clientes da ASC"
              value={totalClientesAtual.toLocaleString('pt-PT')}
              accent="#8d4a17"
              surface="#fffdf8"
              border="rgba(101, 74, 32, 0.12)"
            />
            <SummaryMetricCard
              label="Défice total"
              value={formatMoney(deficitTotalAtual)}
              accent="#b42318"
              surface="#fff7f6"
              border="rgba(180, 35, 24, 0.14)"
            />
            <SummaryMetricCard
              label="Ações registadas"
              value={accoesTotalAtual.toLocaleString('pt-PT')}
              accent="#b85d18"
              surface="#fffaf2"
              border="rgba(201, 109, 31, 0.16)"
            />
            <SummaryMetricCard
              label="Valor recuperado"
              value={formatMoney(valorRecuperadoAtual)}
              accent="#0f766e"
              surface="#f2fcfa"
              border="rgba(15, 118, 110, 0.16)"
            />
          </div>
        ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

      {!regiaoId && (
        <Card title={`Clientes — Contagens (${clientesGroupBy === 'regiao' ? 'por região' : 'por ASC'})${tendencia ? ` · Tendência: ${tendencia.replace(/_/g,' ').toLowerCase()}` : ''} · Mês ${monthLabel}` }>
          <div style={segmentedRowStyle}>
            <SegmentedToggleButton active={clientesGroupBy === 'regiao'} tone="primary" onClick={() => setClientesGroupBy('regiao')}>Por Região</SegmentedToggleButton>
            <SegmentedToggleButton active={clientesGroupBy === 'asc'} tone="primary" onClick={() => setClientesGroupBy('asc')}>Por ASC</SegmentedToggleButton>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(clientesGroupBy === 'regiao' ? loading : loadingASC) ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#6b7280' }}>
                <div style={{ marginBottom: 8 }}>A carregar…</div>
                <div style={{ width: '100%', height: 4, background: '#f3f4f6', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: '60%', height: '100%', background: '#c96d1f', borderRadius: 2, animation: 'pulse 1.5s infinite' }} />
                </div>
              </div>
            ) : (
              <ImprovedDonutChart 
                data={donutData} 
                title={`Distribuição por ${clientesGroupBy === 'regiao' ? 'Região' : 'ASC'} · Mês ${monthLabel}`}
                colorScheme="orange"
                size={240}
                metric="count"
                onSegmentClick={(idx) => {
                  const lbl = (donutData[idx] || {}).label
                  if (clientesGroupBy === 'regiao') {
                    const reg = (regioes || []).find(r => (r.name || r.id) === lbl)
                    if (reg && reg.id != null) { handleRegiaoSelection(String(reg.id)); return }
                    const it = (items || []).find(i => (i.label || i.id) === lbl)
                    if (it && it.id != null) { handleRegiaoSelection(String(it.id)) }
                  } else {
                    const asc = (ascs || []).find(a => (a.name || a.id) === lbl)
                    if (asc && asc.id != null) { handleAscSelection(String(asc.id)) }
                  }
                }}
              />
            )}
            <div style={{ padding: '14px 16px', background: '#fffdf8', borderRadius: 16, border: '1px solid rgba(101, 74, 32, 0.12)' }}>
              <div style={{ fontSize: 12, color: '#7b8494', marginBottom: 4, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase' }}>Total de Clientes</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#1f2937' }}>
                {(filtered || []).reduce((sum, item) => sum + (item.count || 0), 0).toLocaleString('pt-PT')}
              </div>
            </div>
          </div>
          {(clientesGroupBy === 'regiao' ? error : errorASC) ? <div style={{ background: '#fee2e2', color: '#991b1b', padding: 8, borderRadius: 8, marginTop: 10 }}>{clientesGroupBy === 'regiao' ? error : errorASC}</div> : null}
        </Card>
      )}

          <Card title={`Défice total (${effectiveDeficitGroupBy === 'regiao' ? 'por região' : 'por ASC'}) · Mês ${monthLabel}`}>
            {!scopedDashboard ? (
              <div style={segmentedRowStyle}>
                <SegmentedToggleButton active={deficitGroupBy === 'regiao'} tone="danger" onClick={() => setDeficitGroupBy('regiao')}>Por Região</SegmentedToggleButton>
                <SegmentedToggleButton active={deficitGroupBy === 'asc'} tone="danger" onClick={() => setDeficitGroupBy('asc')}>Por ASC</SegmentedToggleButton>
              </div>
            ) : null}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(effectiveDeficitGroupBy === 'regiao' ? deficitLoading : deficitLoadingASC) ? (
                <div style={{ padding: 20, textAlign: 'center', color: '#6b7280' }}>
                  <div style={{ marginBottom: 8 }}>A carregar défices…</div>
                  <div style={{ width: '100%', height: 4, background: '#f3f4f6', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ width: '70%', height: '100%', background: '#b42318', borderRadius: 2, animation: 'pulse 1.5s infinite' }} />
                  </div>
                </div>
              ) : (
                <ImprovedDonutChart 
                  data={(deficitFiltered || []).map(d => ({ label: d.label, value: Math.max(0, Number(d.value) || 0) }))} 
                  title={`Défice por ${effectiveDeficitGroupBy === 'regiao' ? 'Região' : 'ASC'} · Mês ${monthLabel}`}
                  colorScheme="red"
                  size={240}
                  metric="currency"
                  onSegmentClick={(idx) => {
                    const lbl = ((deficitFiltered || [])[idx] || {}).label
                    if (effectiveDeficitGroupBy === 'regiao') {
                      const reg = (regioes || []).find(r => (r.name || r.id) === lbl)
                      if (reg && reg.id != null) { handleRegiaoSelection(String(reg.id)) }
                    } else {
                      const asc = (ascs || []).find(a => (a.name || a.id) === lbl)
                      if (asc && asc.id != null) { handleAscSelection(String(asc.id)) }
                    }
                  }}
                />
              )}
              <div style={{ padding: '14px 16px', background: '#fff7f6', borderRadius: 16, border: '1px solid rgba(180, 35, 24, 0.14)' }}>
                <div style={{ fontSize: 12, color: '#991b1b', marginBottom: 4, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase' }}>Défice Total</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#b42318' }}>
                  {formatMoney((deficitFiltered || []).reduce((sum, item) => sum + (item.value || 0), 0))}
                </div>
              </div>
            </div>
            {(effectiveDeficitGroupBy === 'regiao' ? deficitError : deficitErrorASC) ? <div style={{ background: '#fee2e2', color: '#991b1b', padding: 8, borderRadius: 8, marginTop: 10 }}>{effectiveDeficitGroupBy === 'regiao' ? deficitError : deficitErrorASC}</div> : null}
          </Card>

          {regiaoId && (
            <Card title={`Clientes — ASCs da região · Mês ${monthLabel}`}>
              <ImprovedDonutChart
                data={((ascs || []).filter(a => !ascId || a.id === ascId)).map((a) => ({ label: a.name || a.id || '—', value: Number((ascCounts.find(x => x.id === a.id)?.count) ?? 0) }))}
                title={`Distribuição por ASC · Mês ${monthLabel}`}
                colorScheme="orange"
                size={240}
                metric="count"
                onSegmentClick={(idx) => {
                  const arr = (ascs || []).filter(a => !ascId || a.id === ascId)
                  const target = arr[idx]
                  if (target && target.id != null) handleAscSelection(String(target.id))
                }}
              />
            </Card>
          )}
        </div>
        )}

        {/* Tendência: respeita seleção de tendência; oculta quando há região selecionada */}
        {!regiaoId && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
            <Card title={`Clientes — Contagens por tendência · Mês ${monthLabel}`}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {tendLoading ? (
                  <div style={{ padding: 20, textAlign: 'center', color: '#6b7280' }}>
                    <div style={{ marginBottom: 8 }}>A carregar tendências…</div>
                    <div style={{ width: '100%', height: 4, background: '#f3f4f6', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ width: '80%', height: '100%', background: '#0f766e', borderRadius: 2, animation: 'pulse 1.5s infinite' }} />
                    </div>
                  </div>
                ) : (
                  <TrendCategoryChart
                    data={(tendCounts || [])
                      .filter((it) => !tendencia || (it.id?.toUpperCase() === tendencia || it.label === labelTendencia(tendencia)))
                      .map((it) => ({ label: it.label || it.id || '—', value: Number(it.count || 0) }))}
                    title={`Distribuição por Tendência · Mês ${monthLabel}`}
                    onSegmentClick={(idx) => {
                      const arr = (tendCounts || []).filter((it) => !tendencia || (it.id?.toUpperCase() === tendencia || it.label === labelTendencia(tendencia)))
                      const target = arr[idx]
                      if (target && target.id) setTendencia(String(target.id).toUpperCase())
                    }}
                  />
                )}
              </div>
              {tendError ? <div style={{ background: '#fee2e2', color: '#991b1b', padding: 8, borderRadius: 8, marginTop: 10 }}>{tendError}</div> : null}
            </Card>
          </div>
        )}
      </div>

      {/* Seção de Análise Temporal */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <SectionTitle eyebrow="Temporal" title="Análise temporal" subtitle="Acompanhe a evolução do défice e dos clientes sem compras ao longo dos últimos doze meses." />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'stretch' }}>
          <Card title={`Défice temporal — Últimos 12 meses (até ${monthLabel})`}>
            {temporalLoading ? (
              <TemporalCardLoading label="A carregar série temporal de défice…" color="#b42318" />
            ) : temporalError ? (
              <div style={{ background: '#fee2e2', color: '#991b1b', padding: 12, borderRadius: 12 }}>{temporalError}</div>
            ) : (
              <SingleSeriesLineChart
                data={temporalItems}
                metric="deficit"
                color="#b42318"
                fillColor="rgba(180, 35, 24, 0.14)"
                valueFormatter={(value) => formatMoney(value)}
                emptyLabel="Sem dados de défice para mostrar."
              />
            )}
          </Card>

          <Card title={`Sem compras temporal — Últimos 12 meses (até ${monthLabel})`}>
            {semComprasTemporalLoading ? (
              <TemporalCardLoading label="A carregar série temporal de sem compras…" color="#c96d1f" />
            ) : semComprasTemporalError ? (
              <div style={{ background: '#fff4e8', color: '#9a3412', padding: 12, borderRadius: 12 }}>{semComprasTemporalError}</div>
            ) : (
              <SingleSeriesLineChart
                data={semComprasTemporalItems}
                metric="total"
                color="#c96d1f"
                fillColor="rgba(201, 109, 31, 0.14)"
                valueFormatter={(value) => `${value.toLocaleString('pt-PT')} clientes`}
                emptyLabel="Sem dados de clientes sem compras para mostrar."
              />
            )}
          </Card>
        </div>
      </div>

      {/* Seção de Ações */}
      {!scopedAscDashboard ? (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <SectionTitle eyebrow="Ações" title="Análise de ações" subtitle="Compare volume de ações, valor recuperado e eficácia operacional por grupo." />
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'stretch' }}>
          <Card title={`Ações por instalação — Contagens por ${effectiveAccoesGroupBy === 'regiao' ? 'região' : 'ASC'} · Mês ${monthLabel}`}>
            {!scopedDashboard ? (
              <div style={segmentedRowStyle}>
                <SegmentedToggleButton active={accoesGroupBy === 'regiao'} tone="warning" onClick={() => setAccoesGroupBy('regiao')}>Por Região</SegmentedToggleButton>
                <SegmentedToggleButton active={accoesGroupBy === 'asc'} tone="warning" onClick={() => setAccoesGroupBy('asc')}>Por ASC</SegmentedToggleButton>
              </div>
            ) : null}
            {(effectiveAccoesGroupBy === 'regiao' ? accoesLoading : accoesLoadingASC) ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#6b7280' }}>
                <div style={{ marginBottom: 8 }}>A carregar ações…</div>
                <div style={{ width: '100%', height: 4, background: '#f3f4f6', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: '75%', height: '100%', background: '#f59e0b', borderRadius: 2, animation: 'pulse 1.5s infinite' }} />
                </div>
              </div>
            ) : (
              <ImprovedDonutChart
                data={(effectiveAccoesGroupBy === 'regiao' ? accoesCounts : accoesCountsASC || []).map((it) => ({ label: it.label || it.id || '—', value: Number(it.count || 0) }))}
                title={`Ações por ${effectiveAccoesGroupBy === 'regiao' ? 'Região' : 'ASC'} · Mês ${monthLabel}`}
                colorScheme="orange"
                metric="count"
                onSegmentClick={(idx) => {
                  if (effectiveAccoesGroupBy === 'regiao') {
                    const lbl = ((accoesCounts || [])[idx] || {}).label || ((accoesCounts || [])[idx] || {}).id
                    const reg = (regioes || []).find(r => (r.name || r.id) === lbl)
                    if (reg && reg.id != null) { handleRegiaoSelection(String(reg.id)) }
                  } else {
                    const lbl = ((accoesCountsASC || [])[idx] || {}).label || ((accoesCountsASC || [])[idx] || {}).id
                    const asc = (ascs || []).find(a => (a.name || a.id) === lbl)
                    if (asc && asc.id != null) { handleAscSelection(String(asc.id)) }
                  }
                }}
              />
            )}
            {(effectiveAccoesGroupBy === 'regiao' ? accoesError : accoesErrorASC) ? <div style={{ background: '#fee2e2', color: '#991b1b', padding: 8, borderRadius: 8, marginTop: 10 }}>{effectiveAccoesGroupBy === 'regiao' ? accoesError : accoesErrorASC}</div> : null}
          </Card>

          <Card title={`${effectiveBestGroupBy === 'regiao' ? 'Melhores Regiões por valor recuperado' : 'Melhores ASCs por valor recuperado'} · Mês ${monthLabel}`}>
            {!scopedDashboard ? (
              <div style={segmentedRowStyle}>
                <SegmentedToggleButton active={bestGroupBy === 'regiao'} tone="success" onClick={() => setBestGroupBy('regiao')}>Por Região</SegmentedToggleButton>
                <SegmentedToggleButton active={bestGroupBy === 'asc'} tone="success" onClick={() => setBestGroupBy('asc')}>Por ASC</SegmentedToggleButton>
              </div>
            ) : null}
            {(effectiveBestGroupBy === 'regiao' ? bestLoading : bestLoadingASC) ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#6b7280' }}>
                <div style={{ marginBottom: 8 }}>A carregar melhores grupos…</div>
                <div style={{ width: '100%', height: 4, background: '#f3f4f6', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: '85%', height: '100%', background: '#10b981', borderRadius: 2, animation: 'pulse 1.5s infinite' }} />
                </div>
              </div>
            ) : (
              <ImprovedDonutChart
                data={(effectiveBestGroupBy === 'regiao' ? bestItems : bestItemsASC || []).map((it) => ({ label: it.label || it.id || '—', value: Number(it.value || 0) }))}
                title={`Valor Recuperado por ${effectiveBestGroupBy === 'regiao' ? 'Região' : 'ASC'} · Mês ${monthLabel}`}
                colorScheme="green"
                metric="currency"
                onSegmentClick={(idx) => {
                  if (effectiveBestGroupBy === 'regiao') {
                    const lbl = ((bestItems || [])[idx] || {}).label || ((bestItems || [])[idx] || {}).id
                    const reg = (regioes || []).find(r => (r.name || r.id) === lbl)
                    if (reg && reg.id != null) { handleRegiaoSelection(String(reg.id)) }
                  } else {
                    const lbl = ((bestItemsASC || [])[idx] || {}).label || ((bestItemsASC || [])[idx] || {}).id
                    const asc = (ascs || []).find(a => (a.name || a.id) === lbl)
                    if (asc && asc.id != null) { handleAscSelection(String(asc.id)) }
                  }
                }}
              />
            )}
            {(effectiveBestGroupBy === 'regiao' ? bestError : bestErrorASC) ? <div style={{ background: '#fee2e2', color: '#991b1b', padding: 8, borderRadius: 8, marginTop: 10 }}>{effectiveBestGroupBy === 'regiao' ? bestError : bestErrorASC}</div> : null}
          </Card>
        </div>
      </div>
      ) : null}
    </div>
  )
}

function SectionTitle({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return (
    <div style={sectionTitleWrapStyle}>
      <span style={sectionEyebrowStyle}>{eyebrow}</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <h3 style={{ margin: 0, fontSize: 24, lineHeight: 1.1, color: '#1f2937' }}>{title}</h3>
        <p style={{ margin: 0, color: '#5f6673', lineHeight: 1.6 }}>{subtitle}</p>
      </div>
    </div>
  )
}

function SummaryMetricCard({
  label,
  value,
  accent,
  surface,
  border,
}: {
  label: string
  value: string
  accent: string
  surface: string
  border: string
}) {
  return (
    <div style={{ padding: '18px 20px', borderRadius: 20, background: surface, border: `1px solid ${border}`, boxShadow: '0 10px 24px rgba(76, 57, 24, 0.06)' }}>
      <div style={{ fontSize: 12, color: accent, marginBottom: 8, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 28, lineHeight: 1.1, fontWeight: 800, color: '#1f2937' }}>{value || '0'}</div>
    </div>
  )
}

function SegmentedToggleButton({
  active,
  tone,
  children,
  onClick,
}: {
  active: boolean
  tone: 'primary' | 'danger' | 'warning' | 'success'
  children: React.ReactNode
  onClick: () => void
}) {
  const tones: Record<'primary' | 'danger' | 'warning' | 'success', React.CSSProperties> = {
    primary: active
      ? { background: 'linear-gradient(180deg, #d77a28 0%, #b85d18 100%)', color: '#fffaf5', border: '1px solid rgba(201, 109, 31, 0.20)' }
      : { background: 'linear-gradient(180deg, #fffaf2 0%, #f6ecde 100%)', color: '#8d4a17', border: '1px solid rgba(101, 74, 32, 0.16)' },
    danger: active
      ? { background: 'linear-gradient(180deg, #d05045 0%, #b42318 100%)', color: '#fff7f7', border: '1px solid rgba(180, 35, 24, 0.22)' }
      : { background: '#fff7f6', color: '#b42318', border: '1px solid rgba(180, 35, 24, 0.14)' },
    warning: active
      ? { background: 'linear-gradient(180deg, #d77a28 0%, #b85d18 100%)', color: '#fffaf5', border: '1px solid rgba(201, 109, 31, 0.20)' }
      : { background: '#fffaf2', color: '#8d4a17', border: '1px solid rgba(101, 74, 32, 0.16)' },
    success: active
      ? { background: 'linear-gradient(180deg, #1f8f78 0%, #0f766e 100%)', color: '#f2fffb', border: '1px solid rgba(15, 118, 110, 0.20)' }
      : { background: '#f2fcfa', color: '#0f766e', border: '1px solid rgba(15, 118, 110, 0.16)' },
  }

  return (
    <button type="button" onClick={onClick} style={{ ...segmentedButtonBaseStyle, ...tones[tone] }}>
      {children}
    </button>
  )
}

const pageShellStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  padding: '8px 4px 24px',
}

const screenHeroStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 16,
  flexWrap: 'wrap',
  padding: '24px 28px',
  borderRadius: 28,
  border: '1px solid rgba(101, 74, 32, 0.14)',
  background: 'linear-gradient(135deg, rgba(255, 253, 248, 0.98) 0%, rgba(243, 233, 214, 0.94) 100%)',
  boxShadow: '0 18px 40px rgba(76, 57, 24, 0.10)',
}

const screenEyebrowStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: '.16em',
  textTransform: 'uppercase',
  color: '#8d4a17',
}

const heroMetricsRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
  justifyContent: 'flex-end',
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

const secondaryHeaderButtonStyle: React.CSSProperties = {
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

const secondaryHeaderButtonActiveStyle: React.CSSProperties = {
  ...secondaryHeaderButtonStyle,
  border: '1px solid rgba(201, 109, 31, 0.28)',
  background: 'linear-gradient(180deg, rgba(255, 244, 230, 0.98) 0%, rgba(248, 231, 205, 0.92) 100%)',
  boxShadow: '0 12px 24px rgba(76, 57, 24, 0.10)',
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
  borderRadius: 14,
  border: '1px solid rgba(101, 74, 32, 0.14)',
  background: '#fffdf9',
  color: '#1f2937',
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

const sectionTitleWrapStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  padding: '4px 2px 0',
}

const sectionEyebrowStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: '.14em',
  textTransform: 'uppercase',
  color: '#8d4a17',
}

const segmentedRowStyle: React.CSSProperties = {
  marginBottom: 16,
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
}

const segmentedButtonBaseStyle: React.CSSProperties = {
  minHeight: 38,
  padding: '0 14px',
  borderRadius: 14,
  fontSize: 13,
  fontWeight: 800,
  cursor: 'pointer',
  boxShadow: '0 8px 18px rgba(76, 57, 24, 0.08)',
}

function DonutChart({ data, legendMaxHeight, size = 160, thickness = 12, onSegmentClick }: { data: Array<{ label: string; value: number }>; legendMaxHeight?: number; size?: number; thickness?: number; onSegmentClick?: (index: number) => void }) {
  const [hoverIdx, setHoverIdx] = React.useState<number | null>(null)
  const total = data.reduce((s, d) => s + (Number.isFinite(d.value) ? d.value : 0), 0)
  const W = size
  const H = size
  const CX = W / 2
  const CY = H / 2
  const R = Math.max(20, (size / 2) - thickness - 4)
  const C = 2 * Math.PI * R
  const colors = ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#f97316', '#84cc16']
  let acc = 0
  const segments = total > 0 ? data.map((d, i) => {
     const val = Math.max(0, Number(d.value) || 0)
     const frac = val / total
     const len = frac * C
     const seg = { offset: acc, length: len, color: colors[i % colors.length], label: d.label, value: val }
     acc += len
     return seg
   }) : []
   return (
     <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
       <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" role="img" aria-label="Donut chart">
         <circle cx={CX} cy={CY} r={R} fill="#fff" stroke="#e5e7eb" strokeWidth={thickness} />
        {segments.map((s, i) => {
          const isHover = hoverIdx === i
          const hasHover = hoverIdx !== null
          const scale = isHover ? 1.08 : 1
          const opacity = hasHover ? (isHover ? 1 : 0.55) : 1
          return (
            <circle key={i}
                   cx={CX}
                   cy={CY}
                   r={R}
                   fill="transparent"
                   stroke={s.color}
                   strokeWidth={thickness}
                   strokeDasharray={`${s.length} ${C - s.length}`}
                   strokeDashoffset={-s.offset}
                  style={{ transition: 'transform 160ms ease, opacity 160ms ease', cursor: onSegmentClick ? 'pointer' : 'default', opacity, transformOrigin: `${CX}px ${CY}px`, transform: `scale(${scale})` }}
                  onMouseEnter={() => setHoverIdx(i)}
                  onMouseLeave={() => setHoverIdx(null)}
                  onClick={() => { if (onSegmentClick) onSegmentClick(i) }}
            />
          )
        })}
        <circle cx={CX} cy={CY} r={Math.max(2, R - thickness - 4)} fill="#fff" />
        <text x={CX} y={CY} textAnchor="middle" dominantBaseline="middle" fontSize={13} fill="#374151" fontWeight={700}>
          {total}
        </text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, maxHeight: legendMaxHeight, overflowY: legendMaxHeight ? 'auto' : undefined }}>
        {data.slice(0, 6).map((d, i) => (
          <div
            key={i}
            style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: onSegmentClick ? 'pointer' : 'default', opacity: hoverIdx !== null ? (hoverIdx === i ? 1 : 0.55) : 1, transition: 'opacity 120ms ease' }}
            onMouseEnter={() => setHoverIdx(i)}
            onMouseLeave={() => setHoverIdx(null)}
            onClick={() => { if (onSegmentClick) onSegmentClick(i) }}
          >
            <span style={{ width: 10, height: 10, borderRadius: 2, background: colors[i % colors.length], display: 'inline-block' }} />
            <span style={{ color: '#374151' }}>{d.label}</span>
            <span style={{ marginLeft: 'auto', color: '#111827', fontWeight: 700 }}>{d.value}</span>
          </div>
        ))}
        {data.length === 0 && <div style={{ color: '#6b7280' }}>Sem dados</div>}
      </div>
    </div>
  )
}

function formatMoney(n?: number) {
  if (typeof n !== 'number' || Number.isNaN(n)) return '—'
  try { return `${n.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT` } catch { return `${n.toFixed(2)} MT` }
}

function formatKwh(n?: number) {
  if (typeof n !== 'number' || Number.isNaN(n)) return '—'
  try { return `${n.toLocaleString('pt-PT')} kWh` } catch { return `${n} kWh` }
}

function trendTone(label?: string) {
  const text = String(label || '').toLowerCase()
  if (text.includes('sem compras')) {
    return {
      fill: '#b42318',
      border: 'rgba(180, 35, 24, 0.18)',
      surface: '#fff4f3',
      text: '#b42318',
    }
  }
  if (text.includes('muito crescente')) {
    return {
      fill: '#2b8a78',
      border: 'rgba(43, 138, 120, 0.16)',
      surface: '#eef9f5',
      text: '#2b8a78',
    }
  }
  if (text.includes('muito decrescente')) {
    return {
      fill: '#d98a3d',
      border: 'rgba(217, 138, 61, 0.18)',
      surface: '#fff8ef',
      text: '#a85f1f',
    }
  }
  if (text.includes('decrescente')) {
    return {
      fill: '#e2bb59',
      border: 'rgba(226, 187, 89, 0.22)',
      surface: '#fffcef',
      text: '#9d7a20',
    }
  }
  if (text.includes('crescente')) {
    return {
      fill: '#90c9a7',
      border: 'rgba(144, 201, 167, 0.24)',
      surface: '#f4fbf6',
      text: '#4d7a5f',
    }
  }
  return {
    fill: '#3056a6',
    border: 'rgba(48, 86, 166, 0.16)',
    surface: '#f4f7ff',
    text: '#3056a6',
  }
}

function InstallationEffectivenessChart({ data }: { data: any[] }) {
  const { getApiConfig, getAuthorizationHeaderValue } = useAuth()
  const accaoTipoApi = useMemo(() => new InstalacaoAccaoTipoApi(getApiConfig()), [getApiConfig])
  const authHeader = useMemo(() => getAuthorizationHeaderValue(), [getAuthorizationHeaderValue])
  
  const [accaoTiposLookup, setAccaoTiposLookup] = useState<Record<string, any>>({})
  const [loadingAccaoTipos, setLoadingAccaoTipos] = useState(false)

  // Carregar todos os tipos de ação uma vez para fazer lookup
  useEffect(() => {
    (async () => {
      setLoadingAccaoTipos(true)
      try {
        const { data: tiposResponse } = await accaoTipoApi.privateInstalacaoAccaoTiposGet(
          authHeader, 
          -1, // página -1 para retornar todos
          1000 // tamanho grande para garantir que pega todas
        )
        
        const tiposItems = ((tiposResponse as any)?.items) ?? []
        console.log('Todos os tipos de ação carregados:', tiposItems) // Debug
        
        // Criar lookup por ID
        const lookup: Record<string, any> = {}
        tiposItems.forEach((tipo: any) => {
          if (tipo?.id) {
            lookup[tipo.id] = tipo
          }
        })
        
        setAccaoTiposLookup(lookup)
      } catch (err: any) {
        console.warn('Erro ao carregar tipos de ação:', err)
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          // Erro de autorização - não fazer nada
          return
        }
      } finally {
        setLoadingAccaoTipos(false)
      }
    })()
  }, [accaoTipoApi, authHeader])

  if (!data || data.length === 0) {
    return <div style={{ padding: 20, textAlign: 'center', color: '#6b7280' }}>Sem dados de effectiveness de instalações disponíveis.</div>
  }

  if (loadingAccaoTipos) {
    return <div style={{ padding: 20, textAlign: 'center', color: '#6b7280' }}>A carregar tipos de ação…</div>
  }

  // Agrupar por tipo de ação e somar valor recuperado
  const groupedData = data.reduce((acc: any, item: any) => {
    let tipoNome = 'Sem tipo'
    
    // Primeiro tentar usar accao_tipo do item
    if (item?.accao_tipo?.nome) {
      tipoNome = item.accao_tipo.nome
    } else if (item?.accao_tipo_id && accaoTiposLookup[item.accao_tipo_id]) {
      // Buscar o nome do tipo de ação usando o lookup
      const tipoDetail = accaoTiposLookup[item.accao_tipo_id]
      console.log(`Detalhes do tipo ${item.accao_tipo_id}:`, tipoDetail) // Debug
      tipoNome = tipoDetail?.nome || 
                 tipoDetail?.name || 
                 tipoDetail?.title || 
                 tipoDetail?.descricao ||
                 `Tipo ${item.accao_tipo_id}`
      console.log(`Nome extraído: "${tipoNome}"`) // Debug
    } else if (item?.accao_tipo_id) {
      tipoNome = `Tipo ${item.accao_tipo_id}`
      console.log(`Usando fallback para tipo ${item.accao_tipo_id}: "${tipoNome}"`) // Debug
    } else if (item?.accao_id) {
      tipoNome = `Ação ${item.accao_id}`
      console.log(`Usando fallback para ação ${item.accao_id}: "${tipoNome}"`) // Debug
    }
    
    const valorRecuperado = Number(item?.valor_recuperado || 0)
    
    if (!acc[tipoNome]) {
      acc[tipoNome] = 0
    }
    acc[tipoNome] += valorRecuperado
    
    return acc
  }, {})

  // Converter para array e ordenar por valor
  const chartData = Object.entries(groupedData)
    .map(([label, value]) => ({ label, value: value as number }))
    .filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 8) // Top 8 tipos

  if (chartData.length === 0) {
    return <div style={{ padding: 20, textAlign: 'center', color: '#6b7280' }}>Sem dados com valor recuperado disponíveis.</div>
  }

  const total = chartData.reduce((sum, item) => sum + item.value, 0)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
              <th style={{ padding: '12px 8px', textAlign: 'left', color: '#374151', fontWeight: 600 }}>Tipo de Ação</th>
              <th style={{ padding: '12px 8px', textAlign: 'right', color: '#374151', fontWeight: 600 }}>Valor Recuperado (kWh)</th>
              <th style={{ padding: '12px 8px', textAlign: 'center', color: '#374151', fontWeight: 600 }}>% do Total</th>
            </tr>
          </thead>
          <tbody>
            {chartData.map((item, i) => {
              const percentage = total > 0 ? (item.value / total) * 100 : 0
              return (
                <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px 8px' }}>
                    <div style={{ fontWeight: 600, color: '#111827' }}>{item.label}</div>
                  </td>
                  <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>
                    {formatKwh(item.value)}
                  </td>
                  <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <div style={{ 
                        width: 60, 
                        height: 8, 
                        background: '#f3f4f6', 
                        borderRadius: 4, 
                        overflow: 'hidden',
                        position: 'relative'
                      }}>
                        <div style={{ 
                          width: `${Math.max(0, Math.min(100, percentage))}%`, 
                          height: '100%', 
                          background: '#16a34a',
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                      <span style={{ 
                        fontSize: 12, 
                        fontWeight: 600,
                        color: '#16a34a',
                        padding: '2px 6px',
                        borderRadius: 6,
                        background: '#dcfce715'
                      }}>
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ padding: 16, background: '#f0fdf4', borderRadius: 12, border: '1px solid #bbf7d0' }}>
          <div style={{ fontSize: 12, color: '#166534', fontWeight: 600, marginBottom: 4 }}>Total Recuperado</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#15803d' }}>
            {formatKwh(total)}
          </div>
        </div>
        <div style={{ padding: 16, background: '#f0fdf4', borderRadius: 12, border: '1px solid #bbf7d0' }}>
          <div style={{ fontSize: 12, color: '#166534', fontWeight: 600, marginBottom: 4 }}>Tipos de Ação</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#15803d' }}>
            {chartData.length}
          </div>
        </div>
        <div style={{ padding: 16, background: '#f0fdf4', borderRadius: 12, border: '1px solid #bbf7d0' }}>
          <div style={{ fontSize: 12, color: '#166534', fontWeight: 600, marginBottom: 4 }}>Ações Totais</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#15803d' }}>
            {data.length}
          </div>
        </div>
      </div>
    </div>
  )
}

function formatMonth(m?: string) {
  if (!m) return '—'
  // Expecting formats like "2025-09" or ISO. We will show MM/YYYY if possible.
  const match = /^(\d{4})-(\d{2})/.exec(m)
  if (match) return `${match[2]}/${match[1]}`
  try { const d = new Date(m); const mm = `${d.getUTCMonth()+1}`.padStart(2, '0'); const yy = d.getUTCFullYear(); return `${mm}/${yy}` } catch { return m }
}

function TimeSeriesDual({ data }: { data: Array<{ mes?: string; total?: number; deficit?: number }> }) {
  const series = Array.isArray(data) ? data : []
  const xs = series.map((_, i) => i)
  const totals = series.map((d) => Number(d.total || 0))
  const deficits = series.map((d) => Number(d.deficit || 0))
  const maxY = Math.max(1, ...totals, ...deficits)
  const W = 420
  const H = 220
  const P = 28
  const innerW = W - P * 2
  const innerH = H - P * 2
  const sx = (i: number) => (series.length <= 1 ? P + innerW / 2 : P + (i * innerW) / (series.length - 1))
  const sy = (v: number) => P + innerH - (Math.min(Math.max(v, 0), maxY) / maxY) * innerH

  const path = (vals: number[]) => vals.map((v, i) => `${i === 0 ? 'M' : 'L'} ${sx(i)} ${sy(v)}`).join(' ')
  const gridY = [0, 0.25, 0.5, 0.75, 1]
  const labels = series.map((d) => formatMonth(d.mes))
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="220" role="img" aria-label="Série temporal">
      <rect x={0} y={0} width={W} height={H} fill="#ffffff" rx={8} />
      {gridY.map((g, i) => (
        <g key={i}>
          <line x1={P} y1={P + g * innerH} x2={W - P} y2={P + g * innerH} stroke="#e5e7eb" strokeWidth={1} />
          <text x={4} y={P + g * innerH + 4} fill="#6b7280" fontSize={10}>{Math.round((1 - g) * maxY)}</text>
        </g>
      ))}
      {/* totals line (blue) */}
      <path d={path(totals)} fill="none" stroke="#0ea5e9" strokeWidth={2} />
      {/* deficit line (red) */}
      <path d={path(deficits)} fill="none" stroke="#ef4444" strokeWidth={2} />
      {/* x labels */}
      {labels.map((lb, i) => (
        <text key={i} x={sx(i)} y={H - 4} fontSize={10} fill="#6b7280" textAnchor="middle">{lb}</text>
      ))}
      {/* legend */}
      <g>
        <rect x={W - 160} y={8} width={150} height={20} fill="#fff" />
        <circle cx={W - 146} cy={18} r={4} fill="#0ea5e9" />
        <text x={W - 136} y={22} fontSize={11} fill="#111827">Clientes</text>
        <circle cx={W - 82} cy={18} r={4} fill="#ef4444" />
        <text x={W - 72} y={22} fontSize={11} fill="#111827">Défice</text>
      </g>
    </svg>
  )
}

function labelTendencia(v?: string) {
  const x = String(v || '').toUpperCase()
  switch (x) {
    case 'CRESCENTE': return 'Crescente'
    case 'MUITO_CRESCENTE': return 'Muito crescente'
    case 'NORMAL': return 'Normal'
    case 'DECRESCENTE': return 'Decrescente'
    case 'MUITO_DECRESCENTE': return 'Muito decrescente'
    case 'SEM_COMPRAS': return 'Sem compras'
    default: return v || '—'
  }
}

function labelAnalise(v?: string) {
  const x = String(v || '').toUpperCase()
  switch (x) {
    case 'EM_ANALISE': return 'Em análise'
    case 'ANALISADO': return 'Analisado'
    default: return v || '—'
  }
}

// Componentes melhorados

function ImprovedDonutChart({ data, title, colorScheme = 'default', size = 200, metric = 'number', onSegmentClick }: { 
  data: Array<{ label: string; value: number }>; 
  title: string; 
  colorScheme?: 'default' | 'red' | 'green' | 'orange' | 'purple' | 'cyan';
  size?: number;
  metric?: 'count' | 'currency' | 'number';
  onSegmentClick?: (index: number) => void;
}) {
  const [hoverIdx, setHoverIdx] = React.useState<number | null>(null)
  const getColorScheme = (scheme: string) => {
    switch (scheme) {
      case 'red': return ['#f7c9c5', '#eea29a', '#de7568', '#c95a4f', '#b42318', '#8f1d14']
      case 'green': return ['#c9ece7', '#9edfd5', '#64c5b7', '#2fa191', '#0f766e', '#0a5c56']
      case 'orange': return ['#f4d4b0', '#ebb67e', '#df954a', '#c96d1f', '#a95718', '#8d4a17']
      case 'purple': return ['#eadcbf', '#dec49d', '#d1ab79', '#c96d1f', '#a95718', '#8d4a17']
      case 'cyan': return ['#d3ece9', '#afded9', '#78c6be', '#42a59a', '#0f766e', '#0a5c56']
      default: return ['#eadcbf', '#dec49d', '#d1ab79', '#c96d1f', '#a95718', '#8d4a17']
    }
  }

  const colors = getColorScheme(colorScheme)
  const total = data.reduce((s, d) => s + (Number.isFinite(d.value) ? d.value : 0), 0)
  const cleanData = data.filter(d => d.value > 0).slice(0, 6)
  
  if (total === 0 || cleanData.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', textAlign: 'center' }}>{title}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: size }}>
          <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📊</div>
            <div>Sem dados disponíveis</div>
          </div>
        </div>
      </div>
    )
  }

  // Usar método mais simples e confiável com stroke-dasharray
  const radius = size / 2 - 20
  const circumference = 2 * Math.PI * radius
  let accumulatedPercentage = 0

  const segments = cleanData.map((item, i) => {
    const percentage = (item.value / total) * 100
    const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`
    const startPct = accumulatedPercentage
    const strokeDashoffset = -((startPct / 100) * circumference)
    const midPct = startPct + (percentage / 2)
    
    const segment = {
      ...item,
      percentage,
      color: colors[i % colors.length],
      strokeDasharray,
      strokeDashoffset,
      midPct
    }
    
    accumulatedPercentage += percentage
    return segment
  })

  // Formatação do valor total
  const formatTotal = (value: number) => {
    if (metric === 'currency') {
      return formatMoney(value)
    }
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`
    }
    return value.toLocaleString('pt-PT')
  }

  const formatValue = (value: number) => {
    if (metric === 'currency') return formatMoney(value)
    return value.toLocaleString('pt-PT')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', textAlign: 'center' }}>{title}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(180px, 220px) minmax(0, 1fr)', gap: 18, alignItems: 'center' }}>
        <div style={{ position: 'relative', width: size, height: size, justifySelf: 'center' }}>
          <svg viewBox={`0 0 ${size} ${size}`} width="100%" height="100%">
            {/* Círculo de fundo */}
            <circle 
              cx={size/2} 
              cy={size/2} 
              r={radius} 
              fill="none" 
              stroke="#efe7da" 
              strokeWidth="16"
            />
            
            {/* Segmentos do donut */}
            {segments.map((segment, i) => {
              const isHover = hoverIdx === i
              const hasHover = hoverIdx !== null
              const scale = isHover ? 1.08 : 1
              const opacity = hasHover ? (isHover ? 1 : 0.55) : 1
              return (
                <circle
                  key={i}
                  cx={size/2}
                  cy={size/2}
                  r={radius}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth="16"
                  strokeLinecap="round"
                  strokeDasharray={segment.strokeDasharray}
                  strokeDashoffset={segment.strokeDashoffset}
                  transform={`rotate(-90 ${size/2} ${size/2})`}
                  style={{ 
                    transition: 'transform 160ms ease, opacity 160ms ease',
                    filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))',
                    cursor: onSegmentClick ? 'pointer' : 'default',
                    transformOrigin: `${size/2}px ${size/2}px`,
                    transform: `scale(${scale})` as any,
                    opacity
                  }}
                  onMouseEnter={() => setHoverIdx(i)}
                  onMouseLeave={() => setHoverIdx(null)}
                  onClick={() => { if (onSegmentClick) onSegmentClick(i) }}
                />
              )
            })}
            
            {/* Círculo interno e texto */}
            <circle cx={size/2} cy={size/2} r={radius - 25} fill="#fffdf8" stroke="rgba(101, 74, 32, 0.12)" strokeWidth="1" />
            <text x={size/2} y={size/2 - 6} textAnchor="middle" fontSize="18" fontWeight="700" fill="#1f2937">
              {formatTotal(total)}
            </text>
            <text x={size/2} y={size/2 + 12} textAnchor="middle" fontSize="11" fill="#6b7280">
              total
            </text>
          </svg>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: size - 12, overflowY: 'auto', paddingRight: 4 }}>
          {segments.map((segment, i) => (
            <div
              key={i}
              style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 12, cursor: onSegmentClick ? 'pointer' : 'default', opacity: hoverIdx !== null ? (hoverIdx === i ? 1 : 0.55) : 1, transition: 'opacity 120ms ease', padding: '8px 10px', borderRadius: 14, background: 'rgba(255, 252, 247, 0.82)', border: '1px solid rgba(101, 74, 32, 0.08)' }}
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
              onClick={() => { if (onSegmentClick) onSegmentClick(i) }}
            >
              <div style={{ 
                width: 12, 
                height: 12, 
                borderRadius: 2, 
                background: segment.color, 
                flexShrink: 0,
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, color: '#374151', overflowWrap: 'anywhere' }}>
                  {segment.label}
                </div>
                <div style={{ color: '#6b7280', fontSize: 11 }}>
                  {segment.percentage.toFixed(1)}% · {formatValue(segment.value)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function InspectionCountsTable({ data }: { data: CountItem[] }) {
  const rows = [...data].sort((a, b) => (b.count || 0) - (a.count || 0))
  const maxCount = Math.max(...rows.map(d => d.count || 0), 1)
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {rows.length === 0 ? (
        <div style={{ padding: 20, textAlign: 'center', color: '#9ca3af' }}>Sem dados para mostrar</div>
      ) : (
        rows.map((item, i) => (
          <div key={i} style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr auto', 
            alignItems: 'center', 
            padding: '12px 16px', 
            background: '#fff',
            border: '1px solid #f1f5f9',
            borderRadius: 8,
            marginBottom: 4,
            transition: 'all 0.2s',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#f1f5f9' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ 
                width: 8, 
                height: 8, 
                borderRadius: 4, 
                background: `hsl(${220 + i * 40}, 60%, 55%)` 
              }} />
              <div style={{ fontWeight: 600, color: '#1e293b' }}>{item.label || item.id || '—'}</div>
            </div>
            <div style={{ 
              fontSize: 18, 
              fontWeight: 800, 
              color: '#1e293b',
              padding: '4px 10px',
              lineHeight: '22px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 8
            }}>
              {(item.count || 0).toLocaleString('pt-PT')}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

function DeficitTable({ data }: { data: Array<{ label: string; value: number }> }) {
  const rows = [...data].sort((a, b) => (b.value || 0) - (a.value || 0))
  const maxValue = Math.max(...rows.map(d => d.value || 0), 1)
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {rows.length === 0 ? (
        <div style={{ padding: 20, textAlign: 'center', color: '#9ca3af' }}>Sem défices registados</div>
      ) : (
        rows.map((item, i) => (
          <div key={i} style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr auto', 
            alignItems: 'center', 
            padding: '12px 16px', 
            background: '#fff',
            border: '1px solid #fecaca',
            borderRadius: 8,
            marginBottom: 4,
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.borderColor = '#f87171' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#fecaca' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ 
                width: 8, 
                height: 8, 
                borderRadius: 4, 
                background: `hsl(${0 + i * 10}, 70%, ${60 - i * 5}%)` 
              }} />
              <div style={{ fontWeight: 600, color: '#7f1d1d' }}>{item.label}</div>
            </div>
            <div style={{ 
              fontSize: 16, 
              fontWeight: 800, 
              color: '#dc2626',
              padding: '4px 10px',
              lineHeight: '22px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 8
            }}>
              {formatMoney(item.value)}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

function TrendTable({ data }: { data: CountItem[] }) {
  const getTrendColor = (label: string) => {
    if (label.includes('Crescente')) return '#059669'
    if (label.includes('Decrescente')) return '#dc2626'
    if (label.includes('Normal')) return '#0891b2'
    return '#6b7280'
  }

  const getTrendIcon = (label: string) => {
    if (label.includes('Crescente')) return '↗'
    if (label.includes('Decrescente')) return '↘'
    if (label.includes('Normal')) return '→'
    return '—'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {data.length === 0 ? (
        <div style={{ padding: 20, textAlign: 'center', color: '#9ca3af' }}>Sem dados de tendência</div>
      ) : (
        data.map((item, i) => {
          const color = getTrendColor(item.label || '')
          const icon = getTrendIcon(item.label || '')
          
          return (
            <div key={i} style={{ 
              display: 'grid', 
              gridTemplateColumns: 'auto 1fr auto', 
              alignItems: 'center', 
              padding: '14px 16px', 
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: 10,
              gap: 12,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <div style={{ 
                fontSize: 20, 
                color, 
                fontWeight: 'bold',
                width: 24,
                textAlign: 'center'
              }}>
                {icon}
              </div>
              <div>
                <div style={{ fontWeight: 600, color: '#1e293b' }}>{item.label || item.id || '—'}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>Tendência de compras</div>
              </div>
              <div style={{ 
                fontSize: 18, 
                fontWeight: 800, 
                color,
                padding: '4px 12px',
                background: `${color}15`,
                borderRadius: 20,
                border: `1px solid ${color}30`
              }}>
                {(item.count || 0).toLocaleString('pt-PT')}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}

function TrendCategoryChart({
  data,
  title,
  onSegmentClick,
}: {
  data: Array<{ label: string; value: number }>
  title: string
  onSegmentClick?: (index: number) => void
}) {
  const trendOrder = ['Muito crescente', 'Crescente', 'Normal', 'Decrescente', 'Muito decrescente', 'Sem compras']
  const rows = [...data].sort((a, b) => {
    const indexA = trendOrder.findIndex((item) => item.toLowerCase() === String(a.label || '').toLowerCase())
    const indexB = trendOrder.findIndex((item) => item.toLowerCase() === String(b.label || '').toLowerCase())
    const safeA = indexA === -1 ? Number.MAX_SAFE_INTEGER : indexA
    const safeB = indexB === -1 ? Number.MAX_SAFE_INTEGER : indexB
    if (safeA !== safeB) return safeA - safeB
    return (b.value || 0) - (a.value || 0)
  })
  const maxValue = Math.max(...rows.map((item) => item.value || 0), 1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#374151' }}>{title}</div>
      {rows.length === 0 ? (
        <div style={{ padding: 20, textAlign: 'center', color: '#9ca3af' }}>Sem dados de tendência</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rows.map((item, index) => {
            const tone = trendTone(item.label)
            const ratio = Math.max(0, Math.min(1, (item.value || 0) / maxValue))
            return (
              <button
                key={`${item.label}-${index}`}
                type="button"
                onClick={() => onSegmentClick?.(index)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '160px minmax(0, 1fr) auto',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 14px',
                  borderRadius: 16,
                  border: `1px solid ${tone.border}`,
                  background: tone.surface,
                  cursor: onSegmentClick ? 'pointer' : 'default',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <span style={{ width: 12, height: 12, borderRadius: 999, background: tone.fill, flexShrink: 0 }} />
                  <strong style={{ color: '#1f2937', overflowWrap: 'anywhere' }}>{item.label}</strong>
                </div>
                <div style={{ height: 12, borderRadius: 999, background: 'rgba(101, 74, 32, 0.10)', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.max(8, ratio * 100)}%`, height: '100%', borderRadius: 999, background: tone.fill }} />
                </div>
                <span style={{ color: tone.text, fontWeight: 800, whiteSpace: 'nowrap' }}>
                  {item.value.toLocaleString('pt-PT')}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function TrendSummaryCards({ data }: { data: CountItem[] }) {
  const total = data.reduce((sum, item) => sum + (item.count || 0), 0)
  const crescentes = data.filter(item => item.label?.includes('Crescente')).reduce((sum, item) => sum + (item.count || 0), 0)
  const decrescentes = data.filter(item => item.label?.includes('Decrescente')).reduce((sum, item) => sum + (item.count || 0), 0)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      <div style={{ padding: 10, background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
        <div style={{ fontSize: 11, color: '#166534', marginBottom: 2 }}>Crescentes</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#15803d' }}>
          {total > 0 ? `${((crescentes / total) * 100).toFixed(1)}%` : '0%'}
        </div>
      </div>
      <div style={{ padding: 10, background: '#fef2f2', borderRadius: 8, border: '1px solid #fecaca' }}>
        <div style={{ fontSize: 11, color: '#991b1b', marginBottom: 2 }}>Decrescentes</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#dc2626' }}>
          {total > 0 ? `${((decrescentes / total) * 100).toFixed(1)}%` : '0%'}
        </div>
      </div>
    </div>
  )
}

function TemporalCardLoading({ label, color }: { label: string; color: string }) {
  return (
    <div style={{ padding: 20, textAlign: 'center', color: '#6b7280' }}>
      <div style={{ marginBottom: 8 }}>{label}</div>
      <div style={{ width: '100%', height: 4, background: '#f3f4f6', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ width: '56%', height: '100%', background: color, borderRadius: 999, animation: 'pulse 1.5s infinite' }} />
      </div>
    </div>
  )
}

function SingleSeriesLineChart({
  data,
  metric,
  color,
  fillColor,
  valueFormatter,
  emptyLabel,
}: {
  data: Array<{ mes?: string; total?: number; deficit?: number }>
  metric: 'total' | 'deficit'
  color: string
  fillColor: string
  valueFormatter: (value: number) => string
  emptyLabel: string
}) {
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const gradientId = React.useId().replace(/:/g, '')
  const [width, setWidth] = React.useState<number>(560)
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null)

  React.useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setWidth(el.clientWidth))
    setWidth(el.clientWidth)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const series = Array.isArray(data)
    ? data.map((item) => ({ mes: item.mes, value: Number(item[metric] || 0) }))
    : []

  if (!series.length) {
    return <div style={{ padding: 20, textAlign: 'center', color: '#9ca3af' }}>{emptyLabel}</div>
  }

  const maxValue = Math.max(1, ...series.map((item) => item.value))
  const H = 290
  const W = Math.max(420, width)
  const padTop = 24
  const padBottom = 42
  const padX = 26
  const chartWidth = W - padX * 2
  const chartHeight = H - padTop - padBottom

  const sx = (index: number) => padX + (index / Math.max(1, series.length - 1)) * chartWidth
  const sy = (value: number) => H - padBottom - (value / maxValue) * chartHeight
  const linePath = series.map((item, index) => `${index === 0 ? 'M' : 'L'} ${sx(index)} ${sy(item.value)}`).join(' ')
  const areaPath = `${linePath} L ${sx(series.length - 1)} ${H - padBottom} L ${sx(0)} ${H - padBottom} Z`
  const hoveredItem = hoveredIndex == null ? null : series[hoveredIndex]

  return (
    <div ref={containerRef} style={{ width: '100%', position: 'relative' }}>
      <svg
        width={W}
        height={H}
        onMouseLeave={() => setHoveredIndex(null)}
        style={{ width: '100%', height: H }}
      >
        {[0, 0.25, 0.5, 0.75, 1].map((factor) => {
          const y = padTop + factor * chartHeight
          const value = Math.round((1 - factor) * maxValue)
          return (
            <g key={factor}>
              <line x1={padX} y1={y} x2={W - padX} y2={y} stroke="rgba(148, 163, 184, 0.20)" strokeDasharray="4,6" />
              <text x={W - padX} y={y - 6} fontSize={11} fill="#64748b" textAnchor="end">
                {metric === 'deficit' ? formatMoney(value) : value.toLocaleString('pt-PT')}
              </text>
            </g>
          )
        })}

        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fillColor} />
            <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
          </linearGradient>
        </defs>

        <path d={areaPath} fill={`url(#${gradientId})`} />
        <path d={linePath} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />

        {series.map((item, index) => {
          const x = sx(index)
          const y = sy(item.value)
          const showLabel = series.length <= 6 || index === 0 || index === series.length - 1 || index % 2 === 0
          const isHovered = hoveredIndex === index
          return (
            <g key={`${item.mes}-${index}`}>
              <circle
                cx={x}
                cy={y}
                r={isHovered ? 6 : 5}
                fill={color}
                stroke="#fffdf8"
                strokeWidth="3"
                onMouseEnter={() => setHoveredIndex(index)}
                style={{ cursor: 'pointer' }}
              />
              {showLabel ? (
                <text x={x} y={H - 14} fontSize={11} fill="#64748b" textAnchor="middle">
                  {formatMonth(item.mes)}
                </text>
              ) : null}
            </g>
          )
        })}

        {hoveredItem && hoveredIndex != null ? (
          <line
            x1={sx(hoveredIndex)}
            y1={padTop}
            x2={sx(hoveredIndex)}
            y2={H - padBottom}
            stroke="rgba(51, 65, 85, 0.35)"
            strokeDasharray="4,4"
          />
        ) : null}
      </svg>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 8, color: '#64748b', fontSize: 13 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 10, height: 10, borderRadius: 999, background: color, display: 'inline-block' }} />
          <span>{metric === 'deficit' ? 'Défice mensal' : 'Clientes sem compras por mês'}</span>
        </div>
        <strong style={{ color, fontWeight: 800 }}>
          Pico: {valueFormatter(Math.max(...series.map((item) => item.value)))}
        </strong>
      </div>

      {hoveredItem && hoveredIndex != null ? (
        <div
          style={{
            position: 'absolute',
            left: Math.min(Math.max(sx(hoveredIndex) - 86, 12), W - 184),
            top: Math.max(sy(hoveredItem.value) - 82, 12),
            background: '#fffdf8',
            border: '1px solid rgba(101, 74, 32, 0.12)',
            borderRadius: 12,
            padding: '10px 12px',
            boxShadow: '0 16px 32px rgba(76, 57, 24, 0.12)',
            minWidth: 172,
            pointerEvents: 'none',
          }}
        >
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>{formatMonth(hoveredItem.mes)}</div>
          <div style={{ fontSize: 15, fontWeight: 800, color }}>{valueFormatter(hoveredItem.value)}</div>
        </div>
      ) : null}
    </div>
  )
}

function TemporalSummary({ data, loading }: { data: Array<{ mes?: string; total?: number; deficit?: number }>; loading: boolean }) {
  if (loading) return null
  
  const totalInspections = data.reduce((sum, item) => sum + (item.total || 0), 0)
  const totalDeficit = data.reduce((sum, item) => sum + (item.deficit || 0), 0)
  const avgPerMonth = data.length > 0 ? totalInspections / data.length : 0

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
      <div style={{ padding: 12, background: '#f0f9ff', borderRadius: 10, border: '1px solid #bae6fd' }}>
        <div style={{ fontSize: 12, color: '#0c4a6e', marginBottom: 4 }}>Total Clientes</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#0284c7' }}>
          {totalInspections.toLocaleString('pt-PT')}
        </div>
      </div>
      <div style={{ padding: 12, background: '#fef2f2', borderRadius: 10, border: '1px solid #fecaca' }}>
        <div style={{ fontSize: 12, color: '#991b1b', marginBottom: 4 }}>Défice Total</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#dc2626' }}>
          {formatMoney(totalDeficit)}
        </div>
      </div>
      <div style={{ padding: 12, background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
        <div style={{ fontSize: 12, color: '#475569', marginBottom: 4 }}>Média/Mês</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#334155' }}>
          {avgPerMonth.toFixed(1)}
        </div>
      </div>
    </div>
  )
}

function ImprovedTimeSeriesDual({ data }: { data: Array<{ mes?: string; total?: number; deficit?: number }> }) {
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const [width, setWidth] = React.useState<number>(600)
  const [hoveredPoint, setHoveredPoint] = React.useState<{ x: number; y: number; month?: string; total?: number; deficit?: number } | null>(null)
  
  React.useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setWidth(el.clientWidth))
    setWidth(el.clientWidth)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const series = Array.isArray(data) ? data : []
  if (!series.length) return <div style={{ padding: 20, textAlign: 'center', color: '#9ca3af' }}>Sem dados temporais</div>

  const totals = series.map((d) => Number(d.total || 0))
  const deficits = series.map((d) => Number(d.deficit || 0))
  const maxTotal = Math.max(1, ...totals)
  const maxDeficit = Math.max(1, ...deficits)
  
  const H = 280
  const pad = 40
  const W = Math.max(400, width)
  const chartWidth = W - pad * 2
  const chartHeight = H - pad * 2

  const sx = (i: number) => pad + (i / Math.max(1, series.length - 1)) * chartWidth
  const syTotal = (v: number) => H - pad - (v / maxTotal) * (chartHeight / 2)
  const syDeficit = (v: number) => H - pad - (v / maxDeficit) * (chartHeight / 2) - chartHeight / 2

  const createPath = (values: number[], scaleY: (v: number) => number) => {
    return values.map((v, i) => `${i === 0 ? 'M' : 'L'} ${sx(i)} ${scaleY(v)}`).join(' ')
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    
    if (mouseX < pad || mouseX > W - pad || mouseY < pad || mouseY > H - pad) {
      setHoveredPoint(null)
      return
    }

    const indexAtMouse = Math.round(((mouseX - pad) / chartWidth) * (series.length - 1))
    const validIndex = Math.max(0, Math.min(series.length - 1, indexAtMouse))
    const item = series[validIndex]
    
    if (item) {
      setHoveredPoint({
        x: sx(validIndex),
        y: mouseY,
        month: formatMonth(item.mes),
        total: item.total,
        deficit: item.deficit
      })
    }
  }

  return (
    <div ref={containerRef} style={{ width: '100%', position: 'relative' }}>
      <svg 
        width={W} 
        height={H} 
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredPoint(null)}
        style={{ cursor: 'crosshair' }}
      >
        {/* Grid */}
        {[0, 0.25, 0.5, 0.75, 1].map((f, i) => (
          <g key={i}>
            <line x1={pad} y1={pad + f * chartHeight} x2={W - pad} y2={pad + f * chartHeight} stroke="#f1f5f9" strokeDasharray="2,2" />
            <text x={pad - 10} y={pad + f * chartHeight + 4} fontSize={10} fill="#64748b" textAnchor="end">
              {Math.round((1 - f) * maxTotal)}
            </text>
          </g>
        ))}

        {/* Axes */}
        <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="#cbd5e1" strokeWidth="2" />
        <line x1={pad} y1={pad} x2={pad} y2={H - pad} stroke="#cbd5e1" strokeWidth="2" />

        {/* Areas */}
        <path d={`${createPath(totals, syTotal)} L ${sx(series.length - 1)} ${H - pad} L ${sx(0)} ${H - pad} Z`} fill="url(#totalGradient)" />
        <path d={`${createPath(deficits, syDeficit)} L ${sx(series.length - 1)} ${syDeficit(0)} L ${sx(0)} ${syDeficit(0)} Z`} fill="url(#deficitGradient)" />

        {/* Lines */}
        <path d={createPath(totals, syTotal)} fill="none" stroke="#c96d1f" strokeWidth="3" strokeLinecap="round" />
        <path d={createPath(deficits, syDeficit)} fill="none" stroke="#0f766e" strokeWidth="3" strokeLinecap="round" />

        {/* Points */}
        {totals.map((v, i) => (
          <circle key={`total-${i}`} cx={sx(i)} cy={syTotal(v)} r="4" fill="#c96d1f" stroke="#fffdf8" strokeWidth="2" />
        ))}
        {deficits.map((v, i) => (
          <circle key={`deficit-${i}`} cx={sx(i)} cy={syDeficit(v)} r="4" fill="#0f766e" stroke="#fffdf8" strokeWidth="2" />
        ))}

        {/* X Labels */}
        {series.map((item, i) => (
          <text key={i} x={sx(i)} y={H - 10} fontSize={10} fill="#64748b" textAnchor="middle">
            {formatMonth(item.mes)}
          </text>
        ))}

        {/* Hover line */}
        {hoveredPoint && (
          <line x1={hoveredPoint.x} y1={pad} x2={hoveredPoint.x} y2={H - pad} stroke="#374151" strokeDasharray="4,4" />
        )}

        {/* Gradients */}
        <defs>
          <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c96d1f" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#c96d1f" stopOpacity="0.05" />
          </linearGradient>
          <linearGradient id="deficitGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0f766e" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#0f766e" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Legend */}
        <g transform={`translate(${W - 160}, 20)`}>
          <rect x="0" y="-5" width="150" height="30" fill="#fffdf8" stroke="rgba(101, 74, 32, 0.12)" rx="6" fillOpacity="0.95" />
          <circle cx="15" cy="10" r="4" fill="#c96d1f" />
          <text x="25" y="14" fontSize="12" fill="#374151">Clientes</text>
          <circle cx="90" cy="10" r="4" fill="#0f766e" />
          <text x="100" y="14" fontSize="12" fill="#374151">Défice</text>
        </g>
      </svg>

      {/* Tooltip */}
      {hoveredPoint && (
        <div style={{
          position: 'absolute',
          left: Math.min(hoveredPoint.x + 10, W - 180),
          top: Math.max(hoveredPoint.y - 80, 10),
          background: '#fffdf8',
          border: '1px solid rgba(101, 74, 32, 0.12)',
          borderRadius: 8,
          padding: 12,
          boxShadow: '0 14px 28px rgba(76, 57, 24, 0.10)',
          fontSize: 13,
          minWidth: 160,
          zIndex: 10
        }}>
          <div style={{ fontWeight: 600, marginBottom: 8, color: '#374151' }}>
            {hoveredPoint.month}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#c96d1f', marginRight: 8 }} />
            <span style={{ color: '#6b7280' }}>Clientes:</span>
            <span style={{ marginLeft: 8, fontWeight: 600, color: '#c96d1f' }}>
              {hoveredPoint.total?.toLocaleString('pt-PT') || '0'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#0f766e', marginRight: 8 }} />
            <span style={{ color: '#6b7280' }}>Défice:</span>
            <span style={{ marginLeft: 8, fontWeight: 600, color: '#0f766e' }}>
              {formatMoney(hoveredPoint.deficit)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

function TemporalTable({ data }: { data: Array<{ mes?: string; total?: number; deficit?: number }> }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
          <th style={{ padding: '12px 8px', textAlign: 'left', color: '#475569', fontWeight: 600, fontSize: 13 }}>Mês</th>
          <th style={{ padding: '12px 8px', textAlign: 'right', color: '#475569', fontWeight: 600, fontSize: 13 }}>Clientes</th>
          <th style={{ padding: '12px 8px', textAlign: 'right', color: '#475569', fontWeight: 600, fontSize: 13 }}>Défice</th>
        </tr>
      </thead>
      <tbody>
        {data.length === 0 ? (
          <tr>
            <td colSpan={3} style={{ padding: 20, textAlign: 'center', color: '#9ca3af' }}>
              Sem dados temporais
            </td>
          </tr>
        ) : (
          data.map((item, i) => (
            <tr key={i} style={{ 
              borderBottom: '1px solid #f1f5f9',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            >
              <td style={{ padding: '10px 8px', fontWeight: 600, color: '#334155' }}>
                {formatMonth(item.mes)}
              </td>
              <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 700, color: '#0ea5e9' }}>
                {(item.total || 0).toLocaleString('pt-PT')}
              </td>
              <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 700, color: '#ef4444' }}>
                {formatMoney(item.deficit)}
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  )
}

function ActionsTable({ data }: { data: CountItem[] }) {
  const rows = [...data].sort((a, b) => (b.count || 0) - (a.count || 0))
  const maxCount = Math.max(...rows.map(d => d.count || 0), 1)
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {rows.length === 0 ? (
        <div style={{ padding: 20, textAlign: 'center', color: '#9ca3af' }}>Sem ações registadas</div>
      ) : (
        rows.map((item, i) => (
          <div key={i} style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr auto', 
            alignItems: 'center', 
            padding: '12px 16px', 
            background: '#fff',
            border: '1px solid #fed7aa',
            borderRadius: 8,
            marginBottom: 4,
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#fffbeb'; e.currentTarget.style.borderColor = '#fb923c' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#fed7aa' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ 
                width: 8, 
                height: 8, 
                borderRadius: 4, 
                background: `hsl(${30 + i * 15}, 70%, ${55 - i * 3}%)` 
              }} />
              <div>
                <div style={{ fontWeight: 600, color: '#9a3412' }}>{item.label || item.id || '—'}</div>
                <div style={{ 
                  width: Math.max(60, (item.count || 0) / maxCount * 200), 
                  height: 4, 
                  background: `hsl(${30 + i * 15}, 70%, ${55 - i * 3}%)`, 
                  borderRadius: 2, 
                  marginTop: 4,
                  opacity: 0.8
                }} />
              </div>
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#ea580c' }}>
              {(item.count || 0).toLocaleString('pt-PT')}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

function BestGroupsTable({ data }: { data: Array<{ label?: string; value?: number }> }) {
  const sorted = [...data].sort((a, b) => (b.value || 0) - (a.value || 0))
  const maxValue = Math.max(...sorted.map(d => d.value || 0), 1)
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {sorted.length === 0 ? (
        <div style={{ padding: 20, textAlign: 'center', color: '#9ca3af' }}>Sem dados de valor recuperado</div>
      ) : (
        sorted.slice(0, 8).map((item, i) => (
          <div key={i} style={{ 
            display: 'grid', 
            gridTemplateColumns: 'auto 1fr auto', 
            alignItems: 'center', 
            padding: '14px 16px', 
            background: '#fff',
            border: '1px solid #bbf7d0',
            borderRadius: 10,
            gap: 12,
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#f0fdf4'; e.currentTarget.style.transform = 'translateY(-1px)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.transform = 'translateY(0)' }}
          >
            <div style={{ 
              fontSize: 14, 
              fontWeight: 'bold',
              color: '#166534',
              background: '#dcfce7',
              padding: '4px 8px',
              borderRadius: 6,
              minWidth: 24,
              textAlign: 'center'
            }}>
              #{i + 1}
            </div>
            <div>
              <div style={{ fontWeight: 600, color: '#1e293b' }}>{item.label || '—'}</div>
              <div style={{ 
                width: Math.max(80, (item.value || 0) / maxValue * 220), 
                height: 4, 
                background: '#22c55e', 
                borderRadius: 2, 
                marginTop: 4,
                opacity: 0.8
              }} />
            </div>
            <div style={{ 
              fontSize: 16, 
              fontWeight: 800, 
              color: '#15803d',
              textAlign: 'right'
            }}>
              {formatMoney(item.value)}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

function TrendValueTable({ data }: { data: Array<{ label?: string; value?: number }> }) {
  const getTrendColor = (label: string) => {
    if (label.includes('Crescente')) return '#7c3aed'
    if (label.includes('Decrescente')) return '#dc2626'
    if (label.includes('Normal')) return '#0891b2'
    return '#6b7280'
  }

  const getTrendIcon = (label: string) => {
    if (label.includes('Muito crescente')) return '↗↗'
    if (label.includes('Crescente')) return '↗'
    if (label.includes('Muito decrescente')) return '↘↘'
    if (label.includes('Decrescente')) return '↘'
    if (label.includes('Normal')) return '→'
    return '—'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {data.length === 0 ? (
        <div style={{ padding: 20, textAlign: 'center', color: '#9ca3af' }}>Sem dados por tendência</div>
      ) : (
        data.map((item, i) => {
          const color = getTrendColor(item.label || '')
          const icon = getTrendIcon(item.label || '')
          
          return (
            <div key={i} style={{ 
              display: 'grid', 
              gridTemplateColumns: 'auto 1fr auto', 
              alignItems: 'center', 
              padding: '14px 16px', 
              background: '#fff',
              border: '1px solid #e7e5e4',
              borderRadius: 10,
              gap: 12,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#faf5ff'; e.currentTarget.style.borderColor = '#c084fc' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e7e5e4' }}
            >
              <div style={{ 
                fontSize: 18, 
                color, 
                fontWeight: 'bold',
                width: 28,
                textAlign: 'center'
              }}>
                {icon}
              </div>
              <div>
                <div style={{ fontWeight: 600, color: '#1e293b' }}>{item.label || '—'}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>Valor recuperado</div>
              </div>
              <div style={{ 
                fontSize: 16, 
                fontWeight: 800, 
                color,
                textAlign: 'right'
              }}>
                {formatMoney(item.value)}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}

function TrendEfficiencyCard({ data }: { data: Array<{ label?: string; value?: number }> }) {
  const totalValue = data.reduce((sum, item) => sum + (item.value || 0), 0)
  const crescenteValue = data.filter(item => item.label?.includes('Crescente')).reduce((sum, item) => sum + (item.value || 0), 0)
  const eficiencia = totalValue > 0 ? (crescenteValue / totalValue) * 100 : 0

  return (
    <div style={{ padding: 12, background: '#faf5ff', borderRadius: 10, border: '1px solid #d8b4fe' }}>
      <div style={{ fontSize: 12, color: '#7c2d12', marginBottom: 8, fontWeight: 600 }}>Eficiência por Tendência</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 10, color: '#8b5cf6' }}>Crescente</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#7c3aed' }}>
            {formatMoney(crescenteValue)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: '#8b5cf6' }}>Eficácia</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#7c3aed' }}>
            {eficiencia.toFixed(1)}%
          </div>
        </div>
      </div>
      <div style={{ 
        width: '100%', 
        height: 6, 
        background: '#e5e7eb', 
        borderRadius: 3, 
        overflow: 'hidden'
      }}>
        <div style={{ 
          width: `${Math.min(100, eficiencia)}%`, 
          height: '100%', 
          background: '#8b5cf6',
          transition: 'width 0.3s ease'
        }} />
      </div>
    </div>
  )
}

function AnalysisValueTable({ data }: { data: Array<{ label?: string; value?: number }> }) {
  const getAnalysisColor = (label: string) => {
    if (label.includes('Analisado')) return '#0891b2'
    if (label.includes('Em análise')) return '#f59e0b'
    return '#6b7280'
  }

  const getAnalysisIcon = (label: string) => {
    if (label.includes('Analisado')) return '✓'
    if (label.includes('Em análise')) return '⏳'
    return '—'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {data.length === 0 ? (
        <div style={{ padding: 20, textAlign: 'center', color: '#9ca3af' }}>Sem dados por análise</div>
      ) : (
        data.map((item, i) => {
          const color = getAnalysisColor(item.label || '')
          const icon = getAnalysisIcon(item.label || '')
          
          return (
            <div key={i} style={{ 
              display: 'grid', 
              gridTemplateColumns: 'auto 1fr auto', 
              alignItems: 'center', 
              padding: '14px 16px', 
              background: '#fff',
              border: '1px solid #cffafe',
              borderRadius: 10,
              gap: 12,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#f0fdfa'; e.currentTarget.style.borderColor = '#67e8f9' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#cffafe' }}
            >
              <div style={{ 
                fontSize: 16, 
                color, 
                fontWeight: 'bold',
                width: 24,
                textAlign: 'center'
              }}>
                {icon}
              </div>
              <div>
                <div style={{ fontWeight: 600, color: '#1e293b' }}>{item.label || '—'}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>Estado da análise</div>
              </div>
              <div style={{ 
                fontSize: 16, 
                fontWeight: 800, 
                color,
                textAlign: 'right'
              }}>
                {formatMoney(item.value)}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}

function AnalysisEfficiencyCard({ data }: { data: Array<{ label?: string; value?: number }> }) {
  const totalValue = data.reduce((sum, item) => sum + (item.value || 0), 0)
  const analisadoValue = data.filter(item => item.label?.includes('Analisado')).reduce((sum, item) => sum + (item.value || 0), 0)
  const completionRate = totalValue > 0 ? (analisadoValue / totalValue) * 100 : 0

  return (
    <div style={{ padding: 12, background: '#f0fdfa', borderRadius: 10, border: '1px solid #99f6e4' }}>
      <div style={{ fontSize: 12, color: '#0f766e', marginBottom: 8, fontWeight: 600 }}>Taxa de Conclusão</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 10, color: '#0891b2' }}>Analisado</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#0e7490' }}>
            {formatMoney(analisadoValue)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: '#0891b2' }}>Taxa</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#0e7490' }}>
            {completionRate.toFixed(1)}%
          </div>
        </div>
      </div>
      <div style={{ 
        width: '100%', 
        height: 6, 
        background: '#e5e7eb', 
        borderRadius: 3, 
        overflow: 'hidden'
      }}>
        <div style={{ 
          width: `${Math.min(100, completionRate)}%`, 
          height: '100%', 
          background: '#06b6d4',
          transition: 'width 0.3s ease'
        }} />
      </div>
    </div>
  )
}
