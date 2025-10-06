import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Card, Heading, Text } from '../components'
import { useAuth } from '../contexts/AuthContext'
import { AccoesApi, ASCApi, MaterialApi, type ModelAccoes, type ModelASC, type ModelMaterial } from '../services'

export default function AccaoDetailScreen() {
  const { getApiConfig, getAuthorizationHeaderValue, logout } = useAuth()
  const api = useMemo(() => new AccoesApi(getApiConfig()), [getApiConfig])
  const ascApi = useMemo(() => new ASCApi(getApiConfig()), [getApiConfig])
  const materialApi = useMemo(() => new MaterialApi(getApiConfig()), [getApiConfig])
  const authHeader = useMemo(() => getAuthorizationHeaderValue(), [getAuthorizationHeaderValue])
  const id = useMemo(() => window.location.pathname.split('/').filter(Boolean)[1] || '', [])

  const [accao, setAccao] = useState<ModelAccoes | null>(null)
  const [ascs, setAscs] = useState<ModelASC[]>([])
  const [materials, setMaterials] = useState<ModelMaterial[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [beforeCount, setBeforeCount] = useState<number | null>(null)
  const [afterCount, setAfterCount] = useState<number | null>(null)
  const [beforeAmount, setBeforeAmount] = useState<number | null>(null)
  const [afterAmount, setAfterAmount] = useState<number | null>(null)

  const isUnauthorizedBody = (data: any) => { try { const raw = data?.code ?? data?.error?.code ?? data?.status ?? data?.error?.status ?? data?.error_code; if (raw == null) return false; const num = Number(raw); if (!Number.isNaN(num) && num === 401) return true; const code = String(raw).toUpperCase(); return code === 'UNAUTHORIZED' || code === 'UNAUTHENTICATED' } catch { return false } }

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [{ data: d1 }, { data: d2 }, { data: d3 }] = await Promise.all([
        api.privateAccoesIdGet(id, authHeader),
        ascApi.privateAscsGet(authHeader, -1, undefined, 'name', 'asc'),
        materialApi.privateMateriaisGet(authHeader, -1, undefined, 'name', 'asc')
      ])
      if ([d1, d2, d3].some((x) => isUnauthorizedBody(x))) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      const payload: any = d1 as any
      const acc = (payload && payload.accoes) ? payload.accoes as ModelAccoes : (payload as ModelAccoes)
      setAccao(acc)
      if (typeof payload?.before_count === 'number') setBeforeCount(payload.before_count)
      if (typeof payload?.after_count === 'number') setAfterCount(payload.after_count)
      if (typeof payload?.before_amount === 'number') setBeforeAmount(payload.before_amount)
      if (typeof payload?.after_amount === 'number') setAfterAmount(payload.after_amount)
      setAscs((d2 as any).items ?? [])
      setMaterials((d3 as any).items ?? [])
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 401 || isUnauthorizedBody(err?.response?.data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      setError(!status ? 'Sem ligação ao servidor.' : 'Falha a obter ação.')
    } finally { setLoading(false) }
  }, [api, authHeader, id])

  useEffect(() => { load() }, [load])

  function voltar() { window.history.pushState({}, '', '/accoes'); window.dispatchEvent(new Event('locationchange')) }
  function editar() { window.history.pushState({}, '', `/accoes/${id}/editar`); window.dispatchEvent(new Event('locationchange')) }

  const resolveAsc = (id?: string) => { const it = ascs.find((a) => a.id === id); return it?.name || id || '-' }
  const formatMoney = (n?: number) => (typeof n === 'number' && !Number.isNaN(n)) ? `${n.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT` : '—'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Heading level={2}>Detalhes da ação</Heading>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" onClick={voltar}>Voltar</Button>
          <Button onClick={editar}>Editar</Button>
        </div>
      </div>
      {loading && <div style={{ color: '#6b7280' }}>A carregar…</div>}
      {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: 10, borderRadius: 8 }}>{error}</div>}
      {!loading && !error && accao && (
        <Card title="Dados da ação">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            <Field label="Criado em" value={formatDate(accao.created_at)} />
            <Field label="Implementação" value={formatDate(accao.data_implementacao)} />
            <Field label="ASC" value={resolveAsc(accao.asc_id)} />
            <Field label="Valor" value={formatMoney(accao.amount)} />
            <Field label="Meses análise" value={accao.meses_analise != null ? String(accao.meses_analise) : '-'} />
          </div>
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, color: '#6b7280' }}>Ação</div>
            <div style={{ whiteSpace: 'pre-wrap' }}>{accao.accoes || '-'}</div>
          </div>
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, color: '#6b7280' }}>Materiais</div>
            {Array.isArray((accao as any).materiais) && (accao as any).materiais.length ? (
              <ul style={{ margin: '6px 0 0 18px', padding: 0 }}>
                {((accao as any).materiais as any[]).map((m, i) => (
                  <li key={i} style={{ listStyle: 'disc' }}>{m.name || m.id}</li>
                ))}
              </ul>
            ) : (
              <div>—</div>
            )}
          </div>
          {(() => {
            const meses = accao?.meses_analise ?? null
            const bC = typeof beforeCount === 'number' ? beforeCount : null
            const aC = typeof afterCount === 'number' ? afterCount : null
            const bA = typeof beforeAmount === 'number' ? beforeAmount : null
            const aA = typeof afterAmount === 'number' ? afterAmount : null
            const deltaCount = (bC != null && aC != null) ? (aC - bC) : null
            const deltaAmount = (bA != null && aA != null) ? (aA - bA) : null
            const pctCount = (bC != null && bC !== 0 && deltaCount != null) ? (deltaCount / bC) * 100 : null
            const pctAmount = (bA != null && bA !== 0 && deltaAmount != null) ? (deltaAmount / bA) * 100 : null
            const isBetterCount = (bC != null && aC != null) ? aC < bC : null
            const isBetterAmount = (bA != null && aA != null) ? aA < bA : null
            const badge = (ok?: boolean | null) => ({
              background: ok === null ? '#f3f4f6' : (ok ? '#ecfdf5' : '#fef2f2'),
              border: `1px solid ${ok === null ? '#e5e7eb' : (ok ? '#bbf7d0' : '#fecaca')}`,
              color: ok === null ? '#374151' : (ok ? '#065f46' : '#991b1b'),
            })
            return (
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>Impacto</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
                  <div style={{ padding: 12, borderRadius: 10, border: '1px solid #e5e7eb', background: '#f9fafb' }}>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>Nos {meses ?? '—'} meses antes</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                      <div>
                        <div style={{ fontSize: 12, color: '#6b7280' }}>Quantidade</div>
                        <div style={{ fontWeight: 700 }}>{bC != null ? String(bC) : '—'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 12, color: '#6b7280' }}>Montante</div>
                        <div style={{ fontWeight: 700 }}>{bA != null ? formatMoney(bA) : '—'}</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: 12, borderRadius: 10, ...badge(isBetterCount) }}>
                    <div style={{ fontSize: 12, opacity: 0.9 }}>Nos {meses ?? '—'} meses depois</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                      <div>
                        <div style={{ fontSize: 12, opacity: 0.8 }}>Quantidade</div>
                        <div style={{ fontWeight: 800, fontSize: 18 }}>{aC != null ? String(aC) : '—'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 12, opacity: 0.8 }}>Montante</div>
                        <div style={{ fontWeight: 800, fontSize: 18 }}>{aA != null ? formatMoney(aA) : '—'}</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, marginTop: 12 }}>
                  <div style={{ padding: 12, borderRadius: 10, ...badge(isBetterCount) }}>
                    <div style={{ fontSize: 12, opacity: 0.8 }}>Variação — Quantidade</div>
                    <div style={{ marginTop: 6, display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      <div style={{ fontWeight: 700 }}>{bC != null ? String(bC) : '—'}</div>
                      <span>→</span>
                      <div style={{ fontWeight: 800, fontSize: 18 }}>{aC != null ? String(aC) : '—'}</div>
                      <div style={{ marginLeft: 'auto', fontWeight: 700 }}>{pctCount != null ? `${pctCount.toFixed(1)}%` : '—'}</div>
                    </div>
                  </div>
                  <div style={{ padding: 12, borderRadius: 10, ...badge(isBetterAmount) }}>
                    <div style={{ fontSize: 12, opacity: 0.8 }}>Variação — Montante</div>
                    <div style={{ marginTop: 6, display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      <div style={{ fontWeight: 700 }}>{bA != null ? formatMoney(bA) : '—'}</div>
                      <span>→</span>
                      <div style={{ fontWeight: 800, fontSize: 18 }}>{aA != null ? formatMoney(aA) : '—'}</div>
                      <div style={{ marginLeft: 'auto', fontWeight: 700 }}>{pctAmount != null ? `${pctAmount.toFixed(1)}%` : '—'}</div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })()}
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

function formatDate(iso?: string) { if (!iso) return '-'; try { const d = new Date(iso as any); if (Number.isNaN(d.getTime())) return '-'; return d.toLocaleDateString('pt-PT') } catch { return '-' } }
