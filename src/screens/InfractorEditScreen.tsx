import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Card } from '../components'
import { useAuth } from '../contexts/AuthContext'
import { InfractorApi, type InfractorUpdateInfractorRequest, type ModelInfractor } from '../services'

export default function InfractorEditScreen() {
  const { getApiConfig, getAuthorizationHeaderValue, logout } = useAuth()
  const api = useMemo(() => new InfractorApi(getApiConfig()), [getApiConfig])
  const authHeader = useMemo(() => getAuthorizationHeaderValue(), [getAuthorizationHeaderValue])
  const id = useMemo(() => window.location.pathname.split('/').filter(Boolean)[1] || '', [])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const [nome, setNome] = useState('')
  const [doc, setDoc] = useState('')
  const [tipoDoc, setTipoDoc] = useState('')

  const isUnauthorizedBody = (data: any) => {
    try {
      const raw = data?.code ?? data?.error?.code ?? data?.status ?? data?.error?.status ?? data?.error_code
      if (raw == null) return false
      const num = Number(raw)
      if (!Number.isNaN(num) && num === 401) return true
      const code = String(raw).toUpperCase()
      return code === 'UNAUTHORIZED' || code === 'UNAUTHENTICATED'
    } catch {
      return false
    }
  }

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.privateInfractorsIdGet(id, authHeader)
      if (isUnauthorizedBody(data)) {
        logout('Sessão expirada. Inicie sessão novamente.')
        return
      }
      const item = data as ModelInfractor
      setNome(item.nome || '')
      setDoc(item.nr_identificacao || '')
      setTipoDoc(item.tipo_identificacao || '')
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 401 || isUnauthorizedBody(err?.response?.data)) {
        logout('Sessão expirada. Inicie sessão novamente.')
        return
      }
      setError(!status ? 'Sem ligação ao servidor.' : 'Falha a obter infractor.')
    } finally {
      setLoading(false)
    }
  }, [api, authHeader, id, logout])

  useEffect(() => { load() }, [load])

  async function submit() {
    setSubmitting(true)
    setSubmitError(null)
    try {
      const payload: InfractorUpdateInfractorRequest = {
        nome: nome || undefined,
        nr_identificacao: doc || undefined,
        tipo_identificacao: tipoDoc || undefined,
      }
      const { data } = await api.privateInfractorsIdPut(id, authHeader, payload)
      if (isUnauthorizedBody(data)) {
        logout('Sessão expirada. Inicie sessão novamente.')
        return
      }
      window.history.pushState({}, '', `/infractores/${id}`)
      window.dispatchEvent(new Event('locationchange'))
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 401 || isUnauthorizedBody(err?.response?.data)) {
        logout('Sessão expirada. Inicie sessão novamente.')
        return
      }
      setSubmitError(!status ? 'Sem ligação ao servidor.' : status >= 500 ? 'Erro do servidor ao atualizar.' : 'Falha ao atualizar infractor.')
    } finally {
      setSubmitting(false)
    }
  }

  function cancelar() {
    window.history.pushState({}, '', `/infractores/${id}`)
    window.dispatchEvent(new Event('locationchange'))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={screenHeroStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={screenEyebrowStyle}>Infractores</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <h2 style={{ margin: 0, fontSize: 30, lineHeight: 1.05, color: '#1f2937' }}>Editar infractor</h2>
            <p style={{ margin: 0, color: '#5f6673', lineHeight: 1.6 }}>
              Atualize os dados de identificação do infractor dentro da mesma linguagem visual usada nas infrações.
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
            <span>{submitting ? 'A guardar…' : 'Guardar alterações'}</span>
          </button>
        </div>
      </div>

      {loading ? <div style={infoBannerStyle}>A carregar…</div> : null}
      {error ? <div style={errorBannerStyle}>{error}</div> : null}
      {submitError ? <div style={errorBannerStyle}>{submitError}</div> : null}

      <Card title="Dados do infractor" subtitle="Atualize os campos essenciais de identificação e registo.">
        <div style={formGridStyle}>
          <label style={fieldGroupStyle}>
            <span style={fieldLabelStyle}>Nome</span>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome completo"
              style={fieldControlStyle}
              disabled={loading || submitting}
            />
          </label>

          <label style={fieldGroupStyle}>
            <span style={fieldLabelStyle}>Documento</span>
            <input
              value={doc}
              onChange={(e) => setDoc(e.target.value)}
              placeholder="N.º de identificação"
              style={fieldControlStyle}
              disabled={loading || submitting}
            />
          </label>

          <label style={fieldGroupStyle}>
            <span style={fieldLabelStyle}>Tipo de identificação</span>
            <input
              value={tipoDoc}
              onChange={(e) => setTipoDoc(e.target.value)}
              placeholder="BI, Passaporte…"
              style={fieldControlStyle}
              disabled={loading || submitting}
            />
          </label>
        </div>
      </Card>
    </div>
  )
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
