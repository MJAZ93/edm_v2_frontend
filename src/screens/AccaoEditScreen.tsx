import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Card, Heading } from '../components'
import { useAuth } from '../contexts/AuthContext'
import { AccoesApi, ASCApi, MaterialApi, type AccoesCreateAccoesRequest, type AccoesUpdateAccoesRequest, type ModelASC, type ModelMaterial } from '../services'
import { MultiSelect } from '../components/ui/MultiSelect'
import { useUnauthorizedHandlers, isUnauthorizedBody as isUnauthorizedBodyUtil } from '../utils/auth'

export default function AccaoEditScreen() {
  const { getApiConfig, getAuthorizationHeaderValue, logout } = useAuth()
  const api = useMemo(() => new AccoesApi(getApiConfig()), [getApiConfig])
  const ascApi = useMemo(() => new ASCApi(getApiConfig()), [getApiConfig])
  const materialApi = useMemo(() => new MaterialApi(getApiConfig()), [getApiConfig])
  const authHeader = useMemo(() => getAuthorizationHeaderValue(), [getAuthorizationHeaderValue])

  const isCreate = useMemo(() => /\/accoes\/novo$/.test(window.location.pathname), [])
  const id = useMemo(() => window.location.pathname.split('/').filter(Boolean)[1] || '', [])

  const [ascs, setAscs] = useState<ModelASC[]>([])
  const [materials, setMaterials] = useState<ModelMaterial[]>([])

  const [accoes, setAccoes] = useState('')
  const [amount, setAmount] = useState<string>('')
  const [ascId, setAscId] = useState('')
  const [dataImpl, setDataImpl] = useState<string>('')
  const [meses, setMeses] = useState<string>('')
  const [materialIds, setMaterialIds] = useState<string[]>([])

  const [loading, setLoading] = useState(!isCreate)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const { ensureAuthorizedResponse, ensureAuthorizedError } = useUnauthorizedHandlers()

useEffect(() => { (async () => { try { const { data } = await ascApi.privateAscsGet(authHeader, -1, undefined, 'name', 'asc'); ensureAuthorizedResponse(data); setAscs((data as any).items ?? []) } catch (err: any) { ensureAuthorizedError(err) } })() }, [ascApi, authHeader])
useEffect(() => { (async () => { try { const { data } = await materialApi.privateMateriaisGet(authHeader, -1, undefined, 'name', 'asc'); ensureAuthorizedResponse(data); setMaterials((data as any).items ?? []) } catch (err: any) { ensureAuthorizedError(err) } })() }, [materialApi, authHeader])

  useEffect(() => { (async () => {
    if (isCreate) return
    setLoading(true); setError(null)
    try {
      const { data } = await api.privateAccoesIdGet(id, authHeader)
      ensureAuthorizedResponse(data)
      const it = data as any
      setAccoes(it.accoes || '')
      setAmount(it.amount != null ? String(it.amount) : '')
      setAscId(it.asc_id || '')
      setDataImpl((it.data_implementacao || '').slice(0, 10))
      setMeses(it.meses_analise != null ? String(it.meses_analise) : '')
      setMaterialIds(((it.materiais || []) as any[]).map((m) => m.id).filter(Boolean))
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 401 || isUnauthorizedBody(err?.response?.data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      setError(!status ? 'Sem ligação ao servidor.' : 'Falha a obter ação.')
    } finally { setLoading(false) }
  })() }, [api, authHeader, id, isCreate])

  async function submit() {
    setSubmitting(true); setSubmitError(null)
    try {
      const base = {
        accoes: accoes || undefined,
        amount: amount ? Number(amount) : undefined,
        asc_id: ascId || undefined,
        data_implementacao: dataImpl || undefined,
        material_ids: materialIds,
        meses_analise: meses ? Number(meses) : undefined,
      }
      if (isCreate) {
        const payload: AccoesCreateAccoesRequest = base
        const { data } = await api.privateAccoesPost(authHeader, payload)
        ensureAuthorizedResponse(data)
        const newId = (data as any)?.id
        window.history.pushState({}, '', newId ? `/accoes/${newId}` : '/accoes')
      } else {
        const payload: AccoesUpdateAccoesRequest = base
        const { data } = await api.privateAccoesIdPut(id, authHeader, payload)
        ensureAuthorizedResponse(data)
        window.history.pushState({}, '', `/accoes/${id}`)
      }
      window.dispatchEvent(new Event('locationchange'))
    } catch (err: any) {
      ensureAuthorizedError(err)
      setSubmitError(!status ? 'Sem ligação ao servidor.' : status >= 500 ? 'Erro do servidor ao guardar.' : 'Falha ao guardar ação.')
    } finally { setSubmitting(false) }
  }

  function cancelar() { window.history.pushState({}, '', isCreate ? '/accoes' : `/accoes/${id}`); window.dispatchEvent(new Event('locationchange')) }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Heading level={2}>{isCreate ? 'Nova ação' : 'Editar ação'}</Heading>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" onClick={cancelar}>Voltar</Button>
          <Button onClick={submit} disabled={submitting}>{submitting ? 'A guardar…' : 'Guardar'}</Button>
        </div>
      </div>
      {error ? <div style={{ background: '#fee2e2', color: '#991b1b', padding: 10, borderRadius: 8 }}>{error}</div> : null}
      {submitError ? <div style={{ background: '#fee2e2', color: '#991b1b', padding: 10, borderRadius: 8 }}>{submitError}</div> : null}
      <Card title="Dados da ação">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 260 }}>
            <span style={{ fontSize: 13, color: '#374151' }}>Ação</span>
            <textarea value={accoes} onChange={(e) => setAccoes(e.target.value)} placeholder="Descrição detalhada da ação" rows={5} style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db', resize: 'vertical', minWidth: 360 }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 160 }}>
            <span style={{ fontSize: 13, color: '#374151' }}>Valor</span>
            <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="0" style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 220 }}>
            <span style={{ fontSize: 13, color: '#374151' }}>ASC</span>
            <select value={ascId} onChange={(e) => setAscId(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db', background: '#fff' }}>
              <option value="">— Selecionar —</option>
              {ascs.map((a) => <option key={a.id} value={a.id}>{a.name || a.id}</option>)}
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 200 }}>
            <span style={{ fontSize: 13, color: '#374151' }}>Data de implementação</span>
            <input type="date" value={dataImpl} onChange={(e) => setDataImpl(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 160 }}>
            <span style={{ fontSize: 13, color: '#374151' }}>Meses de análise</span>
            <input value={meses} onChange={(e) => setMeses(e.target.value)} inputMode="numeric" placeholder="0" style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db' }} />
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 320, flex: 1 }}>
            <span style={{ fontSize: 13, color: '#374151' }}>Materiais</span>
            <MultiSelect
              options={materials.map((m) => ({ id: String(m.id), label: String(m.name || m.id) }))}
              value={materialIds}
              onChange={(ids) => setMaterialIds(ids)}
              placeholder="Selecionar materiais…"
              searchPlaceholder="Procurar materiais…"
              noResultsText="Sem materiais"
            />
            <span style={{ color: '#6b7280', fontSize: 12 }}>Pode pesquisar e selecionar múltiplos.</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
