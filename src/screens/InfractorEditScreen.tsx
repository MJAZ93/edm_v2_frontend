import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Card, Heading } from '../components'
import { useAuth } from '../contexts/AuthContext'
import { InfractorApi, type ModelInfractor, type InfractorUpdateInfractorRequest } from '../services'

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

  const isUnauthorizedBody = (data: any) => { try { const raw = data?.code ?? data?.error?.code ?? data?.status ?? data?.error?.status ?? data?.error_code; if (raw == null) return false; const num = Number(raw); if (!Number.isNaN(num) && num === 401) return true; const code = String(raw).toUpperCase(); return code === 'UNAUTHORIZED' || code === 'UNAUTHENTICATED' } catch { return false } }

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const { data } = await api.privateInfractorsIdGet(id, authHeader)
      if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      const it = data as ModelInfractor
      setNome(it.nome || '')
      setDoc(it.nr_identificacao || '')
      setTipoDoc(it.tipo_identificacao || '')
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 401 || isUnauthorizedBody(err?.response?.data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      setError(!status ? 'Sem ligação ao servidor.' : 'Falha a obter infractor.')
    } finally { setLoading(false) }
  }, [api, authHeader, id])

  useEffect(() => { load() }, [load])

  async function submit() {
    setSubmitting(true); setSubmitError(null)
    try {
      const payload: InfractorUpdateInfractorRequest = {
        nome: nome || undefined,
        nr_identificacao: doc || undefined,
        tipo_identificacao: tipoDoc || undefined,
      }
      const { data } = await api.privateInfractorsIdPut(id, authHeader, payload)
      if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      window.history.pushState({}, '', `/infractores/${id}`)
      window.dispatchEvent(new Event('locationchange'))
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 401 || isUnauthorizedBody(err?.response?.data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      setSubmitError(!status ? 'Sem ligação ao servidor.' : status >= 500 ? 'Erro do servidor ao atualizar.' : 'Falha ao atualizar infractor.')
    } finally { setSubmitting(false) }
  }

  function cancelar() {
    window.history.pushState({}, '', `/infractores/${id}`)
    window.dispatchEvent(new Event('locationchange'))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Heading level={2}>Editar infractor</Heading>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" onClick={cancelar}>Voltar</Button>
          <Button onClick={submit} disabled={submitting}>{submitting ? 'A guardar…' : 'Guardar'}</Button>
        </div>
      </div>
      {error ? <div style={{ background: '#fee2e2', color: '#991b1b', padding: 10, borderRadius: 8 }}>{error}</div> : null}
      {submitError ? <div style={{ background: '#fee2e2', color: '#991b1b', padding: 10, borderRadius: 8 }}>{submitError}</div> : null}
      <Card title="Dados do infractor">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 200 }}>
            <span style={{ fontSize: 13, color: '#374151' }}>Nome</span>
            <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome" style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 200 }}>
            <span style={{ fontSize: 13, color: '#374151' }}>Documento</span>
            <input value={doc} onChange={(e) => setDoc(e.target.value)} placeholder="Nr. identificação" style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 220 }}>
            <span style={{ fontSize: 13, color: '#374151' }}>Tipo de identificação</span>
            <input value={tipoDoc} onChange={(e) => setTipoDoc(e.target.value)} placeholder="BI, Passaporte…" style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db' }} />
          </label>
        </div>
      </Card>
    </div>
  )
}

