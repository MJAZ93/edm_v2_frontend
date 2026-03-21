import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Card, Button, Heading, SearchSelect } from '../components'
import { MapPicker } from '../components/ui/MapPicker'
import { useAuth } from '../contexts/AuthContext'
import {
  OccurrenceApi,
  RegiaoApi,
  ASCApi,
  ProvinceApi,
  DirecaoTransportesApi,
  FormaConhecimentoApi,
  SectorInfracaoApi,
  TipoInfracaoApi,
  MaterialApi,
  type OccurrenceCreateOccurrenceRequest,
  type OccurrenceCreateOccurrenceInfraction,
  type OccurrenceCreateOccurrenceInfractor,
  type ModelRegiao,
  type ModelASC,
  type ModelProvince,
  type ModelDirecaoTransportes,
  type ModelFormaConhecimento,
  type ModelSectorInfracao,
  type ModelTipoInfracao,
  type ModelMaterial
} from '../services'

export default function OcorrenciaCreateScreen() {
  const { getApiConfig, getAuthorizationHeaderValueAsync, refreshTokenIfNeeded, logout } = useAuth()
  const api = useMemo(() => new OccurrenceApi(getApiConfig()), [getApiConfig])
  const regiaoApi = useMemo(() => new RegiaoApi(getApiConfig()), [getApiConfig])
  const ascApi = useMemo(() => new ASCApi(getApiConfig()), [getApiConfig])
  const formaApi = useMemo(() => new FormaConhecimentoApi(getApiConfig()), [getApiConfig])
  const sectorApi = useMemo(() => new SectorInfracaoApi(getApiConfig()), [getApiConfig])
  const tipoApi = useMemo(() => new TipoInfracaoApi(getApiConfig()), [getApiConfig])
  const materialApi = useMemo(() => new MaterialApi(getApiConfig()), [getApiConfig])
  const provinceApi = useMemo(() => new ProvinceApi(getApiConfig()), [getApiConfig])
  const direcaoApi = useMemo(() => new DirecaoTransportesApi(getApiConfig()), [getApiConfig])

  const [local, setLocal] = useState('')
  const [descricao, setDescricao] = useState('')
  const [condicoesFavoreceram, setCondicoesFavoreceram] = useState('')
  const [dataFacto, setDataFacto] = useState<string>('')
  const [regiaoId, setRegiaoId] = useState('')
  const [ascId, setAscId] = useState('')
  const [transportes, setTransportes] = useState(false)
  const [provinceId, setProvinceId] = useState('')
  const [direcaoId, setDirecaoId] = useState('')
  const [formaId, setFormaId] = useState('')
  const [lat, setLat] = useState('')
  const [long, setLong] = useState('')
  const [procCriminal, setProcCriminal] = useState(false)
  const [autoTexto, setAutoTexto] = useState('')
  const [autoImagem, setAutoImagem] = useState<string>('')

  const [infractions, setInfractions] = useState<OccurrenceCreateOccurrenceInfraction[]>([{}])
  const [infractors, setInfractors] = useState<OccurrenceCreateOccurrenceInfractor[]>([])

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const [regioes, setRegioes] = useState<ModelRegiao[]>([])
  const [ascs, setAscs] = useState<ModelASC[]>([])
  const [formas, setFormas] = useState<ModelFormaConhecimento[]>([])
  const [setores, setSetores] = useState<ModelSectorInfracao[]>([])
  const [tiposInf, setTiposInf] = useState<ModelTipoInfracao[]>([])
  const [provincias, setProvincias] = useState<ModelProvince[]>([])
  const [direcoes, setDirecoes] = useState<ModelDirecaoTransportes[]>([])
  const [materialsBySector, setMaterialsBySector] = useState<Record<string, { id: string; label: string }[]>>({})
  const [loadingMaterialsSector, setLoadingMaterialsSector] = useState<Record<string, boolean>>({})
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)

  // const apiBase = (import.meta as any).env?.VITE_API_BASE_URL || '/api'

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

  useEffect(() => { (async () => {
    try {
      await refreshTokenIfNeeded()
      const auth = await getAuthorizationHeaderValueAsync()
      const { data } = await regiaoApi.privateRegioesGet(auth, 1, 200, 'name', 'asc')
      if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      setRegioes(data.items ?? [])
    } catch {}
  })() }, [regiaoApi, getAuthorizationHeaderValueAsync, refreshTokenIfNeeded])

  useEffect(() => { (async () => {
    try {
      await refreshTokenIfNeeded()
      const auth = await getAuthorizationHeaderValueAsync()
      const { data } = await provinceApi.privateProvincesGet(auth, 1, 200, 'name', 'asc')
      if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      setProvincias(data.items ?? [])
    } catch {}
  })() }, [provinceApi, getAuthorizationHeaderValueAsync, refreshTokenIfNeeded])

  useEffect(() => { (async () => {
    try {
      await refreshTokenIfNeeded()
      const auth = await getAuthorizationHeaderValueAsync()
      const { data } = await ascApi.privateAscsGet(auth, 1, 200, 'name', 'asc', undefined, regiaoId || undefined)
      if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      setAscs(data.items ?? [])
    } catch {}
  })() }, [ascApi, getAuthorizationHeaderValueAsync, refreshTokenIfNeeded, regiaoId])

  useEffect(() => { (async () => {
    try {
      await refreshTokenIfNeeded()
      const auth = await getAuthorizationHeaderValueAsync()
      const { data } = await formaApi.privateFormaConhecimentosGet(auth, 1, 200, 'name', 'asc')
      if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      setFormas(data.items ?? [])
    } catch {}
  })() }, [formaApi, getAuthorizationHeaderValueAsync, refreshTokenIfNeeded])

  useEffect(() => { (async () => {
    try {
      await refreshTokenIfNeeded()
      const auth = await getAuthorizationHeaderValueAsync()
      const { data } = await direcaoApi.privateDirecaoTransportesGet(auth, 1, 200, 'name', 'asc')
      if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      setDirecoes(data.items ?? [])
    } catch {}
  })() }, [direcaoApi, getAuthorizationHeaderValueAsync, refreshTokenIfNeeded])

  useEffect(() => { (async () => {
    try {
      await refreshTokenIfNeeded()
      const auth = await getAuthorizationHeaderValueAsync()
      const { data } = await sectorApi.privateSectorInfracaoGet(auth, 1, 200, 'name', 'asc')
      if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      setSetores(data.items ?? [])
    } catch {}
  })() }, [sectorApi, getAuthorizationHeaderValueAsync, refreshTokenIfNeeded])

  useEffect(() => { (async () => {
    try {
      await refreshTokenIfNeeded()
      const auth = await getAuthorizationHeaderValueAsync()
      const { data } = await tipoApi.privateTiposInfracaoGet(auth, 1, 200, 'name', 'asc')
      if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      setTiposInf(data.items ?? [])
    } catch {}
  })() }, [tipoApi, getAuthorizationHeaderValueAsync, refreshTokenIfNeeded])

  // Atribui por omissão a localização da ocorrência às infrações que ainda não têm lat/long definidos
  useEffect(() => {
    const occLat = lat !== '' && !Number.isNaN(Number(lat)) ? Number(lat) : undefined
    const occLong = long !== '' && !Number.isNaN(Number(long)) ? Number(long) : undefined
    if (occLat === undefined || occLong === undefined) return
    setInfractions((arr) => arr.map((it) => (it.lat == null && it.long == null ? { ...it, lat: occLat as any, long: occLong as any } : it)))
  }, [lat, long])

  function updateInf(index: number, partial: Partial<OccurrenceCreateOccurrenceInfraction>) {
    setInfractions((arr) => arr.map((it, i) => (i === index ? { ...it, ...partial } : it)))
  }
  function addInf() {
    const occLat = lat !== '' && !Number.isNaN(Number(lat)) ? Number(lat) : undefined
    const occLong = long !== '' && !Number.isNaN(Number(long)) ? Number(long) : undefined
    setInfractions((arr) => [...arr, { lat: occLat as any, long: occLong as any }])
  }
  function removeInf(index: number) { setInfractions((arr) => arr.filter((_, i) => i !== index)) }
  async function handleFiles(index: number, files: FileList | null) {
    if (!files || files.length === 0) return
    const toDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(file)
    })
    const urls: string[] = []
    for (let i = 0; i < files.length; i++) {
      try { urls.push(await toDataUrl(files[i])) } catch {}
    }
    if (urls.length) {
      setInfractions((arr) => arr.map((it, i) => i === index ? ({ ...it, fotografias: [ ...(it.fotografias ?? []), ...urls ] }) : it))
    }
  }
  function removePhoto(index: number, pIndex: number) { setInfractions((arr) => arr.map((it, i) => i === index ? ({ ...it, fotografias: (it.fotografias ?? []).filter((_, k) => k !== pIndex) }) : it)) }

  function updateInfractor(index: number, partial: Partial<OccurrenceCreateOccurrenceInfractor>) {
    setInfractors((arr) => arr.map((it, i) => (i === index ? { ...it, ...partial } : it)))
  }
  function addInfractor() { setInfractors((arr) => [...arr, {}]) }
  function removeInfractor(index: number) { setInfractors((arr) => arr.filter((_, i) => i !== index)) }

  async function submit() {
    setSubmitting(true); setSubmitError(null)
    try {
      // limpar/validar infrações: manter apenas as que têm dados
      const cleanedInfractions = infractions.map((inf) => ({
        sector_infracao_id: inf.sector_infracao_id || undefined,
        tipo_infracao_id: inf.tipo_infracao_id || undefined,
        ...(inf as any).material_id ? { material_id: (inf as any).material_id } : {},
        quantidade: (inf.quantidade != null && !Number.isNaN(Number(inf.quantidade)) && Number(inf.quantidade) >= 1) ? Number(inf.quantidade) : undefined,
        valor: inf.valor != null && !Number.isNaN(Number(inf.valor)) ? Number(inf.valor) : undefined,
        lat: inf.lat != null && !Number.isNaN(Number(inf.lat)) ? Number(inf.lat) : undefined,
        long: inf.long != null && !Number.isNaN(Number(inf.long)) ? Number(inf.long) : undefined,
        fotografias: (inf.fotografias ?? [])
          .map((img) => (img.startsWith('data:') ? (img.split(',')[1] || '') : img))
          .filter((s) => s && s.length > 0),
        infractors: infractors.map((x) => ({
          nome: x.nome || undefined,
          nr_identificacao: x.nr_identificacao || undefined,
          tipo_identificacao: x.tipo_identificacao || undefined
        }))
      })).filter((inf: any) => (
        inf.sector_infracao_id || inf.tipo_infracao_id || inf.material_id ||
        (inf.quantidade != null && inf.quantidade >= 1) || inf.valor != null || inf.lat != null || inf.long != null ||
        (Array.isArray(inf.fotografias) && inf.fotografias.length > 0) ||
        (Array.isArray(inf.infractors) && inf.infractors.length > 0)
      ))
      if (cleanedInfractions.length < 1) { setSubmitError('Adicione pelo menos uma infração com dados (ex.: setor, tipo, material, quantidade ou valor).'); setSubmitting(false); return }
      const payload: OccurrenceCreateOccurrenceRequest = {
        local: local || undefined,
        descricao: descricao || undefined,
        // Quando "Transportes" está ativo, usamos província + direção; caso contrário, região + ASC
        regiao_id: transportes ? undefined : (regiaoId || undefined),
        asc_id: transportes ? undefined : (ascId || undefined),
        province_id: transportes ? (provinceId || undefined) : undefined,
        direcao_transportes_id: transportes ? (direcaoId || undefined) : undefined,
        forma_conhecimento_id: formaId || undefined,
        lat: lat ? Number(lat) : undefined,
        long: long ? Number(long) : undefined,
        infractions: cleanedInfractions as any
      }
      const extra: any = {}
      extra.processo_criminal_aberto = !!procCriminal
      if (procCriminal) {
        if (autoTexto) extra.auto = autoTexto
        if (autoImagem) extra.auto_image = autoImagem.startsWith('data:') ? (autoImagem.split(',')[1] || '') : autoImagem
      }
      const toRfc3339 = (d?: string | null) => {
        if (!d) return undefined
        try { return new Date(`${d}T00:00:00Z`).toISOString() } catch { return undefined }
      }
      const body: any = { ...payload, ...extra, data_facto: toRfc3339(dataFacto), condicoes_favoreceram: condicoesFavoreceram || undefined }
      await refreshTokenIfNeeded()
      const auth = await getAuthorizationHeaderValueAsync()
      const { data } = await api.privateOccurrencesPost(auth, body)
      if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      // voltar à lista
      const nextSearch = appendCreatedParam(window.location.search)
      if (window.location.pathname !== '/ocorrencias') window.history.pushState({}, '', `/ocorrencias${nextSearch}`)
      window.dispatchEvent(new Event('popstate'))
      window.dispatchEvent(new Event('locationchange'))
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 401 || isUnauthorizedBody(err?.response?.data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      setSubmitError(status === 400 ? 'Dados inválidos.' : !status ? 'Sem ligação ao servidor.' : 'Falha ao criar ocorrência.')
    } finally { setSubmitting(false) }
  }

  function cancelar() {
    if (window.location.pathname !== '/ocorrencias') window.history.pushState({}, '', `/ocorrencias${window.location.search}`)
    window.dispatchEvent(new Event('popstate'))
    window.dispatchEvent(new Event('locationchange'))
  }
  
  const ensureMaterials = useCallback(async (sectorId?: string) => {
    const sid = sectorId || ''
    if (!sid) return
    if (materialsBySector[sid]) return
    setLoadingMaterialsSector((s) => ({ ...s, [sid]: true }))
    try {
      await refreshTokenIfNeeded()
      const auth = await getAuthorizationHeaderValueAsync()
      const { data } = await materialApi.privateMateriaisGet(auth, 1, 500, 'name', 'asc', undefined, sid)
      const items = (data.items ?? []) as ModelMaterial[]
      const opts = items
        .filter((m) => m.id && (m.name || m.id))
        .map((m) => ({ id: String(m.id), label: String(m.name || m.id) }))
      setMaterialsBySector((m) => ({ ...m, [sid]: opts }))
    } catch {
      setMaterialsBySector((m) => ({ ...m, [sid]: [] }))
    } finally {
      setLoadingMaterialsSector((s) => ({ ...s, [sid]: false }))
    }
  }, [materialsBySector, materialApi, getAuthorizationHeaderValueAsync, refreshTokenIfNeeded])

  const contextModeLabel = transportes ? 'Transportes' : 'Território'
  const contextDetailLabel = transportes
    ? (direcoes.find((d) => d.id === direcaoId)?.name || provincias.find((p) => p.id === provinceId)?.name || 'Por definir')
    : (ascs.find((a) => a.id === ascId)?.name || regioes.find((r) => r.id === regiaoId)?.name || 'Por definir')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={createHeroStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={createEyebrowStyle}>Ocorrências</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Heading level={2}>Nova ocorrência</Heading>
            <p style={{ margin: 0, color: '#5f6673', lineHeight: 1.6, maxWidth: 760 }}>
              Registe a ocorrência com contexto territorial, localização, processo criminal e infrações associadas. A estrutura foi organizada para acelerar o preenchimento e reduzir passos soltos.
            </p>
          </div>
        </div>
        <div style={createHeroActionsStyle}>
          <Button variant="secondary" onClick={cancelar}>
            <IconClose />
            <span>Cancelar</span>
          </Button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <span style={createSummaryChipStyle}>Modo: {contextModeLabel}</span>
        <span style={createSummaryChipStyle}>Contexto: {contextDetailLabel}</span>
        <span style={createSummaryChipStyle}>Infrações: {infractions.length}</span>
        <span style={createSummaryChipStyle}>Infractores: {infractors.length}</span>
      </div>

      {submitError ? <div style={createErrorBannerStyle}>{submitError}</div> : null}

      <Card subtitle="Preencha o contexto, a geografia e a localização antes de descer para as infrações.">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={createSectionCardStyle}>
            <SectionHeading icon={<IconInfo />} title="Contexto base" subtitle="Defina o registo principal, a data do facto e a descrição operacional." />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 260, gridColumn: 'span 2' }}>
                <span style={createFieldLabelStyle}>Local</span>
                <input value={local} onChange={(e) => setLocal(e.target.value)} placeholder="Ex.: Rua X, Bairro Y" style={createInputStyle} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 220 }}>
                <span style={createFieldLabelStyle}>Data da ocorrência</span>
                <div style={createInputWithIconStyle}>
                  <span style={createInputIconStyle}><IconCalendar /></span>
                  <input type="date" value={dataFacto} onChange={(e) => setDataFacto(e.target.value)} style={createDateInputStyle} />
                </div>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 220 }}>
                <span style={createFieldLabelStyle}>Forma de conhecimento</span>
                <select value={formaId} onChange={(e) => setFormaId(e.target.value)} style={createInputStyle}>
                  <option value="">Selecionar</option>
                  {formas.map((f) => <option key={f.id} value={f.id}>{f.name || f.id}</option>)}
                </select>
              </label>
            </div>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={createFieldLabelStyle}>Factores que contribuíram</span>
              <textarea
                value={condicoesFavoreceram}
                onChange={(e) => setCondicoesFavoreceram(e.target.value)}
                placeholder="Descreva condições ou factores que favoreceram a vandalização"
                rows={3}
                style={createTextareaStyle}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={createFieldLabelStyle}>Descrição</span>
              <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descrição da ocorrência" rows={4} style={createTextareaStyle} />
            </label>
          </div>

          <div style={createSectionCardStyle}>
            <SectionHeading icon={<IconToggle />} title="Classificação e processo" subtitle="Escolha o modo do registo e ative o processo criminal apenas quando aplicável." />
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <TogglePill
                checked={procCriminal}
                label="Processo criminal aberto"
                description="Ative para revelar os dados do auto e o respetivo anexo."
                onChange={(next) => setProcCriminal(next)}
              />
              <TogglePill
                checked={transportes}
                label="Modo transportes"
                description="Troca Região/ASC por Província/Direção de Transporte."
                onChange={(next) => { setTransportes(next); setRegiaoId(''); setAscId(''); setProvinceId(''); setDirecaoId('') }}
              />
            </div>

            {procCriminal && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 220 }}>
                  <span style={createFieldLabelStyle}>Dados do auto</span>
                  <input value={autoTexto} onChange={(e) => setAutoTexto(e.target.value)} placeholder="Número ou descrição do auto" style={createInputStyle} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 260 }}>
                  <span style={createFieldLabelStyle}>Anexo do auto</span>
                  <input type="file" accept="image/*" onChange={async (e) => {
                    const f = e.target.files?.[0]
                    if (!f) { setAutoImagem(''); return }
                    const toDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
                      const reader = new FileReader()
                      reader.onload = () => resolve(String(reader.result))
                      reader.onerror = () => reject(reader.error)
                      reader.readAsDataURL(file)
                    })
                    try { setAutoImagem(await toDataUrl(f)) } catch { setAutoImagem('') }
                  }} />
                  {autoImagem ? (
                    <div style={createPreviewCardStyle}>
                      <img src={autoImagem} alt="Auto" style={{ width: 160, height: 120, objectFit: 'cover', borderRadius: 12, border: '1px solid rgba(101, 74, 32, 0.12)' }} />
                    </div>
                  ) : null}
                </label>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) minmax(320px, 1.1fr)', gap: 16 }}>
            <div style={createSectionCardStyle}>
              <SectionHeading icon={transportes ? <IconRoute /> : <IconMapPin />} title={transportes ? 'Contexto transportes' : 'Contexto territorial'} subtitle="Agrupe aqui os campos geográficos e operacionais do registo." />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                {!transportes ? (
                  <>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <span style={createFieldLabelStyle}>Região</span>
                      <select value={regiaoId} onChange={(e) => { setRegiaoId(e.target.value); setAscId('') }} style={createInputStyle}>
                        <option value="">Selecionar</option>
                        {regioes.map((r) => <option key={r.id} value={r.id}>{r.name || r.id}</option>)}
                      </select>
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <span style={createFieldLabelStyle}>ASC</span>
                      <select value={ascId} onChange={(e) => setAscId(e.target.value)} style={createInputStyle}>
                        <option value="">Selecionar</option>
                        {ascs.map((a) => <option key={a.id} value={a.id}>{a.name || a.id}</option>)}
                      </select>
                    </label>
                  </>
                ) : (
                  <>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <span style={createFieldLabelStyle}>Província</span>
                      <select value={provinceId} onChange={(e) => setProvinceId(e.target.value)} style={createInputStyle}>
                        <option value="">Selecionar</option>
                        {provincias.map((p) => <option key={p.id} value={p.id}>{p.name || p.id}</option>)}
                      </select>
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <span style={createFieldLabelStyle}>Direção de Transporte</span>
                      <select value={direcaoId} onChange={(e) => setDirecaoId(e.target.value)} style={createInputStyle}>
                        <option value="">Selecionar</option>
                        {direcoes.map((d) => <option key={d.id} value={d.id}>{d.name || d.id}</option>)}
                      </select>
                    </label>
                  </>
                )}
              </div>
            </div>

            <div style={createSectionCardStyle}>
              <SectionHeading icon={<IconTarget />} title="Localização" subtitle="Use o mapa para definir coordenadas com mais precisão e reaproveitá-las nas infrações." />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(120px, 1fr))', gap: 14 }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={createFieldLabelStyle}>Latitude</span>
                  <input value={lat} onChange={(e) => setLat(e.target.value)} placeholder="-25.96" inputMode="decimal" style={createInputStyle} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={createFieldLabelStyle}>Longitude</span>
                  <input value={long} onChange={(e) => setLong(e.target.value)} placeholder="32.58" inputMode="decimal" style={createInputStyle} />
                </label>
              </div>
              <MapPicker
                markerKind="occurrence"
                value={{ lat: lat !== '' && !Number.isNaN(Number(lat)) ? Number(lat) : undefined, lng: long !== '' && !Number.isNaN(Number(long)) ? Number(long) : undefined }}
                onChange={(pos) => { setLat(String(pos.lat)); setLong(String(pos.lng)) }}
                height={300}
                zoom={6}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button size="sm" type="button" variant="secondary" onClick={() => {
                  const occLat = lat !== '' && !Number.isNaN(Number(lat)) ? Number(lat) : undefined
                  const occLong = long !== '' && !Number.isNaN(Number(long)) ? Number(long) : undefined
                  setInfractions((arr) => arr.map((it) => ({ ...it, lat: occLat as any, long: occLong as any })))
                }}>
                  Aplicar localização a todas as infrações
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card
        title="Infrações"
        subtitle="Organize as infrações por bloco, com materiais, fotografias e coordenadas próprias."
        extra={<span style={createCardIconBadgeStyle}><IconWarn /></span>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {infractions.map((inf, idx) => (
            <div key={idx} style={createInfractionCardStyle}>
              <div style={createInfractionHeaderStyle}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={createInfractionEyebrowStyle}>Bloco {idx + 1}</span>
                  <strong style={{ color: '#1f2937', fontSize: 18 }}>Infração</strong>
                </div>
                <span style={createInfractionMetaStyle}>
                  {(inf.fotografias ?? []).length} foto(s)
                </span>
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 220 }}>
                  <span style={{ fontSize: 13, color: '#374151' }}>Sector de Infração</span>
                  <select
                    value={inf.sector_infracao_id ?? ''}
                    onChange={(e) => { const id = e.target.value || undefined; updateInf(idx, { sector_infracao_id: id, ...(id ? ({ material_id: undefined } as any) : {}) }); ensureMaterials(id) }}
                    style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db', background: '#fff' }}
                  >
                    <option value="">— Selecionar —</option>
                    {setores.map((s) => <option key={s.id} value={s.id}>{s.name || s.id}</option>)}
                  </select>
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 220 }}>
                  <span style={{ fontSize: 13, color: '#374151' }}>Tipo de Infração</span>
                  <select value={inf.tipo_infracao_id ?? ''} onChange={(e) => updateInf(idx, { tipo_infracao_id: e.target.value || undefined })} style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db', background: '#fff' }}>
                    <option value="">— Selecionar —</option>
                    {tiposInf.map((t) => <option key={t.id} value={t.id}>{t.name || t.id}</option>)}
                  </select>
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 240 }}>
                  <span style={{ fontSize: 13, color: '#374151' }}>Material</span>
                  <SearchSelect
                    options={materialsBySector[inf.sector_infracao_id ?? ''] ?? []}
                    value={(inf as any).material_id || ''}
                    onChange={(id) => updateInf(idx, id ? ({ material_id: id } as any) : ({ material_id: undefined } as any))}
                    placeholder={inf.sector_infracao_id ? (loadingMaterialsSector[inf.sector_infracao_id] ? 'A carregar…' : 'Selecionar material…') : 'Selecione o sector primeiro'}
                    searchPlaceholder="Procurar material…"
                    noResultsText="Sem materiais"
                    disabled={!inf.sector_infracao_id || loadingMaterialsSector[inf.sector_infracao_id]}
                  />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 160 }}>
                  <span style={{ fontSize: 13, color: '#374151' }}>Quantidade</span>
                  <input
                    type="number"
                    min={1}
                    step="any"
                    value={inf.quantidade ?? ''}
                    onChange={(e) => {
                      const val = e.target.value
                      if (val === '') { updateInf(idx, { quantidade: undefined as any }); return }
                      const num = Number(val)
                      if (Number.isNaN(num)) { return }
                      updateInf(idx, { quantidade: (num < 1 ? 1 : num) as any })
                    }}
                    placeholder="1"
                    style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db' }}
                  />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 160 }}>
                  <span style={{ fontSize: 13, color: '#374151' }}>Valor</span>
                  <input value={inf.valor ?? ''} onChange={(e) => updateInf(idx, { valor: e.target.value ? Number(e.target.value) as any : undefined })} inputMode="decimal" placeholder="0" style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db' }} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 160 }}>
                  <span style={{ fontSize: 13, color: '#374151' }}>Latitude</span>
                  <input value={inf.lat ?? ''} onChange={(e) => updateInf(idx, { lat: e.target.value ? Number(e.target.value) as any : undefined })} inputMode="decimal" placeholder="-25.96" style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db' }} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 160 }}>
                  <span style={{ fontSize: 13, color: '#374151' }}>Longitude</span>
                  <input value={inf.long ?? ''} onChange={(e) => updateInf(idx, { long: e.target.value ? Number(e.target.value) as any : undefined })} inputMode="decimal" placeholder="32.58" style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db' }} />
                </label>
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <Button size="sm" type="button" variant="secondary" onClick={() => {
                    const occLat = lat !== '' && !Number.isNaN(Number(lat)) ? Number(lat) : undefined
                    const occLong = long !== '' && !Number.isNaN(Number(long)) ? Number(long) : undefined
                    updateInf(idx, { lat: occLat as any, long: occLong as any })
                  }}>
                    <IconTarget />
                    <span>Usar localização da ocorrência</span>
                  </Button>
                </div>
              </div>

              <div style={{ marginTop: 10 }}>
                <div style={createSubsectionTitleStyle}>
                  <IconCamera />
                  <strong>Fotografias</strong>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                  {(inf.fotografias ?? []).map((img, i) => {
                    const src = img.startsWith('data:') ? img : `data:image/*;base64,${img}`
                    return (
                      <div key={i} style={createMediaChipStyle}>
                        <img src={src} alt="Foto" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 6 }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '0.3' }} />
                        <Button size="sm" variant="danger" onClick={() => removePhoto(idx, i)}>
                          <IconTrash />
                        </Button>
                      </div>
                    )
                  })}
                </div>
                <div
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDraggingIndex(idx) }}
                  onDragLeave={() => setDraggingIndex((cur) => (cur === idx ? null : cur))}
                  onDrop={(e) => { e.preventDefault(); e.stopPropagation(); handleFiles(idx, e.dataTransfer.files); setDraggingIndex((cur) => (cur === idx ? null : cur)) }}
                  style={{
                    marginTop: 8,
                    padding: 16,
                    borderRadius: 8,
                    border: `2px dashed ${draggingIndex === idx ? '#ea580c' : '#d1d5db'}`,
                    background: draggingIndex === idx ? '#fff7ed' : '#fafafa',
                    color: '#374151'
                  }}
                >
                  Arraste e largue imagens aqui
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 8, alignItems: 'center' }}>
                  {(() => {
                    const fileInputId = `inf-files-${idx}`
                    return (
                      <>
                        <input id={fileInputId} type="file" accept="image/*" multiple onChange={(e) => handleFiles(idx, e.target.files)} style={{ display: 'none' }} />
                        <Button size="sm" type="button" variant="secondary" onClick={() => (document.getElementById(fileInputId) as HTMLInputElement)?.click()}>
                          <IconUpload />
                          <span>Escolher ficheiros…</span>
                        </Button>
                        <span style={{ color: '#6b7280', fontSize: 12 }}>Pode selecionar múltiplas imagens</span>
                      </>
                    )
                  })()}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginTop: 12 }}>
                <Button size="sm" type="button" variant="danger" onClick={() => removeInf(idx)} disabled={infractions.length <= 1}>
                  <IconTrash />
                  <span>Remover infração</span>
                </Button>
                {idx === infractions.length - 1 && (
                  <Button size="sm" type="button" variant="secondary" onClick={addInf}>
                    <IconPlus />
                    <span>Adicionar infração</span>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card
        title="Infractores (opcional)"
        subtitle="Se necessário, adicione intervenientes associados à ocorrência."
        extra={<span style={createCardIconBadgeStyle}><IconPeople /></span>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {(infractors.length === 0) ? <div style={createMutedBannerStyle}>Sem infractores adicionados.</div> : null}
          {infractors.map((it, idx) => (
            <div key={idx} style={createInfractorCardStyle}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 220 }}>
                <span style={{ fontSize: 13, color: '#374151' }}>Nome</span>
                <input value={it.nome ?? ''} onChange={(e) => updateInfractor(idx, { nome: e.target.value })} placeholder="Nome" style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db' }} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 200 }}>
                <span style={{ fontSize: 13, color: '#374151' }}>Documento</span>
                <input value={it.nr_identificacao ?? ''} onChange={(e) => updateInfractor(idx, { nr_identificacao: e.target.value })} placeholder="Nr. identificação" style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db' }} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 220 }}>
                <span style={{ fontSize: 13, color: '#374151' }}>Tipo de identificação</span>
                <input value={it.tipo_identificacao ?? ''} onChange={(e) => updateInfractor(idx, { tipo_identificacao: e.target.value })} placeholder="BI, Passaporte…" style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db' }} />
              </label>
              <Button size="sm" type="button" variant="danger" onClick={() => removeInfractor(idx)}>
                <IconTrash />
                <span>Remover</span>
              </Button>
            </div>
          ))}
          <div>
            <Button size="sm" type="button" variant="secondary" onClick={addInfractor}>
              <IconPlus />
              <span>Adicionar infractor</span>
            </Button>
          </div>
        </div>
      </Card>

      <div style={createFooterActionsStyle}>
        <Button variant="secondary" onClick={cancelar}>
          <IconClose />
          <span>Cancelar</span>
        </Button>
        <Button onClick={submit} disabled={submitting}>
          <IconSave />
          <span>{submitting ? 'A guardar…' : 'Guardar ocorrência'}</span>
        </Button>
      </div>
    </div>
  )
}

const createHeroStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'space-between',
  gap: 16,
  flexWrap: 'wrap',
  padding: 20,
  borderRadius: 24,
  background: 'linear-gradient(180deg, rgba(255, 252, 246, 0.98) 0%, rgba(250, 244, 234, 0.96) 100%)',
  border: '1px solid rgba(101, 74, 32, 0.12)',
  boxShadow: '0 18px 36px rgba(101, 74, 32, 0.08)',
}

const createEyebrowStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  width: 'fit-content',
  minHeight: 30,
  padding: '0 12px',
  borderRadius: 999,
  background: 'rgba(168, 113, 51, 0.1)',
  color: '#8d4a17',
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: '.12em',
  textTransform: 'uppercase',
}

const createHeroActionsStyle: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap',
  alignItems: 'center',
}

const createSummaryChipStyle: React.CSSProperties = {
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

const createErrorBannerStyle: React.CSSProperties = {
  padding: '14px 16px',
  borderRadius: 18,
  background: '#fff1f1',
  border: '1px solid rgba(200, 60, 60, 0.18)',
  color: '#991b1b',
  fontWeight: 700,
}

const createSectionCardStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
  padding: 18,
  borderRadius: 22,
  border: '1px solid rgba(101, 74, 32, 0.12)',
  background: 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(250,246,239,0.92) 100%)',
  boxShadow: '0 14px 28px rgba(101, 74, 32, 0.05)',
}

const createFieldLabelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: '.08em',
  textTransform: 'uppercase',
  color: '#8d4a17',
}

const createInputStyle: React.CSSProperties = {
  minHeight: 46,
  padding: '0 14px',
  borderRadius: 14,
  border: '1px solid rgba(101, 74, 32, 0.14)',
  background: 'rgba(255,255,255,0.94)',
  color: '#1f2937',
  boxShadow: '0 8px 18px rgba(101, 74, 32, 0.04)',
}

const createTextareaStyle: React.CSSProperties = {
  minHeight: 112,
  padding: 14,
  borderRadius: 16,
  border: '1px solid rgba(101, 74, 32, 0.14)',
  background: 'rgba(255,255,255,0.94)',
  color: '#1f2937',
  resize: 'vertical' as const,
  boxShadow: '0 8px 18px rgba(101, 74, 32, 0.04)',
}

const createInputWithIconStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  minHeight: 46,
  paddingLeft: 12,
  borderRadius: 14,
  border: '1px solid rgba(101, 74, 32, 0.14)',
  background: 'rgba(255,255,255,0.94)',
  boxShadow: '0 8px 18px rgba(101, 74, 32, 0.04)',
}

const createInputIconStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 28,
  height: 28,
  color: '#8d4a17',
}

const createDateInputStyle: React.CSSProperties = {
  flex: 1,
  minHeight: 44,
  padding: '0 14px 0 8px',
  border: 'none',
  background: 'transparent',
  color: '#1f2937',
  outline: 'none',
}

const createPreviewCardStyle: React.CSSProperties = {
  display: 'inline-flex',
  marginTop: 6,
  padding: 8,
  borderRadius: 16,
  border: '1px solid rgba(101, 74, 32, 0.12)',
  background: 'rgba(255,255,255,0.92)',
}

const createCardIconBadgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 38,
  height: 38,
  borderRadius: 14,
  background: 'rgba(168, 113, 51, 0.1)',
  color: '#8d4a17',
}

const createInfractionCardStyle: React.CSSProperties = {
  border: '1px solid rgba(101, 74, 32, 0.12)',
  borderRadius: 22,
  padding: 16,
  background: 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(250,246,239,0.92) 100%)',
  boxShadow: '0 16px 32px rgba(101, 74, 32, 0.06)',
}

const createInfractionHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  flexWrap: 'wrap',
  marginBottom: 14,
}

const createInfractionEyebrowStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: '.12em',
  textTransform: 'uppercase',
  color: '#8d4a17',
}

const createInfractionMetaStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  minHeight: 30,
  padding: '0 10px',
  borderRadius: 999,
  background: 'rgba(168, 113, 51, 0.1)',
  color: '#8d4a17',
  fontSize: 12,
  fontWeight: 700,
}

const createSubsectionTitleStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  color: '#1f2937',
}

const createMediaChipStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: 8,
  borderRadius: 14,
  border: '1px solid rgba(101, 74, 32, 0.12)',
  background: 'rgba(255,255,255,0.94)',
}

const createMutedBannerStyle: React.CSSProperties = {
  padding: '14px 16px',
  borderRadius: 18,
  background: 'rgba(255, 252, 246, 0.9)',
  border: '1px dashed rgba(101, 74, 32, 0.18)',
  color: '#5f6673',
  fontWeight: 600,
}

const createInfractorCardStyle: React.CSSProperties = {
  display: 'flex',
  gap: 12,
  alignItems: 'flex-end',
  flexWrap: 'wrap',
  padding: 12,
  borderRadius: 18,
  border: '1px dashed rgba(101, 74, 32, 0.18)',
  background: 'rgba(255, 252, 246, 0.92)',
}

const createFooterActionsStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 10,
  flexWrap: 'wrap',
  padding: 20,
  borderRadius: 22,
  border: '1px solid rgba(101, 74, 32, 0.12)',
  background: 'linear-gradient(180deg, rgba(255, 252, 246, 0.98) 0%, rgba(250, 244, 234, 0.96) 100%)',
  boxShadow: '0 18px 36px rgba(101, 74, 32, 0.08)',
}

function SectionHeading({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
      <div style={{ ...createInputIconStyle, width: 36, height: 36, borderRadius: 12, background: 'rgba(168, 113, 51, 0.1)' }}>
        {icon}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <strong style={{ color: '#1f2937', fontSize: 18 }}>{title}</strong>
        <span style={{ color: '#5f6673', lineHeight: 1.55 }}>{subtitle}</span>
      </div>
    </div>
  )
}

function TogglePill({ checked, label, description, onChange }: { checked: boolean; label: string; description: string; onChange: (value: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 16px',
        borderRadius: 18,
        border: checked ? '1px solid rgba(201, 109, 31, 0.24)' : '1px solid rgba(101, 74, 32, 0.12)',
        background: checked
          ? 'linear-gradient(180deg, rgba(255, 244, 230, 0.98) 0%, rgba(248, 231, 205, 0.92) 100%)'
          : 'rgba(255,255,255,0.94)',
        boxShadow: checked ? '0 12px 24px rgba(201, 109, 31, 0.10)' : '0 8px 18px rgba(101, 74, 32, 0.04)',
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          width: 48,
          height: 28,
          borderRadius: 999,
          background: checked ? '#c96d1f' : '#d8dde6',
          transition: 'background 0.18s ease',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 3,
            left: checked ? 23 : 3,
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: '#fff',
            boxShadow: '0 4px 10px rgba(31, 41, 55, 0.18)',
            transition: 'left 0.18s ease',
          }}
        />
      </span>
      <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ color: '#1f2937', fontWeight: 800, lineHeight: 1.2 }}>{label}</span>
        <span style={{ color: '#5f6673', fontSize: 13, lineHeight: 1.45 }}>{description}</span>
      </span>
    </button>
  )
}

function CreateIconBase({ children }: { children: React.ReactNode }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  )
}

function IconInfo() {
  return <CreateIconBase><circle cx="12" cy="12" r="8" /><path d="M12 10v5" /><circle cx="12" cy="7.5" r=".6" fill="currentColor" stroke="none" /></CreateIconBase>
}

function IconCalendar() {
  return <CreateIconBase><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4M16 3v4M4 10h16" /></CreateIconBase>
}

function IconToggle() {
  return <CreateIconBase><rect x="3" y="8" width="18" height="8" rx="4" /><circle cx="16" cy="12" r="3" fill="currentColor" stroke="none" /></CreateIconBase>
}

function IconMapPin() {
  return <CreateIconBase><path d="M12 20s6-5.4 6-10a6 6 0 1 0-12 0c0 4.6 6 10 6 10Z" /><circle cx="12" cy="10" r="2.2" /></CreateIconBase>
}

function IconRoute() {
  return <CreateIconBase><circle cx="6" cy="18" r="2" /><path d="M8 18h5a3 3 0 0 0 3-3V9" /><circle cx="17" cy="6" r="2" /></CreateIconBase>
}

function IconTarget() {
  return <CreateIconBase><circle cx="12" cy="12" r="7" /><circle cx="12" cy="12" r="2.2" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2" /></CreateIconBase>
}

function IconWarn() {
  return <CreateIconBase><path d="M12 4 20 19H4L12 4Z" /><path d="M12 9v4" /><circle cx="12" cy="16" r=".7" fill="currentColor" stroke="none" /></CreateIconBase>
}

function IconPeople() {
  return <CreateIconBase><circle cx="9" cy="9" r="3" /><path d="M4.5 18c1.4-2.4 7.6-2.4 9 0" /><path d="M17 8.5a2.4 2.4 0 1 1 0 4.8" /><path d="M18.5 17c-.5-1-1.4-1.8-2.7-2.2" /></CreateIconBase>
}

function IconCamera() {
  return <CreateIconBase><path d="M5 8h14v10H5z" /><path d="M9 8 10.5 6h3L15 8" /><circle cx="12" cy="13" r="2.8" /></CreateIconBase>
}

function IconUpload() {
  return <CreateIconBase><path d="M12 16V7" /><path d="m8.5 10.5 3.5-3.5 3.5 3.5" /><path d="M5 18h14" /></CreateIconBase>
}

function IconTrash() {
  return <CreateIconBase><path d="M5 7h14" /><path d="M9 4h6" /><path d="m7 7 .8 11h8.4L17 7" /><path d="M10 11v4M14 11v4" /></CreateIconBase>
}

function IconPlus() {
  return <CreateIconBase><path d="M12 5v14M5 12h14" /></CreateIconBase>
}

function IconClose() {
  return <CreateIconBase><path d="m7 7 10 10M17 7 7 17" /></CreateIconBase>
}

function IconSave() {
  return <CreateIconBase><path d="M5 5h12l2 2v12H5z" /><path d="M9 5v5h6V5" /><path d="M9 19v-5h6v5" /></CreateIconBase>
}

function appendCreatedParam(search: string) {
  const sp = new URLSearchParams(search)
  sp.set('created', '1')
  const query = sp.toString()
  return query ? `?${query}` : ''
}
