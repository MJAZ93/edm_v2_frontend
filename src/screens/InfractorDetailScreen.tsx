import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Card, Heading } from '../components'
import { useAuth } from '../contexts/AuthContext'
import { InfractorApi, type ModelInfractor } from '../services'

export default function InfractorDetailScreen() {
  const { getApiConfig, getAuthorizationHeaderValue, logout } = useAuth()
  const api = useMemo(() => new InfractorApi(getApiConfig()), [getApiConfig])
  const authHeader = useMemo(() => getAuthorizationHeaderValue(), [getAuthorizationHeaderValue])
  const id = useMemo(() => window.location.pathname.split('/').filter(Boolean)[1] || '', [])

  const [item, setItem] = useState<ModelInfractor | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isUnauthorizedBody = (data: any) => { try { const raw = data?.code ?? data?.error?.code ?? data?.status ?? data?.error?.status ?? data?.error_code; if (raw == null) return false; const num = Number(raw); if (!Number.isNaN(num) && num === 401) return true; const code = String(raw).toUpperCase(); return code === 'UNAUTHORIZED' || code === 'UNAUTHENTICATED' } catch { return false } }

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const { data } = await api.privateInfractorsIdGet(id, authHeader)
      if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      setItem(data as any)
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 401 || isUnauthorizedBody(err?.response?.data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      setError(!status ? 'Sem ligação ao servidor.' : 'Falha a obter infractor.')
    } finally { setLoading(false) }
  }, [api, authHeader, id])

  useEffect(() => { load() }, [load])

  function voltar() {
    if (window.location.pathname !== '/infractores') window.history.pushState({}, '', '/infractores')
    window.dispatchEvent(new Event('locationchange'))
  }
  function editar() { if (id) { window.history.pushState({}, '', `/infractores/${id}/editar`); window.dispatchEvent(new Event('locationchange')) } }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Heading level={2}>Detalhes do infractor</Heading>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" onClick={voltar}>Voltar</Button>
          <Button onClick={editar}>Editar</Button>
        </div>
      </div>

      {loading && <div style={{ color: '#6b7280' }}>A carregar…</div>}
      {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: 10, borderRadius: 8 }}>{error}</div>}
      {!loading && !error && item && (
        <Card title="Dados do infractor">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            <Field label="Nome" value={item.nome || '-'} />
            <Field label="Documento" value={item.nr_identificacao || '-'} />
            <Field label="Tipo de identificação" value={item.tipo_identificacao || '-'} />
            <Field label="Criado em" value={formatDate(item.created_at)} />
          </div>
        </Card>
      )}
    </div>
  )
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: '#6b7280' }}>{label}</div>
      <div style={{ fontWeight: 500 }}>{value || '-'}</div>
    </div>
  )
}

function formatDate(iso?: string) { if (!iso) return '-'; try { const d = new Date(iso); if (Number.isNaN(d.getTime())) return '-'; return d.toLocaleString('pt-PT') } catch { return '-' } }

