import React, { useEffect, useMemo, useState } from 'react'
import { Card } from '../components'
import { useAuth } from '../contexts/AuthContext'
import { ASCApi, RegiaoApi, type ModelASC, type ModelRegiao } from '../services'

type ReportEntity = 'asc' | 'regiao' | 'occurrences' | 'infractions' | 'infractors' | 'accoes'

const ENTITY_OPTIONS: Array<{ value: ReportEntity; label: string; description: string }> = [
  { value: 'occurrences', label: 'Ocorrências', description: 'Exporta registos operacionais de ocorrências.' },
  { value: 'infractions', label: 'Infrações', description: 'Exporta dados de infrações e enquadramento.' },
  { value: 'infractors', label: 'Infractores', description: 'Exporta pessoas ou entidades infractoras.' },
  { value: 'accoes', label: 'Ações', description: 'Exporta ações e respetivos impactos.' },
  { value: 'asc', label: 'ASCs', description: 'Exporta a estrutura de ASCs registadas.' },
  { value: 'regiao', label: 'Regiões', description: 'Exporta a configuração territorial.' },
]

export default function ReportsScreen() {
  const { getApiConfig, getAuthorizationHeaderValue, getAuthorizationHeaderValueAsync, logout } = useAuth()
  const basePath = useMemo(() => (getApiConfig() as any)?.basePath || '/api', [getApiConfig])
  const regiaoApi = useMemo(() => new RegiaoApi(getApiConfig()), [getApiConfig])
  const ascApi = useMemo(() => new ASCApi(getApiConfig()), [getApiConfig])
  const authHeader = useMemo(() => getAuthorizationHeaderValue(), [getAuthorizationHeaderValue])

  const [executing, setExecuting] = useState(false)
  const [execMsg, setExecMsg] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [downloadMsg, setDownloadMsg] = useState<string | null>(null)

  const [entity, setEntity] = useState<ReportEntity>('occurrences')
  const [dateStart, setDateStart] = useState<string | null>(null)
  const [dateEnd, setDateEnd] = useState<string | null>(null)
  const [regiaoId, setRegiaoId] = useState('')
  const [ascId, setAscId] = useState('')

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
    } catch {
      return false
    }
  }

  useEffect(() => {
    ;(async () => {
      try {
        const { data } = await regiaoApi.privateRegioesGet(authHeader, 1, 200, 'name', 'asc')
        if (isUnauthorizedBody(data)) {
          logout('Sessão expirada. Inicie sessão novamente.')
          return
        }
        setRegioes((data as any).items ?? [])
      } catch {
        setRegioes([])
      }
    })()
  }, [regiaoApi, authHeader, logout])

  useEffect(() => {
    ;(async () => {
      try {
        const { data } = await ascApi.privateAscsGet(authHeader, 1, 200, 'name', 'asc', undefined, regiaoId || undefined)
        if (isUnauthorizedBody(data)) {
          logout('Sessão expirada. Inicie sessão novamente.')
          return
        }
        setAscs((data as any).items ?? [])
      } catch {
        setAscs([])
      }
    })()
  }, [ascApi, authHeader, logout, regiaoId])

  async function runMonthly() {
    setExecMsg(null)
    setExecuting(true)
    try {
      const auth = await getAuthorizationHeaderValueAsync()
      const resp = await fetch(`${basePath}/private/reports/execute`, {
        method: 'POST',
        headers: { Authorization: auth },
      })
      if (resp.status === 401) {
        logout('Sessão expirada. Inicie sessão novamente.')
        return
      }
      setExecMsg('Relatório mensal executado com sucesso.')
    } catch (err: any) {
      const status = err?.response?.status
      setExecMsg(!status ? 'Sem ligação ao servidor.' : status >= 500 ? 'Erro do servidor ao executar.' : 'Falha ao executar relatório.')
    } finally {
      setExecuting(false)
    }
  }

  function toRfc3339(d?: string | null): string | undefined {
    if (!d) return undefined
    try {
      return new Date(`${d}T00:00:00Z`).toISOString()
    } catch {
      return undefined
    }
  }

  function toRfc3339End(d?: string | null): string | undefined {
    if (!d) return undefined
    try {
      return new Date(`${d}T23:59:59Z`).toISOString()
    } catch {
      return undefined
    }
  }

  async function exportCsv() {
    setDownloadMsg(null)
    setDownloading(true)
    try {
      const auth = await getAuthorizationHeaderValueAsync()
      const qs = new URLSearchParams()
      if (dateStart) qs.set('date_start', String(toRfc3339(dateStart)))
      if (dateEnd) qs.set('date_end', String(toRfc3339End(dateEnd)))
      if (regiaoId) qs.set('regiao_id', regiaoId)
      if (ascId) qs.set('asc_id', ascId)
      const urlReq = `${basePath}/private/reports/export?entity=${encodeURIComponent(entity)}${qs.toString() ? `&${qs.toString()}` : ''}`
      const resp = await fetch(urlReq, { headers: { Authorization: auth } })
      if (resp.status === 401) {
        logout('Sessão expirada. Inicie sessão novamente.')
        return
      }
      const blob = await resp.blob()
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
    } finally {
      setDownloading(false)
    }
  }

  function clearFilters() {
    setEntity('occurrences')
    setDateStart(null)
    setDateEnd(null)
    setRegiaoId('')
    setAscId('')
    setDownloadMsg(null)
  }

  const selectedEntity = ENTITY_OPTIONS.find((option) => option.value === entity)
  const activeFilterCount = [entity !== 'occurrences' ? entity : '', dateStart, dateEnd, regiaoId, ascId].filter(Boolean).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={screenHeroStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={screenEyebrowStyle}>Relatórios</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <h2 style={{ margin: 0, fontSize: 30, lineHeight: 1.05, color: '#1f2937' }}>Centro de relatórios</h2>
            <p style={{ margin: 0, color: '#5f6673', lineHeight: 1.6 }}>
              Execute rotinas periódicas e exporte ficheiros CSV com filtros institucionais consistentes.
            </p>
          </div>
        </div>
        <div style={screenActionRowStyle}>
          <span style={heroBadgeStyle}>Exportação manual</span>
          <span style={heroBadgeStyle}>Relatório mensal assistido</span>
        </div>
      </div>

      <Card title="Contexto" subtitle="Resumo rápido do estado atual da área de relatórios.">
        <div style={contextGridStyle}>
          <div style={statCardStyle}>
            <span style={statLabelStyle}>Entidade selecionada</span>
            <strong style={statValueStyle}>{selectedEntity?.label || '—'}</strong>
            <span style={statDescriptionStyle}>{selectedEntity?.description || 'Sem descrição disponível.'}</span>
          </div>
          <div style={statCardStyle}>
            <span style={statLabelStyle}>Filtros ativos</span>
            <strong style={statValueStyle}>{activeFilterCount}</strong>
            <span style={statDescriptionStyle}>{activeFilterCount ? 'A exportação vai respeitar o contexto definido.' : 'Sem filtros adicionais aplicados.'}</span>
          </div>
          <div style={statCardStyle}>
            <span style={statLabelStyle}>Periodicidade mensal</span>
            <strong style={statValueStyle}>Dia 10</strong>
            <span style={statDescriptionStyle}>O relatório mensal continua automatizado, mas também pode ser executado manualmente.</span>
          </div>
        </div>
      </Card>

      <div style={reportsGridStyle}>
        <Card title="Relatório mensal" subtitle="Executa manualmente o envio do relatório institucional." style={featureCardStyle}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={calloutStyle}>
              <span style={calloutEyebrowStyle}>Automação</span>
              <strong style={{ color: '#1f2937', fontSize: 18 }}>Vandalizações mensais</strong>
              <p style={{ margin: 0, color: '#5f6673', lineHeight: 1.6 }}>
                Use esta ação apenas quando precisar de antecipar ou repetir o processamento do relatório mensal.
              </p>
            </div>

            <div style={warningBannerStyle}>
              Atenção: este relatório é enviado automaticamente todos os dias 10.
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <button type="button" onClick={runMonthly} disabled={executing} style={primaryActionButtonStyle}>
                {executing ? 'A executar…' : 'Executar relatório mensal'}
              </button>
              <span style={mutedMetaStyle}>Processo manual com autenticação da sessão atual.</span>
            </div>

            {execMsg ? (
              <div style={neutralFeedbackStyle}>
                {execMsg}
              </div>
            ) : null}
          </div>
        </Card>

        <Card title="Exportar CSV" subtitle="Defina a entidade e o recorte temporal antes de descarregar o ficheiro.">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={filtersHeaderRowStyle}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={summaryChipStyle}>Entidade: {selectedEntity?.label || '—'}</span>
                {dateStart || dateEnd ? <span style={summaryChipStyle}>Período filtrado</span> : null}
                {regiaoId ? <span style={summaryChipStyle}>Região filtrada</span> : null}
                {ascId ? <span style={summaryChipStyle}>ASC filtrada</span> : null}
              </div>
              <button type="button" onClick={clearFilters} style={secondaryActionButtonStyle}>
                Limpar filtros
              </button>
            </div>

            <div style={filtersGridStyle}>
              <label style={fieldGroupStyle}>
                <span style={fieldLabelStyle}>Entidade</span>
                <select value={entity} onChange={(e) => setEntity(e.target.value as ReportEntity)} style={fieldControlStyle}>
                  {ENTITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>

              <label style={fieldGroupStyle}>
                <span style={fieldLabelStyle}>Início</span>
                <input type="date" value={dateStart ?? ''} onChange={(e) => setDateStart(e.target.value || null)} style={fieldControlStyle} />
              </label>

              <label style={fieldGroupStyle}>
                <span style={fieldLabelStyle}>Fim</span>
                <input type="date" value={dateEnd ?? ''} onChange={(e) => setDateEnd(e.target.value || null)} style={fieldControlStyle} />
              </label>

              <label style={fieldGroupStyle}>
                <span style={fieldLabelStyle}>Região</span>
                <select value={regiaoId} onChange={(e) => { setRegiaoId(e.target.value); setAscId('') }} style={fieldControlStyle}>
                  <option value="">Todas</option>
                  {regioes.map((regiao) => (
                    <option key={regiao.id} value={regiao.id}>{regiao.name || regiao.id}</option>
                  ))}
                </select>
              </label>

              <label style={fieldGroupStyle}>
                <span style={fieldLabelStyle}>ASC</span>
                <select value={ascId} onChange={(e) => setAscId(e.target.value)} style={fieldControlStyle}>
                  <option value="">Todas</option>
                  {ascs.map((asc) => (
                    <option key={asc.id} value={asc.id}>{asc.name || asc.id}</option>
                  ))}
                </select>
              </label>
            </div>

            <div style={exportPanelStyle}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <strong style={{ color: '#1f2937', fontSize: 16 }}>Preparar exportação</strong>
                <span style={{ color: '#5f6673', lineHeight: 1.6 }}>
                  O ficheiro será descarregado em CSV com base nos filtros atuais.
                </span>
              </div>
              <button type="button" onClick={exportCsv} disabled={downloading} style={primaryActionButtonStyle}>
                {downloading ? 'A preparar…' : 'Exportar CSV'}
              </button>
            </div>

            {downloadMsg ? (
              <div style={neutralFeedbackStyle}>
                {downloadMsg}
              </div>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
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
  gap: 8,
  flexWrap: 'wrap',
  justifyContent: 'flex-end',
}

const heroBadgeStyle: React.CSSProperties = {
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

const contextGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 14,
}

const statCardStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  padding: '16px 18px',
  borderRadius: 20,
  background: 'linear-gradient(180deg, #fffaf2 0%, #f8efe2 100%)',
  border: '1px solid rgba(101, 74, 32, 0.12)',
}

const statLabelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: '.10em',
  textTransform: 'uppercase',
  color: '#7b8494',
}

const statValueStyle: React.CSSProperties = {
  color: '#1f2937',
  fontSize: 22,
  fontWeight: 800,
}

const statDescriptionStyle: React.CSSProperties = {
  color: '#5f6673',
  lineHeight: 1.55,
  fontSize: 14,
}

const reportsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(320px, 0.9fr) minmax(420px, 1.1fr)',
  gap: 16,
  alignItems: 'stretch',
}

const featureCardStyle: React.CSSProperties = {
  height: '100%',
}

const calloutStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  padding: '18px 20px',
  borderRadius: 22,
  border: '1px solid rgba(101, 74, 32, 0.10)',
  background: 'linear-gradient(135deg, rgba(255, 252, 247, 0.98) 0%, rgba(246, 237, 222, 0.9) 100%)',
}

const calloutEyebrowStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: '.10em',
  textTransform: 'uppercase',
  color: '#8d4a17',
}

const warningBannerStyle: React.CSSProperties = {
  padding: '14px 16px',
  borderRadius: 18,
  background: 'rgba(255, 244, 230, 0.94)',
  border: '1px solid rgba(201, 109, 31, 0.22)',
  color: '#8d4a17',
  fontWeight: 700,
  lineHeight: 1.55,
}

const neutralFeedbackStyle: React.CSSProperties = {
  padding: '14px 16px',
  borderRadius: 18,
  background: 'rgba(255, 252, 246, 0.92)',
  border: '1px solid rgba(101, 74, 32, 0.12)',
  color: '#5f6673',
  fontWeight: 700,
}

const mutedMetaStyle: React.CSSProperties = {
  color: '#7b8494',
  fontSize: 13,
  fontWeight: 600,
}

const filtersHeaderRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 12,
  flexWrap: 'wrap',
  justifyContent: 'space-between',
  alignItems: 'center',
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

const exportPanelStyle: React.CSSProperties = {
  display: 'flex',
  gap: 12,
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '18px 20px',
  borderRadius: 22,
  border: '1px solid rgba(101, 74, 32, 0.12)',
  background: '#fffdf8',
}

const primaryActionButtonStyle: React.CSSProperties = {
  minHeight: 44,
  padding: '0 18px',
  borderRadius: 16,
  border: '1px solid rgba(201, 109, 31, 0.20)',
  background: 'linear-gradient(180deg, #d77a28 0%, #b85d18 100%)',
  color: '#fffaf5',
  fontWeight: 800,
  boxShadow: '0 12px 24px rgba(201, 109, 31, 0.18)',
  cursor: 'pointer',
}

const secondaryActionButtonStyle: React.CSSProperties = {
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
