import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Card, Heading } from '../components'
import { useAuth } from '../contexts/AuthContext'
import { InstallationsApi, type ModelInstallation } from '../services'

export default function InstallationDetailScreen() {
  const { getApiConfig, getAuthorizationHeaderValue, logout } = useAuth()
  const api = useMemo(() => new InstallationsApi(getApiConfig()), [getApiConfig])
  const authHeader = useMemo(() => getAuthorizationHeaderValue(), [getAuthorizationHeaderValue])

  const pf = useMemo(() => {
    const parts = window.location.pathname.split('/').filter(Boolean)
    return parts[1] || ''
  }, [])
  const mes = useMemo(() => new URLSearchParams(window.location.search).get('mes') || '', [])

  const [item, setItem] = useState<ModelInstallation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isUnauthorizedBody = (data: any) => { try { const raw = data?.code ?? data?.error?.code ?? data?.status ?? data?.error?.status ?? data?.error_code; if (raw == null) return false; const num = Number(raw); if (!Number.isNaN(num) && num === 401) return true; const code = String(raw).toUpperCase(); return code === 'UNAUTHORIZED' || code === 'UNAUTHENTICATED' } catch { return false } }

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const { data } = await api.privateInstallationsPfGet(pf, mes, authHeader)
      if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      setItem(data as any)
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 401 || isUnauthorizedBody(err?.response?.data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      setError(!status ? 'Sem ligação ao servidor.' : 'Falha a obter instalação.')
    } finally { setLoading(false) }
  }, [api, authHeader, pf, mes])

  useEffect(() => { if (pf && mes) load() }, [load, pf, mes])

  function voltar() {
    if (window.location.pathname !== '/instalacoes') window.history.pushState({}, '', '/instalacoes')
    window.dispatchEvent(new Event('locationchange'))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Heading level={2}>Detalhes da instalação</Heading>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" onClick={voltar}>Voltar</Button>
        </div>
      </div>

      {!pf || !mes ? (
        <div style={{ background: '#fef3c7', color: '#92400e', padding: 10, borderRadius: 8 }}>Parâmetros inválidos. Falta PF ou mês.</div>
      ) : null}

      {loading && <div style={{ color: '#6b7280' }}>A carregar…</div>}
      {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: 10, borderRadius: 8 }}>{error}</div>}
      {!loading && !error && item && (
        <>
          <Card title="Identificação">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              <Field label="PF" value={item.pf || '-'} />
              <Field label="Nome" value={item.nome || '-'} />
              <Field label="Região" value={item.regiao_id || '-'} />
              <Field label="PT" value={item.pt_name || item.pt_id || '-'} />
              <Field label="Mês" value={formatMonth(item.mes)} />
            </div>
          </Card>
          <Card title="Indicadores">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              <Field label="Compras (6 meses)" value={formatNumber(item.compras_6_meses)} />
              <Field label="Compras vizinhos (6 meses)" value={formatNumber(item.compras_vizinhos_6_meses)} />
              <Field label="Equipamentos (6 meses)" value={formatNumber(item.equipamentos_6_meses)} />
              <Field label="Score" value={formatNumber(item.score)} />
              <Field label="AI Score" value={formatNumber(item.ai_score)} />
              <Field label="Tarifa" value={formatNumber(item.tarifa)} />
              <Field label="Tendência" value={formatTendencia(item.tendencia_compras)} />
            </div>
          </Card>
        </>
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

function formatNumber(n?: number) { return typeof n === 'number' && !Number.isNaN(n) ? String(n) : '-' }
function formatMonth(iso?: string) { if (!iso) return '-'; try { const d = new Date(iso as any); if (Number.isNaN(d.getTime())) return '-'; return d.toLocaleDateString('pt-PT', { year: 'numeric', month: '2-digit' }) } catch { return '-' } }
function formatTendencia(t?: any) {
  const v = String(t || '')
  switch (v) {
    case 'CRESCENTE': return 'Crescente'
    case 'MUITO_CRESCENTE': return 'Muito crescente'
    case 'NORMAL': return 'Normal'
    case 'DECRESCENTE': return 'Decrescente'
    case 'MUITO_DECRESCENTE': return 'Muito decrescente'
    case 'SEM_COMPRAS': return 'Sem compras'
    default: return '-'
  }
}

