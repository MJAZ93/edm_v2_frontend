import React, { useEffect, useMemo, useState } from 'react'
import { Card } from '../components'
import { useAuth } from '../contexts/AuthContext'
import { InspeccoesApi, ASCApi, RegiaoApi, InstalacaoAccoesApi, InstalacaoAccaoTipoApi, type ModelASC, type ModelRegiao } from '../services'

type CountItem = { id?: string; label?: string; count?: number }

export default function ClientesDashboardScreen() {
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
  const [deficitItems, setDeficitItems] = useState<Array<{ group_id?: string; deficit?: number }>>([])
  const [deficitLoading, setDeficitLoading] = useState(false)
  const [deficitError, setDeficitError] = useState<string | null>(null)
  // Temporal
  const [months, setMonths] = useState<number>(6)
  const [minScore, setMinScore] = useState<string>('')
  const [maxScore, setMaxScore] = useState<string>('')
  const [zeroCompras, setZeroCompras] = useState(false)
  const [temporalItems, setTemporalItems] = useState<Array<{ mes?: string; total?: number; deficit?: number }>>([])
  const [temporalLoading, setTemporalLoading] = useState(false)
  const [temporalError, setTemporalError] = useState<string | null>(null)
  // Tendência (group_by=tendencia)
  const [tendCounts, setTendCounts] = useState<CountItem[]>([])
  const [tendLoading, setTendLoading] = useState(false)
  const [tendError, setTendError] = useState<string | null>(null)
  // Effectiveness de instalação-ações (valor recuperado por tipo de ação)
  const [effectivenessData, setEffectivenessData] = useState<any[]>([])
  const [effectivenessLoading, setEffectivenessLoading] = useState(false)
  const [effectivenessError, setEffectivenessError] = useState<string | null>(null)

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

  // Aplicar filtros localmente (agrupado por Região)
  const ascRegiaoId = useMemo(() => (ascs.find(a => a.id === ascId)?.regiao_id) || '', [ascs, ascId])
  const filtered = useMemo(() => {
    const rId = regiaoId || ascRegiaoId || ''
    if (!rId) return items
    return (items || []).filter((it) => (it.id === rId || it.label === (regioes.find(r => r.id === rId)?.name)))
  }, [items, regiaoId, ascRegiaoId, regioes])

  const donutData = (filtered || []).map((it) => ({ label: it.label || it.id || '—', value: Number(it.count || 0) }))

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

  const deficitWithLabels = useMemo(() => {
    const byId = new Map((regioes || []).map(r => [r.id, r.name]))
    return (deficitItems || []).map(it => ({ id: it.group_id || '', label: byId.get(it.group_id || '') || (it.group_id || '—'), value: Number(it.deficit || 0) }))
  }, [deficitItems, regioes])
  const deficitDonut = (deficitWithLabels || []).map(d => ({ label: d.label, value: Math.max(0, Number(d.value) || 0) }))
  const selectedRegiaoId = regiaoId || ascRegiaoId || ''
  const deficitFiltered = useMemo(() => {
    if (!selectedRegiaoId) return deficitWithLabels
    return (deficitWithLabels || []).filter(it => it.id === selectedRegiaoId)
  }, [deficitWithLabels, selectedRegiaoId])

  // Carregar dados temporais
  useEffect(() => {
    (async () => {
      setTemporalLoading(true); setTemporalError(null)
      try {
        const { data } = await api.privateInspeccoesTemporalGet(
          auth,
          months || 6,
          tendencia || undefined,
          minScore ? Number(minScore) : undefined,
          maxScore ? Number(maxScore) : undefined,
          zeroCompras || undefined
        )
        if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
        setTemporalItems(((data as any)?.items) ?? [])
      } catch (err: any) {
        const status = err?.response?.status
        if (status === 401 || isUnauthorizedBody(err?.response?.data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
        setTemporalError(!status ? 'Sem ligação ao servidor.' : 'Falha ao carregar análise temporal.')
      } finally { setTemporalLoading(false) }
    })()
  }, [api, auth, months, tendencia, minScore, maxScore, zeroCompras])

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

  // Contagens de ações por instalação (por região)
  const [accoesCounts, setAccoesCounts] = useState<CountItem[]>([])
  const [accoesLoading, setAccoesLoading] = useState(false)
  const [accoesError, setAccoesError] = useState<string | null>(null)
  // Melhores por valor recuperado
  const [bestItems, setBestItems] = useState<Array<{ id?: string; label?: string; value?: number }>>([])
  const [bestLoading, setBestLoading] = useState(false)
  const [bestError, setBestError] = useState<string | null>(null)
  useEffect(() => {
    (async () => {
      setBestLoading(true); setBestError(null)
      try {
        const { data } = await accoesApi.privateInstalacaoAccoesMelhoresGet(
          auth,
          'regiao',
          10,
          tendencia || undefined,
          marcacaoStatus || undefined,
          analiseStatus || undefined,
          regiaoId || undefined,
          undefined
        )
        if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
        const raw = ((data as any)?.items) ?? []
        const mapped = raw.map((it: any) => ({ id: it?.group_id, label: it?.group_name || (regioes.find(r => r.id === it?.group_id)?.name) || it?.group_id, value: Number(it?.valor || 0) }))
        setBestItems(mapped)
      } catch (err: any) {
        const status = err?.response?.status
        if (status === 401 || isUnauthorizedBody(err?.response?.data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
        setBestError(!status ? 'Sem ligação ao servidor.' : 'Falha ao carregar melhores grupos por valor recuperado.')
      } finally { setBestLoading(false) }
    })()
  }, [accoesApi, auth, tendencia, marcacaoStatus, analiseStatus, regiaoId, regioes])

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

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: 24,
      padding: '16px 24px',
      maxWidth: '100%',
      background: '#fafbfc'
    }}>

      {/* Filtros */}
      <div style={{ 
        background: '#fff',
        padding: '20px 24px',
        borderRadius: 12,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        border: '1px solid #e2e8f0'
      }}>
        <h3 style={{ 
          margin: '0 0 16px 0', 
          fontSize: 16, 
          fontWeight: 600, 
          color: '#1e293b'
        }}>
          Filtros de Pesquisa
        </h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: 16
        }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>Região</span>
            <select 
              value={regiaoId} 
              onChange={(e) => { setRegiaoId(e.target.value); setAscId('') }} 
              style={{ 
                padding: '12px 16px', 
                borderRadius: 8, 
                border: '1px solid #d1d5db', 
                background: '#fff',
                fontSize: 14,
                color: '#374151'
              }}
            >
              <option value="">Todas as regiões</option>
              {(regioes || []).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>ASC</span>
            <select 
              value={ascId} 
              onChange={(e) => setAscId(e.target.value)} 
              style={{ 
                padding: '12px 16px', 
                borderRadius: 8, 
                border: '1px solid #d1d5db', 
                background: '#fff',
                fontSize: 14,
                color: '#374151'
              }}
            >
              <option value="">Todas as ASCs</option>
              {(ascs || []).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>Tendência de crescimento</span>
            <select 
              value={tendencia} 
              onChange={(e) => setTendencia(e.target.value)} 
              style={{ 
                padding: '12px 16px', 
                borderRadius: 8, 
                border: '1px solid #d1d5db', 
                background: '#fff',
                fontSize: 14,
                color: '#374151'
              }}
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
          <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>Estado da Marcação</span>
            <select 
              value={marcacaoStatus} 
              onChange={(e) => setMarcacaoStatus(e.target.value)} 
              style={{ 
                padding: '12px 16px', 
                borderRadius: 8, 
                border: '1px solid #d1d5db', 
                background: '#fff',
                fontSize: 14,
                color: '#374151'
              }}
            >
              <option value="">Todos os estados</option>
              <option value="EXECUTADO">Executado</option>
              <option value="MARCADO">Marcado</option>
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>Estado da Análise</span>
            <select 
              value={analiseStatus} 
              onChange={(e) => setAnaliseStatus(e.target.value)} 
              style={{ 
                padding: '12px 16px', 
                borderRadius: 8, 
                border: '1px solid #d1d5db', 
                background: '#fff',
                fontSize: 14,
                color: '#374151'
              }}
            >
              <option value="">Todos os estados</option>
              <option value="EM_ANALISE">Em análise</option>
              <option value="ANALISADO">Analisado</option>
            </select>
          </label>
        </div>
      </div>

      {/* Seção de Clientes */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <h2 style={{ 
          margin: 0, 
          fontSize: 20, 
          fontWeight: 700, 
          color: '#1e293b',
          borderBottom: '2px solid #e2e8f0',
          paddingBottom: 8
        }}>
          📊 Análise de Clientes
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

      {!regiaoId && (
        <Card title={`Clientes — Contagens${tendencia ? ` · Tendência: ${tendencia.replace(/_/g,' ').toLowerCase()}` : ''}`}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'stretch' }}>
            <div style={{ overflow: 'auto', maxHeight: 280 }}>
              {loading ? (
                <div style={{ padding: 20, textAlign: 'center', color: '#6b7280' }}>
                  <div style={{ marginBottom: 8 }}>A carregar…</div>
                  <div style={{ width: '100%', height: 4, background: '#f3f4f6', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ width: '60%', height: '100%', background: '#0ea5e9', borderRadius: 2, animation: 'pulse 1.5s infinite' }} />
                  </div>
                </div>
              ) : (
                <InspectionCountsTable data={filtered} />
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <ImprovedDonutChart 
                data={donutData} 
                title="Distribuição por Região"
                onSegmentClick={(idx) => {
                  const lbl = (donutData[idx] || {}).label
                  const reg = (regioes || []).find(r => (r.name || r.id) === lbl)
                  if (reg && reg.id != null) { setRegiaoId(String(reg.id)); setAscId(''); return }
                  const it = (items || []).find(i => (i.label || i.id) === lbl)
                  if (it && it.id != null) { setRegiaoId(String(it.id)); setAscId('') }
                }}
              />
              <div style={{ padding: 12, background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Total de Clientes</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#1e293b' }}>
                  {(filtered || []).reduce((sum, item) => sum + (item.count || 0), 0).toLocaleString('pt-PT')}
                </div>
              </div>
            </div>
          </div>
          {error ? <div style={{ background: '#fee2e2', color: '#991b1b', padding: 8, borderRadius: 8, marginTop: 10 }}>{error}</div> : null}
        </Card>
      )}

          <Card title="Défice total">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'stretch' }}>
              <div style={{ overflow: 'auto', maxHeight: 280 }}>
                {deficitLoading ? (
                  <div style={{ padding: 20, textAlign: 'center', color: '#6b7280' }}>
                    <div style={{ marginBottom: 8 }}>A carregar défices…</div>
                    <div style={{ width: '100%', height: 4, background: '#f3f4f6', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ width: '70%', height: '100%', background: '#ef4444', borderRadius: 2, animation: 'pulse 1.5s infinite' }} />
                    </div>
                  </div>
                ) : (
                  <DeficitTable data={deficitFiltered} />
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <ImprovedDonutChart 
                  data={(deficitFiltered || []).map(d => ({ label: d.label, value: Math.max(0, Number(d.value) || 0) }))} 
                  title="Défice por Região"
                  colorScheme="red"
                  onSegmentClick={(idx) => {
                    const lbl = ((deficitFiltered || [])[idx] || {}).label
                    const reg = (regioes || []).find(r => (r.name || r.id) === lbl)
                    if (reg && reg.id != null) { setRegiaoId(String(reg.id)); setAscId('') }
                  }}
                />
                <div style={{ padding: 12, background: '#fef2f2', borderRadius: 10, border: '1px solid #fecaca' }}>
                  <div style={{ fontSize: 12, color: '#991b1b', marginBottom: 4 }}>Défice Total</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#dc2626' }}>
                    {formatMoney((deficitFiltered || []).reduce((sum, item) => sum + (item.value || 0), 0))}
                  </div>
                </div>
              </div>
            </div>
            {deficitError ? <div style={{ background: '#fee2e2', color: '#991b1b', padding: 8, borderRadius: 8, marginTop: 10 }}>{deficitError}</div> : null}
          </Card>

          {regiaoId && (
            <Card title="Clientes — ASCs da região">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 12, alignItems: 'stretch' }}>
                <div style={{ overflow: 'auto', maxHeight: 220 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ textAlign: 'left', color: '#6b7280' }}>
                        <th style={{ padding: '8px 8px', borderBottom: '1px solid #e5e7eb' }}>ASC</th>
                        <th style={{ padding: '8px 8px', borderBottom: '1px solid #e5e7eb' }}>Clientes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(ascs || []).length === 0 ? (
                        <tr><td colSpan={2} style={{ padding: 12, color: '#6b7280' }}>Sem ASCs para mostrar.</td></tr>
                      ) : (
                        ((ascs || []).filter(a => !ascId || a.id === ascId)).map((a, i) => {
                          const c = (ascCounts.find(x => x.id === a.id)?.count) ?? 0
                          return (
                            <tr key={i}>
                              <td style={{ padding: '8px 8px', borderBottom: '1px solid #f3f4f6' }}>{a.name || a.id || '—'}</td>
                              <td style={{ padding: '8px 8px', borderBottom: '1px solid #f3f4f6' }}>{Number(c)}</td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
                <div style={{ maxWidth: 260 }}>
                  <DonutChart
                    data={((ascs || []).filter(a => !ascId || a.id === ascId)).map((a) => ({ label: a.name || a.id || '—', value: Number((ascCounts.find(x => x.id === a.id)?.count) ?? 0) }))}
                    legendMaxHeight={140}
                    size={160}
                    thickness={12}
                    onSegmentClick={(idx) => {
                      const arr = (ascs || []).filter(a => !ascId || a.id === ascId)
                      const target = arr[idx]
                      if (target && target.id != null) setAscId(String(target.id))
                    }}
                  />
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Tendência: respeita seleção de tendência; oculta quando há região selecionada */}
        {!regiaoId && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
            <Card title="Clientes — Contagens por tendência">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: 16, alignItems: 'stretch' }}>
                <div style={{ overflowX: 'auto', maxHeight: 320 }}>
                  {tendLoading ? (
                    <div style={{ padding: 20, textAlign: 'center', color: '#6b7280' }}>
                      <div style={{ marginBottom: 8 }}>A carregar tendências…</div>
                      <div style={{ width: '100%', height: 4, background: '#f3f4f6', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ width: '80%', height: '100%', background: '#10b981', borderRadius: 2, animation: 'pulse 1.5s infinite' }} />
                      </div>
                    </div>
                  ) : (
                    <TrendTable 
                      data={(tendCounts || []).filter((it) => !tendencia || (it.id?.toUpperCase() === tendencia || it.label === labelTendencia(tendencia)))}
                    />
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <ImprovedDonutChart 
                    data={(tendCounts || [])
                      .filter((it) => !tendencia || (it.id?.toUpperCase() === tendencia || it.label === labelTendencia(tendencia)))
                      .map((it) => ({ label: it.label || it.id || '—', value: Number(it.count || 0) }))}
                    title="Distribuição por Tendência"
                    colorScheme="green"
                    onSegmentClick={(idx) => {
                      const arr = (tendCounts || []).filter((it) => !tendencia || (it.id?.toUpperCase() === tendencia || it.label === labelTendencia(tendencia)))
                      const target = arr[idx]
                      if (target && target.id) setTendencia(String(target.id).toUpperCase())
                    }}
                  />
                  <TrendSummaryCards 
                    data={(tendCounts || []).filter((it) => !tendencia || (it.id?.toUpperCase() === tendencia || it.label === labelTendencia(tendencia)))}
                  />
                </div>
              </div>
              {tendError ? <div style={{ background: '#fee2e2', color: '#991b1b', padding: 8, borderRadius: 8, marginTop: 10 }}>{tendError}</div> : null}
            </Card>
          </div>
        )}
      </div>

      {/* Seção de Análise Temporal */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <h2 style={{ 
          margin: 0, 
          fontSize: 20, 
          fontWeight: 700, 
          color: '#1e293b',
          borderBottom: '2px solid #e2e8f0',
          paddingBottom: 8
        }}>
          📈 Análise Temporal
        </h2>
        
        <Card title="Evolução temporal dos últimos meses">
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 20, marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>Período</span>
                <select value={months} onChange={(e) => setMonths(Number(e.target.value))} style={{ padding: '12px 16px', borderRadius: 8, border: '1px solid #d1d5db', minWidth: 140, background: '#fff', fontSize: 14 }}>
                  <option value={3}>3 meses</option>
                  <option value={6}>6 meses</option>
                  <option value={12}>12 meses</option>
                </select>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>Score mínimo</span>
                <input value={minScore} onChange={(e) => setMinScore(e.target.value)} placeholder="0.0" style={{ padding: '12px 16px', borderRadius: 8, border: '1px solid #d1d5db', minWidth: 120, fontSize: 14 }} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>Score máximo</span>
                <input value={maxScore} onChange={(e) => setMaxScore(e.target.value)} placeholder="1.0" style={{ padding: '12px 16px', borderRadius: 8, border: '1px solid #d1d5db', minWidth: 120, fontSize: 14 }} />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 32 }}>
                <input type="checkbox" checked={zeroCompras} onChange={(e) => setZeroCompras(e.target.checked)} style={{ width: 18, height: 18 }} />
                <span style={{ color: '#374151', fontSize: 14, fontWeight: 500 }}>Sem compras nos últimos 6 meses</span>
              </label>
            </div>
            <TemporalSummary data={temporalItems} loading={temporalLoading} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 20, alignItems: 'stretch' }}>
            <Card title="Evolução Temporal" style={{ border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              {temporalLoading ? (
                <div style={{ padding: 20, textAlign: 'center', color: '#6b7280' }}>
                  <div style={{ marginBottom: 8 }}>A carregar análise temporal…</div>
                  <div style={{ width: '100%', height: 4, background: '#f3f4f6', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ width: '50%', height: '100%', background: '#8b5cf6', borderRadius: 2, animation: 'pulse 1.5s infinite' }} />
                  </div>
                </div>
              ) : temporalError ? (
                <div style={{ background: '#fee2e2', color: '#991b1b', padding: 12, borderRadius: 8 }}>{temporalError}</div>
              ) : (
                <ImprovedTimeSeriesDual data={temporalItems} />
              )}
            </Card>
            <Card title="Resumo Mensal" style={{ border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div style={{ overflow: 'auto', maxHeight: 320 }}>
                {temporalLoading ? (
                  <div style={{ padding: 16, textAlign: 'center', color: '#6b7280' }}>A carregar…</div>
                ) : (
                  <TemporalTable data={temporalItems} />
                )}
              </div>
            </Card>
          </div>
        </Card>
      </div>

      {/* Seção de Ações */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <h2 style={{ 
          margin: 0, 
          fontSize: 20, 
          fontWeight: 700, 
          color: '#1e293b',
          borderBottom: '2px solid #e2e8f0',
          paddingBottom: 8
        }}>
          🎯 Análise de Ações
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
          {/* Ações por instalação — contagens (por região) */}
          <Card title="Ações por instalação — Contagens por região">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'stretch' }}>
              <div style={{ overflow: 'auto', maxHeight: 280 }}>
                {accoesLoading ? (
                  <div style={{ padding: 20, textAlign: 'center', color: '#6b7280' }}>
                    <div style={{ marginBottom: 8 }}>A carregar ações…</div>
                    <div style={{ width: '100%', height: 4, background: '#f3f4f6', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ width: '75%', height: '100%', background: '#f59e0b', borderRadius: 2, animation: 'pulse 1.5s infinite' }} />
                    </div>
                  </div>
                ) : (
                  <ActionsTable data={accoesCounts} />
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <ImprovedDonutChart 
                  data={(accoesCounts || []).map((it) => ({ label: it.label || it.id || '—', value: Number(it.count || 0) }))}
                  title="Ações por Região"
                  colorScheme="orange"
                  onSegmentClick={(idx) => {
                    const lbl = ((accoesCounts || [])[idx] || {}).label || ((accoesCounts || [])[idx] || {}).id
                    const reg = (regioes || []).find(r => (r.name || r.id) === lbl)
                    if (reg && reg.id != null) { setRegiaoId(String(reg.id)); setAscId('') }
                  }}
                />
                <div style={{ padding: 12, background: '#fffbeb', borderRadius: 10, border: '1px solid #fed7aa' }}>
                  <div style={{ fontSize: 12, color: '#92400e', marginBottom: 4 }}>Total de Ações</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#ea580c' }}>
                    {(accoesCounts || []).reduce((sum, item) => sum + (item.count || 0), 0).toLocaleString('pt-PT')}
                  </div>
                </div>
              </div>
            </div>
            {accoesError ? <div style={{ background: '#fee2e2', color: '#991b1b', padding: 8, borderRadius: 8, marginTop: 10 }}>{accoesError}</div> : null}
          </Card>

          {/* Valor Recuperado */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
            <Card title="Melhores grupos por valor recuperado">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: 20, alignItems: 'stretch' }}>
                <div style={{ overflow: 'auto', maxHeight: 280 }}>
                  {bestLoading ? (
                    <div style={{ padding: 20, textAlign: 'center', color: '#6b7280' }}>
                      <div style={{ marginBottom: 8 }}>A carregar melhores grupos…</div>
                      <div style={{ width: '100%', height: 4, background: '#f3f4f6', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ width: '85%', height: '100%', background: '#10b981', borderRadius: 2, animation: 'pulse 1.5s infinite' }} />
                      </div>
                    </div>
                  ) : (
                    <BestGroupsTable data={bestItems} />
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <ImprovedDonutChart 
                    data={(bestItems || []).map((it) => ({ label: it.label || it.id || '—', value: Number(it.value || 0) }))}
                    title="Valor Recuperado por Região"
                    colorScheme="green"
                    onSegmentClick={(idx) => {
                      const lbl = ((bestItems || [])[idx] || {}).label || ((bestItems || [])[idx] || {}).id
                      const reg = (regioes || []).find(r => (r.name || r.id) === lbl)
                      if (reg && reg.id != null) { setRegiaoId(String(reg.id)); setAscId('') }
                    }}
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div style={{ padding: 10, background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
                      <div style={{ fontSize: 11, color: '#166534', marginBottom: 2 }}>Total Recuperado</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#15803d' }}>
                        {formatMoney((bestItems || []).reduce((sum, item) => sum + (item.value || 0), 0))}
                      </div>
                    </div>
                    <div style={{ padding: 10, background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
                      <div style={{ fontSize: 11, color: '#166534', marginBottom: 2 }}>Regiões Ativas</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#15803d' }}>
                        {(bestItems || []).filter(item => (item.value || 0) > 0).length}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {bestError ? <div style={{ background: '#fee2e2', color: '#991b1b', padding: 8, borderRadius: 8, marginTop: 10 }}>{bestError}</div> : null}
            </Card>

          </div>

          {/* Effectiveness de Ações de Cliente */}
          <Card title="Valor Recuperado por Tipo de Ação (Clientes)">
            {effectivenessLoading ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#6b7280' }}>
                <div style={{ marginBottom: 8 }}>A carregar effectiveness de instalações…</div>
                <div style={{ width: '100%', height: 4, background: '#f3f4f6', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: '75%', height: '100%', background: '#10b981', borderRadius: 2, animation: 'pulse 1.5s infinite' }} />
                </div>
              </div>
            ) : effectivenessError ? (
              <div style={{ background: '#fee2e2', color: '#991b1b', padding: 12, borderRadius: 8 }}>{effectivenessError}</div>
            ) : (
              <InstallationEffectivenessChart data={effectivenessData} />
            )}
          </Card>

        </div>
      </div>
    </div>
  )
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

function ImprovedDonutChart({ data, title, colorScheme = 'default', size = 200, onSegmentClick }: { 
  data: Array<{ label: string; value: number }>; 
  title: string; 
  colorScheme?: 'default' | 'red' | 'green' | 'orange' | 'purple' | 'cyan';
  size?: number;
  onSegmentClick?: (index: number) => void;
}) {
  const [hoverIdx, setHoverIdx] = React.useState<number | null>(null)
  const getColorScheme = (scheme: string) => {
    switch (scheme) {
      case 'red': return ['#fca5a5', '#f87171', '#ef4444', '#dc2626', '#b91c1c', '#991b1b']
      case 'green': return ['#86efac', '#4ade80', '#22c55e', '#16a34a', '#15803d', '#166534']
      case 'orange': return ['#fdba74', '#fb923c', '#f97316', '#ea580c', '#dc2626', '#c2410c']
      case 'purple': return ['#c4b5fd', '#a78bfa', '#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6']
      case 'cyan': return ['#67e8f9', '#22d3ee', '#06b6d4', '#0891b2', '#0e7490', '#155e75']
      default: return ['#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af']
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
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`
    }
    return value.toLocaleString('pt-PT')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', textAlign: 'center' }}>{title}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignItems: 'center' }}>
        <div style={{ position: 'relative', width: size, height: size }}>
          <svg viewBox={`0 0 ${size} ${size}`} width="100%" height="100%">
            {/* Círculo de fundo */}
            <circle 
              cx={size/2} 
              cy={size/2} 
              r={radius} 
              fill="none" 
              stroke="#f1f5f9" 
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
            <circle cx={size/2} cy={size/2} r={radius - 25} fill="#fff" stroke="#e2e8f0" strokeWidth="1" />
            <text x={size/2} y={size/2 - 6} textAnchor="middle" fontSize="18" fontWeight="700" fill="#1f2937">
              {formatTotal(total)}
            </text>
            <text x={size/2} y={size/2 + 12} textAnchor="middle" fontSize="11" fill="#6b7280">
              total
            </text>
          </svg>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: size - 40, overflowY: 'auto' }}>
          {segments.map((segment, i) => (
            <div
              key={i}
              style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: onSegmentClick ? 'pointer' : 'default', opacity: hoverIdx !== null ? (hoverIdx === i ? 1 : 0.55) : 1, transition: 'opacity 120ms ease' }}
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
                <div style={{ fontWeight: 600, color: '#374151', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {segment.label}
                </div>
                <div style={{ color: '#6b7280', fontSize: 11 }}>
                  {segment.percentage.toFixed(1)}% · {formatMoney ? formatMoney(segment.value) : segment.value.toLocaleString('pt-PT')}
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
  const maxCount = Math.max(...data.map(d => d.count || 0), 1)
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {data.length === 0 ? (
        <div style={{ padding: 20, textAlign: 'center', color: '#9ca3af' }}>Sem dados para mostrar</div>
      ) : (
        data.map((item, i) => (
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
              <div>
                <div style={{ fontWeight: 600, color: '#1e293b' }}>{item.label || item.id || '—'}</div>
                <div style={{ 
                  width: Math.max(60, (item.count || 0) / maxCount * 200), 
                  height: 4, 
                  background: `hsl(${220 + i * 40}, 60%, 55%)`, 
                  borderRadius: 2, 
                  marginTop: 4,
                  opacity: 0.7
                }} />
              </div>
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#1e293b' }}>
              {(item.count || 0).toLocaleString('pt-PT')}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

function DeficitTable({ data }: { data: Array<{ label: string; value: number }> }) {
  const maxValue = Math.max(...data.map(d => d.value || 0), 1)
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {data.length === 0 ? (
        <div style={{ padding: 20, textAlign: 'center', color: '#9ca3af' }}>Sem défices registados</div>
      ) : (
        data.map((item, i) => (
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
              <div>
                <div style={{ fontWeight: 600, color: '#7f1d1d' }}>{item.label}</div>
                <div style={{ 
                  width: Math.max(60, (item.value || 0) / maxValue * 200), 
                  height: 4, 
                  background: `hsl(${0 + i * 10}, 70%, ${60 - i * 5}%)`, 
                  borderRadius: 2, 
                  marginTop: 4,
                  opacity: 0.8
                }} />
              </div>
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#dc2626' }}>
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
        <path d={createPath(totals, syTotal)} fill="none" stroke="#0ea5e9" strokeWidth="3" strokeLinecap="round" />
        <path d={createPath(deficits, syDeficit)} fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />

        {/* Points */}
        {totals.map((v, i) => (
          <circle key={`total-${i}`} cx={sx(i)} cy={syTotal(v)} r="4" fill="#0ea5e9" stroke="#fff" strokeWidth="2" />
        ))}
        {deficits.map((v, i) => (
          <circle key={`deficit-${i}`} cx={sx(i)} cy={syDeficit(v)} r="4" fill="#ef4444" stroke="#fff" strokeWidth="2" />
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
            <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.05" />
          </linearGradient>
          <linearGradient id="deficitGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Legend */}
        <g transform={`translate(${W - 160}, 20)`}>
          <rect x="0" y="-5" width="150" height="30" fill="#fff" stroke="#e2e8f0" rx="6" fillOpacity="0.95" />
          <circle cx="15" cy="10" r="4" fill="#0ea5e9" />
          <text x="25" y="14" fontSize="12" fill="#374151">Clientes</text>
          <circle cx="90" cy="10" r="4" fill="#ef4444" />
          <text x="100" y="14" fontSize="12" fill="#374151">Défice</text>
        </g>
      </svg>

      {/* Tooltip */}
      {hoveredPoint && (
        <div style={{
          position: 'absolute',
          left: Math.min(hoveredPoint.x + 10, W - 180),
          top: Math.max(hoveredPoint.y - 80, 10),
          background: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: 8,
          padding: 12,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          fontSize: 13,
          minWidth: 160,
          zIndex: 10
        }}>
          <div style={{ fontWeight: 600, marginBottom: 8, color: '#374151' }}>
            {hoveredPoint.month}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#0ea5e9', marginRight: 8 }} />
            <span style={{ color: '#6b7280' }}>Clientes:</span>
            <span style={{ marginLeft: 8, fontWeight: 600, color: '#0ea5e9' }}>
              {hoveredPoint.total?.toLocaleString('pt-PT') || '0'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ef4444', marginRight: 8 }} />
            <span style={{ color: '#6b7280' }}>Défice:</span>
            <span style={{ marginLeft: 8, fontWeight: 600, color: '#ef4444' }}>
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
  const maxCount = Math.max(...data.map(d => d.count || 0), 1)
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {data.length === 0 ? (
        <div style={{ padding: 20, textAlign: 'center', color: '#9ca3af' }}>Sem ações registadas</div>
      ) : (
        data.map((item, i) => (
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
  const maxValue = Math.max(...data.map(d => d.value || 0), 1)
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {data.length === 0 ? (
        <div style={{ padding: 20, textAlign: 'center', color: '#9ca3af' }}>Sem dados de valor recuperado</div>
      ) : (
        data.slice(0, 8).map((item, i) => (
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
