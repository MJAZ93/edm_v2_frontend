import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Card, Heading } from '../components'
import { useAuth } from '../contexts/AuthContext'
import { InfractionApi, SectorInfracaoApi, TipoInfracaoApi, type ModelInfraction, type ModelSectorInfracao, type ModelTipoInfracao, type InfractionUpdateInfractionRequest } from '../services'

export default function InfractionEditScreen() {
  const { getApiConfig, getAuthorizationHeaderValue, logout } = useAuth()
  const api = useMemo(() => new InfractionApi(getApiConfig()), [getApiConfig])
  const sectorApi = useMemo(() => new SectorInfracaoApi(getApiConfig()), [getApiConfig])
  const tipoApi = useMemo(() => new TipoInfracaoApi(getApiConfig()), [getApiConfig])
  const authHeader = useMemo(() => getAuthorizationHeaderValue(), [getAuthorizationHeaderValue])

  const id = useMemo(() => window.location.pathname.split('/').filter(Boolean)[1] || '', [])

  const [setores, setSetores] = useState<ModelSectorInfracao[]>([])
  const [tipos, setTipos] = useState<ModelTipoInfracao[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const [sectorId, setSectorId] = useState('')
  const [tipoId, setTipoId] = useState('')
  const [tipoMaterial, setTipoMaterial] = useState('')
  const [quantidade, setQuantidade] = useState<string>('')
  const [valor, setValor] = useState<string>('')
  const [lat, setLat] = useState<string>('')
  const [long, setLong] = useState<string>('')

  const isUnauthorizedBody = (data: any) => { try { const raw = data?.code ?? data?.error?.code ?? data?.status ?? data?.error?.status ?? data?.error_code; if (raw == null) return false; const num = Number(raw); if (!Number.isNaN(num) && num === 401) return true; const code = String(raw).toUpperCase(); return code === 'UNAUTHORIZED' || 'UNAUTHENTICATED' } catch { return false } }

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [{ data: d1 }, { data: d2 }, { data: d3 }] = await Promise.all([
        api.privateInfractionsIdGet(id, authHeader),
        sectorApi.privateSectorInfracaoGet(authHeader, -1, undefined, 'name', 'asc'),
        tipoApi.privateTiposInfracaoGet(authHeader, -1, undefined, 'name', 'asc')
      ])
      if ([d1, d2, d3].some((x) => isUnauthorizedBody(x))) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      const it = d1 as ModelInfraction
      setSectorId(it.sector_infracao_id || '')
      setTipoId(it.tipo_infracao_id || '')
      setTipoMaterial(it.tipo_material || '')
      setQuantidade(it.quantidade != null ? String(it.quantidade) : '')
      setValor(it.valor != null ? String(it.valor) : '')
      setLat(it.lat != null ? String(it.lat) : '')
      setLong(it.long != null ? String(it.long) : '')
      setSetores((d2 as any).items ?? [])
      setTipos((d3 as any).items ?? [])
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 401 || isUnauthorizedBody(err?.response?.data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      setError(!status ? 'Sem ligação ao servidor.' : 'Falha a obter infração.')
    } finally { setLoading(false) }
  }, [api, authHeader, id])

  useEffect(() => { load() }, [load])

  async function submit() {
    setSubmitting(true); setSubmitError(null)
    try {
      const payload: InfractionUpdateInfractionRequest = {
        sector_infracao_id: sectorId || undefined,
        tipo_infracao_id: tipoId || undefined,
        tipo_material: tipoMaterial || undefined,
        quantidade: quantidade ? Number(quantidade) : undefined,
        valor: valor ? Number(valor) : undefined,
        lat: lat ? Number(lat) : undefined,
        long: long ? Number(long) : undefined,
      }
      const { data } = await api.privateInfractionsIdPut(id, authHeader, payload)
      if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      // voltar aos detalhes
      window.history.pushState({}, '', `/infracoes/${id}`)
      window.dispatchEvent(new Event('locationchange'))
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 401 || isUnauthorizedBody(err?.response?.data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      setSubmitError(!status ? 'Sem ligação ao servidor.' : status >= 500 ? 'Erro do servidor ao atualizar.' : 'Falha ao atualizar infração.')
    } finally { setSubmitting(false) }
  }

  function cancelar() {
    window.history.pushState({}, '', `/infracoes/${id}`)
    window.dispatchEvent(new Event('locationchange'))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Heading level={2}>Editar infração</Heading>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" onClick={cancelar}>Voltar</Button>
          <Button onClick={submit} disabled={submitting}>{submitting ? 'A guardar…' : 'Guardar'}</Button>
        </div>
      </div>

      {error ? <div style={{ background: '#fee2e2', color: '#991b1b', padding: 10, borderRadius: 8 }}>{error}</div> : null}
      {submitError ? <div style={{ background: '#fee2e2', color: '#991b1b', padding: 10, borderRadius: 8 }}>{submitError}</div> : null}

      <Card title="Dados da infração">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 220 }}>
            <span style={{ fontSize: 13, color: '#374151' }}>Sector de Infração</span>
            <select value={sectorId} onChange={(e) => setSectorId(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db', background: '#fff' }}>
              <option value="">— Selecionar —</option>
              {setores.map((s) => <option key={s.id} value={s.id}>{s.name || s.id}</option>)}
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 220 }}>
            <span style={{ fontSize: 13, color: '#374151' }}>Tipo de Infração</span>
            <select value={tipoId} onChange={(e) => setTipoId(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db', background: '#fff' }}>
              <option value="">— Selecionar —</option>
              {tipos.map((t) => <option key={t.id} value={t.id}>{t.name || t.id}</option>)}
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 200 }}>
            <span style={{ fontSize: 13, color: '#374151' }}>Tipo de material</span>
            <input value={tipoMaterial} onChange={(e) => setTipoMaterial(e.target.value)} placeholder="ex.: Cabo, Ferro…" style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 140 }}>
            <span style={{ fontSize: 13, color: '#374151' }}>Quantidade</span>
            <input value={quantidade} onChange={(e) => setQuantidade(e.target.value)} inputMode="decimal" placeholder="0" style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 140 }}>
            <span style={{ fontSize: 13, color: '#374151' }}>Valor</span>
            <input value={valor} onChange={(e) => setValor(e.target.value)} inputMode="decimal" placeholder="0" style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 140 }}>
            <span style={{ fontSize: 13, color: '#374151' }}>Latitude</span>
            <input value={lat} onChange={(e) => setLat(e.target.value)} inputMode="decimal" placeholder="-25.96" style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 140 }}>
            <span style={{ fontSize: 13, color: '#374151' }}>Longitude</span>
            <input value={long} onChange={(e) => setLong(e.target.value)} inputMode="decimal" placeholder="32.58" style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db' }} />
          </label>
        </div>
      </Card>
    </div>
  )
}

