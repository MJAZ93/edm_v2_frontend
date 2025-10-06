import React, { useMemo, useState, useEffect } from 'react'
import { Button, Card, Heading } from '../components'
import { useAuth } from '../contexts/AuthContext'
import { ReportsApi, RegiaoApi, ASCApi, type ModelRegiao, type ModelASC } from '../services'

export default function ReportsScreen() {
  const { getApiConfig, getAuthorizationHeaderValue, logout } = useAuth()
  const reportsApi = useMemo(() => new ReportsApi(getApiConfig()), [getApiConfig])
  const regiaoApi = useMemo(() => new RegiaoApi(getApiConfig()), [getApiConfig])
  const ascApi = useMemo(() => new ASCApi(getApiConfig()), [getApiConfig])
  const authHeader = useMemo(() => getAuthorizationHeaderValue(), [getAuthorizationHeaderValue])

  const [executing, setExecuting] = useState(false)
  const [execMsg, setExecMsg] = useState<string | null>(null)

  const [entity, setEntity] = useState<'asc' | 'regiao' | 'occurrences' | 'infractions' | 'infractors' | 'accoes'>('occurrences')
  const [dateStart, setDateStart] = useState<string | null>(null)
  const [dateEnd, setDateEnd] = useState<string | null>(null)
  const [regiaoId, setRegiaoId] = useState('')
  const [ascId, setAscId] = useState('')
  const [downloading, setDownloading] = useState(false)
  const [downloadMsg, setDownloadMsg] = useState<string | null>(null)

  const [regioes, setRegioes] = useState<ModelRegiao[]>([])
  const [ascs, setAscs] = useState<ModelASC[]>([])

  const isUnauthorizedBody = (data: any) => {
    try {
      const raw = data?.code ?? data?.error?.code ?? data?.status ?? data?.error?.status ?? data?.error_code
      if (raw === undefined || raw === null) return false
      const num = Number(raw)
      if (!Number.isNaN(num) && num === 401) return true
      const code = String(raw).toUpperCase()
      return code === 'UNAUTHORIZED' || code === 'UNAUTHENTICATED'
    } catch { return false }
  }

  useEffect(() => { (async () => { try { const { data } = await regiaoApi.privateRegioesGet(authHeader, 1, 200, 'name', 'asc'); if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return } setRegioes((data as any).items ?? []) } catch {} })() }, [regiaoApi, authHeader])
  useEffect(() => { (async () => { try { const { data } = await ascApi.privateAscsGet(authHeader, 1, 200, 'name', 'asc', undefined, regiaoId || undefined); if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return } setAscs((data as any).items ?? []) } catch {} })() }, [ascApi, authHeader, regiaoId])

  async function runMonthly() {
    setExecMsg(null); setExecuting(true)
    try {
      const { data } = await reportsApi.privateReportsExecutePost(authHeader)
      if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      setExecMsg('Relatório mensal executado com sucesso.')
    } catch (err: any) {
      const status = err?.response?.status
      setExecMsg(!status ? 'Sem ligação ao servidor.' : status >= 500 ? 'Erro do servidor ao executar.' : 'Falha ao executar relatório.')
    } finally { setExecuting(false) }
  }

  function toRfc3339(d?: string | null): string | undefined {
    if (!d) return undefined
    try { return new Date(`${d}T00:00:00Z`).toISOString() } catch { return undefined }
  }
  function toRfc3339End(d?: string | null): string | undefined {
    if (!d) return undefined
    try { return new Date(`${d}T23:59:59Z`).toISOString() } catch { return undefined }
  }

  async function exportCsv() {
    setDownloadMsg(null); setDownloading(true)
    try {
      const resp = await reportsApi.privateReportsExportGet(
        entity,
        authHeader,
        toRfc3339(dateStart),
        toRfc3339End(dateEnd),
        regiaoId || undefined,
        ascId || undefined,
        { responseType: 'blob' }
      )
      const data: any = resp.data as any
      const blob = data instanceof Blob ? data : new Blob([data], { type: 'text/csv;charset=utf-8' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
      a.download = `relatorio-${entity}-${stamp}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      setDownloadMsg('Exportação iniciada.')
    } catch (err: any) {
      const status = err?.response?.status
      setDownloadMsg(!status ? 'Sem ligação ao servidor.' : status >= 500 ? 'Erro do servidor ao exportar.' : 'Falha a exportar relatório.')
    } finally { setDownloading(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Heading level={2}>Relatórios</Heading>

      <Card title="Relatório mensal">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <span>Executar envio do relatório mensal de vandalizações.</span>
            <Button onClick={runMonthly} disabled={executing}>{executing ? 'A executar…' : 'Executar'}</Button>
          </div>
          <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', color: '#9a3412', padding: 10, borderRadius: 8 }}>
            Atenção: este relatório é enviado automaticamente todos os dias 10.
          </div>
          {execMsg ? <div style={{ padding: 10, borderRadius: 8, background: '#f3f4f6', color: '#111827' }}>{execMsg}</div> : null}
        </div>
      </Card>

      <Card title="Exportar CSV">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 200 }}>
            <span style={{ fontSize: 13, color: '#374151' }}>Entidade</span>
            <select value={entity} onChange={(e) => setEntity(e.target.value as any)} style={{ padding: 12, borderRadius: 8, border: '1px solid #d1d5db', background: '#fff' }}>
              <option value="asc">ASCs</option>
              <option value="regiao">Regiões</option>
              <option value="occurrences">Ocorrências</option>
              <option value="infractions">Infrações</option>
              <option value="infractors">Infractores</option>
              <option value="accoes">Ações</option>
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, color: '#374151' }}>Início</span>
            <input type="date" value={dateStart ?? ''} onChange={(e) => setDateStart(e.target.value || null)} style={{ padding: 12, borderRadius: 8, border: '1px solid #d1d5db' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, color: '#374151' }}>Fim</span>
            <input type="date" value={dateEnd ?? ''} onChange={(e) => setDateEnd(e.target.value || null)} style={{ padding: 12, borderRadius: 8, border: '1px solid #d1d5db' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 220 }}>
            <span style={{ fontSize: 13, color: '#374151' }}>Região</span>
            <select value={regiaoId} onChange={(e) => { setRegiaoId(e.target.value); setAscId('') }} style={{ padding: 12, borderRadius: 8, border: '1px solid #d1d5db', background: '#fff' }}>
              <option value="">— Selecionar —</option>
              {regioes.map((r) => <option key={r.id} value={r.id}>{r.name || r.id}</option>)}
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 220 }}>
            <span style={{ fontSize: 13, color: '#374151' }}>ASC</span>
            <select value={ascId} onChange={(e) => setAscId(e.target.value)} style={{ padding: 12, borderRadius: 8, border: '1px solid #d1d5db', background: '#fff' }}>
              <option value="">— Selecionar —</option>
              {ascs.map((a) => <option key={a.id} value={a.id}>{a.name || a.id}</option>)}
            </select>
          </label>
        </div>
        <div style={{ marginTop: 10 }}>
          <Button onClick={exportCsv} disabled={downloading}>{downloading ? 'A preparar…' : 'Exportar CSV'}</Button>
        </div>
        {downloadMsg ? <div style={{ marginTop: 10, padding: 10, borderRadius: 8, background: '#f3f4f6', color: '#111827' }}>{downloadMsg}</div> : null}
      </Card>
    </div>
  )
}
