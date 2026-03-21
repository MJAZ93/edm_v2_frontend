import React, { useEffect, useMemo, useState } from 'react'
import { Card } from '../components'
import { MultiSelect } from '../components/ui/MultiSelect'
import { useAuth } from '../contexts/AuthContext'
import { ASCApi, AccoesApi, MaterialApi, type AccoesCreateAccoesRequest, type AccoesUpdateAccoesRequest, type ModelASC, type ModelMaterial } from '../services'
import { isUnauthorizedBody as isUnauthorizedBodyUtil, useUnauthorizedHandlers } from '../utils/auth'

export default function AccaoEditScreen() {
  const { getApiConfig, getAuthorizationHeaderValue } = useAuth()
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

  useEffect(() => {
    ;(async () => {
      try {
        const { data } = await ascApi.privateAscsGet(authHeader, -1, undefined, 'name', 'asc')
        ensureAuthorizedResponse(data)
        setAscs((data as any).items ?? [])
      } catch (err: any) {
        ensureAuthorizedError(err)
      }
    })()
  }, [ascApi, authHeader, ensureAuthorizedError, ensureAuthorizedResponse])

  useEffect(() => {
    ;(async () => {
      try {
        const { data } = await materialApi.privateMateriaisGet(authHeader, -1, undefined, 'name', 'asc')
        ensureAuthorizedResponse(data)
        setMaterials((data as any).items ?? [])
      } catch (err: any) {
        ensureAuthorizedError(err)
      }
    })()
  }, [authHeader, ensureAuthorizedError, ensureAuthorizedResponse, materialApi])

  useEffect(() => {
    ;(async () => {
      if (isCreate) return
      setLoading(true)
      setError(null)
      try {
        const { data } = await api.privateAccoesIdGet(id, authHeader)
        ensureAuthorizedResponse(data)
        const payload = data as any
        const item = normalizeAccaoPayload(payload)
        setAccoes(item.accoes || '')
        setAmount(item.amount != null ? String(item.amount) : '')
        setAscId(item.asc_id || '')
        setDataImpl((item.data_implementacao || '').slice(0, 10))
        setMeses(item.meses_analise != null ? String(item.meses_analise) : '')
        setMaterialIds(((item.materiais || []) as any[]).map((material) => String(material.id)).filter(Boolean))
      } catch (err: any) {
        const status = err?.response?.status
        if (status === 401 || isUnauthorizedBodyUtil(err?.response?.data)) {
          ensureAuthorizedError(err)
          return
        }
        setError(!status ? 'Sem ligação ao servidor.' : 'Falha a obter ação.')
      } finally {
        setLoading(false)
      }
    })()
  }, [api, authHeader, ensureAuthorizedError, ensureAuthorizedResponse, id, isCreate])

  async function submit() {
    setSubmitting(true)
    setSubmitError(null)
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
      const status = err?.response?.status
      if (status === 401 || isUnauthorizedBodyUtil(err?.response?.data)) {
        ensureAuthorizedError(err)
        return
      }
      setSubmitError(!status ? 'Sem ligação ao servidor.' : status >= 500 ? 'Erro do servidor ao guardar.' : 'Falha ao guardar ação.')
    } finally {
      setSubmitting(false)
    }
  }

  function cancelar() {
    window.history.pushState({}, '', isCreate ? '/accoes' : `/accoes/${id}`)
    window.dispatchEvent(new Event('locationchange'))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={screenHeroStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={screenEyebrowStyle}>Ações</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <h2 style={{ margin: 0, fontSize: 30, lineHeight: 1.05, color: '#1f2937' }}>
              {isCreate ? 'Nova ação' : 'Editar ação'}
            </h2>
            <p style={{ margin: 0, color: '#5f6673', lineHeight: 1.6 }}>
              {isCreate
                ? 'Registe uma nova ação com enquadramento, período de implementação e materiais associados.'
                : 'Atualize a ação mantendo a mesma estrutura visual e leitura usada nas restantes áreas operacionais.'}
            </p>
          </div>
        </div>
        <div style={screenActionRowStyle}>
          <button type="button" onClick={cancelar} style={detailSecondaryActionStyle}>
            <IconBack />
            <span>Voltar</span>
          </button>
          <button type="button" onClick={submit} style={detailPrimaryActionStyle} disabled={submitting || loading}>
            <IconSave />
            <span>{submitting ? 'A guardar…' : 'Guardar'}</span>
          </button>
        </div>
      </div>

      {loading ? <div style={infoBannerStyle}>A carregar…</div> : null}
      {error ? <div style={errorBannerStyle}>{error}</div> : null}
      {submitError ? <div style={errorBannerStyle}>{submitError}</div> : null}

      <Card title="Dados da ação" subtitle="Preencha o enquadramento operacional e os elementos usados na análise.">
        <div style={formGridStyle}>
          <label style={{ ...fieldGroupStyle, gridColumn: '1 / -1' }}>
            <span style={fieldLabelStyle}>Ação</span>
            <textarea
              value={accoes}
              onChange={(e) => setAccoes(e.target.value)}
              placeholder="Descrição detalhada da ação"
              rows={5}
              style={textAreaStyle}
              disabled={loading || submitting}
            />
          </label>

          <label style={fieldGroupStyle}>
            <span style={fieldLabelStyle}>Valor</span>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
              placeholder="0"
              style={fieldControlStyle}
              disabled={loading || submitting}
            />
          </label>

          <label style={fieldGroupStyle}>
            <span style={fieldLabelStyle}>ASC</span>
            <select value={ascId} onChange={(e) => setAscId(e.target.value)} style={fieldControlStyle} disabled={loading || submitting}>
              <option value="">Selecionar</option>
              {ascs.map((asc) => <option key={asc.id} value={asc.id}>{asc.name || asc.id}</option>)}
            </select>
          </label>

          <label style={fieldGroupStyle}>
            <span style={fieldLabelStyle}>Data de implementação</span>
            <input
              type="date"
              value={dataImpl}
              onChange={(e) => setDataImpl(e.target.value)}
              style={fieldControlStyle}
              disabled={loading || submitting}
            />
          </label>

          <label style={fieldGroupStyle}>
            <span style={fieldLabelStyle}>Meses de análise</span>
            <input
              value={meses}
              onChange={(e) => setMeses(e.target.value)}
              inputMode="numeric"
              placeholder="0"
              style={fieldControlStyle}
              disabled={loading || submitting}
            />
          </label>

          <div style={{ ...fieldGroupStyle, gridColumn: '1 / -1' }}>
            <span style={fieldLabelStyle}>Materiais</span>
            <MultiSelect
              options={materials.map((material) => ({ id: String(material.id), label: String(material.name || material.id) }))}
              value={materialIds}
              onChange={(ids) => setMaterialIds(ids)}
              placeholder="Selecionar materiais…"
              searchPlaceholder="Procurar materiais…"
              noResultsText="Sem materiais"
            />
            <span style={helperTextStyle}>Pode pesquisar e selecionar múltiplos materiais associados à ação.</span>
          </div>
        </div>
      </Card>
    </div>
  )
}

function normalizeAccaoPayload(payload: any) {
  const wrapped = payload?.accoes
  if (wrapped && typeof wrapped === 'object' && !Array.isArray(wrapped)) return wrapped
  return payload ?? {}
}

function IconBack() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconSave() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 4.5H16.5L19.5 7.5V19.5H5V4.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M8 4.5V9.5H15V4.5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9 15H15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
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

const screenActionRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap',
  justifyContent: 'flex-end',
}

const detailSecondaryActionStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  minHeight: 44,
  padding: '0 18px',
  borderRadius: 16,
  border: '1px solid rgba(101, 74, 32, 0.16)',
  background: 'linear-gradient(180deg, #fffaf2 0%, #f6ecde 100%)',
  color: '#8d4a17',
  fontWeight: 800,
  cursor: 'pointer',
  boxShadow: '0 10px 24px rgba(76, 57, 24, 0.08)',
}

const detailPrimaryActionStyle: React.CSSProperties = {
  ...detailSecondaryActionStyle,
  border: '1px solid rgba(201, 109, 31, 0.20)',
  background: 'linear-gradient(180deg, #d77a28 0%, #b85d18 100%)',
  color: '#fffaf5',
}

const infoBannerStyle: React.CSSProperties = {
  padding: '14px 16px',
  borderRadius: 18,
  background: 'rgba(255, 252, 246, 0.92)',
  border: '1px solid rgba(101, 74, 32, 0.12)',
  color: '#5f6673',
  fontWeight: 700,
}

const errorBannerStyle: React.CSSProperties = {
  padding: '14px 16px',
  borderRadius: 18,
  background: '#fff1f1',
  border: '1px solid rgba(200, 60, 60, 0.18)',
  color: '#991b1b',
  fontWeight: 700,
}

const formGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 14,
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
  minHeight: 48,
  padding: '0 14px',
  borderRadius: 14,
  border: '1px solid rgba(101, 74, 32, 0.14)',
  background: '#fffdf9',
  color: '#1f2937',
  boxShadow: '0 10px 24px rgba(101, 74, 32, 0.05)',
}

const textAreaStyle: React.CSSProperties = {
  minHeight: 132,
  padding: '14px 16px',
  borderRadius: 18,
  border: '1px solid rgba(101, 74, 32, 0.14)',
  background: '#fffdf9',
  color: '#1f2937',
  boxShadow: '0 10px 24px rgba(101, 74, 32, 0.05)',
  resize: 'vertical',
}

const helperTextStyle: React.CSSProperties = {
  color: '#7b8494',
  fontSize: 12,
  fontWeight: 600,
}
