import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Card, Button, Heading, SearchSelect } from '../components'
import { MapPicker } from '../components/ui/MapPicker'
import { useAuth } from '../contexts/AuthContext'
import {
  OccurrenceApi,
  RegiaoApi,
  ASCApi,
  FormaConhecimentoApi,
  SectorInfracaoApi,
  TipoInfracaoApi,
  MaterialApi,
  ImagesApi,
  InfractorApi,
  InfractionApi,
  type OccurrenceUpdateOccurrenceRequest,
  type OccurrenceCreateOccurrenceInfraction,
  type OccurrenceCreateOccurrenceInfractor,
  type ModelRegiao,
  type ModelASC,
  type ModelFormaConhecimento,
  type ModelSectorInfracao,
  type ModelTipoInfracao,
  type ModelMaterial,
  type ModelOccurrence,
  type ModelInfraction
} from '../services'

export default function OcorrenciaEditScreen() {
  const { getApiConfig, getAuthorizationHeaderValue, logout } = useAuth()
  const authHeader = useMemo(() => getAuthorizationHeaderValue(), [getAuthorizationHeaderValue])
  const occurrenceApi = useMemo(() => new OccurrenceApi(getApiConfig()), [getApiConfig])
  const regiaoApi = useMemo(() => new RegiaoApi(getApiConfig()), [getApiConfig])
  const ascApi = useMemo(() => new ASCApi(getApiConfig()), [getApiConfig])
  const formaApi = useMemo(() => new FormaConhecimentoApi(getApiConfig()), [getApiConfig])
  const sectorApi = useMemo(() => new SectorInfracaoApi(getApiConfig()), [getApiConfig])
  const tipoApi = useMemo(() => new TipoInfracaoApi(getApiConfig()), [getApiConfig])
  const materialApi = useMemo(() => new MaterialApi(getApiConfig()), [getApiConfig])
  const imagesApi = useMemo(() => new ImagesApi(getApiConfig()), [getApiConfig])
  const infractorApi = useMemo(() => new InfractorApi(getApiConfig()), [getApiConfig])
  const infractionApi = useMemo(() => new InfractionApi(getApiConfig()), [getApiConfig])

  const id = useMemo(() => {
    const parts = window.location.pathname.split('/').filter(Boolean)
    return parts[1] || ''
  }, [])

  const [local, setLocal] = useState('')
  const [descricao, setDescricao] = useState('')
  const [regiaoId, setRegiaoId] = useState('')
  const [ascId, setAscId] = useState('')
  const [formaId, setFormaId] = useState('')
  const [lat, setLat] = useState('')
  const [long, setLong] = useState('')
  const [procCriminal, setProcCriminal] = useState(false)
  const [autoTexto, setAutoTexto] = useState('')
  const [autoImagem, setAutoImagem] = useState<string>('')
  const [dataFacto, setDataFacto] = useState<string>('')

  const [infractions, setInfractions] = useState<(OccurrenceCreateOccurrenceInfraction & { id?: string })[]>([])
  const [originalInfractorIds, setOriginalInfractorIds] = useState<Record<string, string[]>>({})

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [regioes, setRegioes] = useState<ModelRegiao[]>([])
  const [ascs, setAscs] = useState<ModelASC[]>([])
  const [formas, setFormas] = useState<ModelFormaConhecimento[]>([])
  const [setores, setSetores] = useState<ModelSectorInfracao[]>([])
  const [tiposInf, setTiposInf] = useState<ModelTipoInfracao[]>([])
  const [materialsBySector, setMaterialsBySector] = useState<Record<string, { id: string; label: string }[]>>({})
  const [loadingMaterialsSector, setLoadingMaterialsSector] = useState<Record<string, boolean>>({})
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)
  const [allMaterials, setAllMaterials] = useState<ModelMaterial[] | null>(null)

  const apiBase = (import.meta as any).env?.VITE_API_BASE_URL || '/api'

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

  // Loads
  useEffect(() => { (async () => {
    try { const { data } = await regiaoApi.privateRegioesGet(authHeader, 1, 200, 'name', 'asc'); if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return } setRegioes(data.items ?? []) } catch {}
  })() }, [regiaoApi, authHeader])
  useEffect(() => { (async () => {
    try { const { data } = await ascApi.privateAscsGet(authHeader, 1, 200, 'name', 'asc', undefined, regiaoId || undefined); if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return } setAscs(data.items ?? []) } catch {}
  })() }, [ascApi, authHeader, regiaoId])
  useEffect(() => { (async () => {
    try { const { data } = await formaApi.privateFormaConhecimentosGet(authHeader, 1, 200, 'name', 'asc'); if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return } setFormas(data.items ?? []) } catch {}
  })() }, [formaApi, authHeader])
  useEffect(() => { (async () => {
    try { const { data } = await sectorApi.privateSectorInfracaoGet(authHeader, 1, 200, 'name', 'asc'); if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return } setSetores(data.items ?? []) } catch {}
  })() }, [sectorApi, authHeader])
  useEffect(() => { (async () => {
    try { const { data } = await tipoApi.privateTiposInfracaoGet(authHeader, 1, 200, 'name', 'asc'); if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return } setTiposInf(data.items ?? []) } catch {}
  })() }, [tipoApi, authHeader])

  const ensureMaterials = useCallback(async (sectorId?: string) => {
    const sid = sectorId || ''
    if (!sid) return
    if (materialsBySector[sid]) return
    setLoadingMaterialsSector((s) => ({ ...s, [sid]: true }))
    try {
      const { data } = await materialApi.privateMateriaisGet(authHeader, 1, 500, 'name', 'asc', undefined, sid)
      const items = (data.items ?? []) as ModelMaterial[]
      const opts = items.filter((m) => m.id && (m.name || m.id)).map((m) => ({ id: String(m.id), label: String(m.name || m.id) }))
      setMaterialsBySector((m) => ({ ...m, [sid]: opts }))
    } catch { setMaterialsBySector((m) => ({ ...m, [sid]: [] })) }
    finally { setLoadingMaterialsSector((s) => ({ ...s, [sid]: false })) }
  }, [materialsBySector, materialApi, authHeader])

  const loadAllMaterialsOnce = useCallback(async () => {
    if (allMaterials) return allMaterials
    try {
      const { data } = await materialApi.privateMateriaisGet(authHeader, -1, undefined, 'name', 'asc')
      const list = (data.items ?? []) as ModelMaterial[]
      setAllMaterials(list)
      // prefill options per sector for label resolution
      const grouped: Record<string, { id: string; label: string }[]> = {}
      for (const m of list) {
        const sid = String(m.sector_infracao_id || '')
        if (!grouped[sid]) grouped[sid] = []
        if (m.id && (m.name || m.id)) grouped[sid].push({ id: String(m.id), label: String(m.name || m.id) })
      }
      setMaterialsBySector((prev) => ({ ...grouped, ...prev }))
      return list
    } catch {
      setAllMaterials([])
      return []
    }
  }, [allMaterials, materialApi, authHeader])

  const verifyImage = useCallback(async (imgId: string) => {
    try {
      const { data } = await imagesApi.publicImagesIdCheckGet(imgId)
      return (data as any)?.ok !== false
    } catch { return false }
  }, [imagesApi])

  // Load occurrence and map to form state
  const loadOccurrence = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [materials] = await Promise.all([loadAllMaterialsOnce()])
      const { data } = await occurrenceApi.privateOccurrencesIdGet(id, authHeader)
      if (isUnauthorizedBody(data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      const o = data as ModelOccurrence
      setLocal(o.local || '')
      setDescricao(o.descricao || '')
      setRegiaoId(o.regiao_id || '')
      setAscId(o.asc_id || '')
      setFormaId(o.forma_conhecimento_id || '')
      setLat(o.lat != null ? String(o.lat) : '')
      setLong(o.long != null ? String(o.long) : '')
      setProcCriminal(Boolean((o as any).processo_criminal_aberto))
      setDataFacto(((o as any).data_facto || '').slice(0, 10))
      setAutoTexto(String((o as any).auto || ''))
      setAutoImagem('')

      const mapped = await Promise.all((o.infractions ?? []).map(async (inf: ModelInfraction) => {
        const fotosCsv = (inf.fotografias || '').trim()
        const rawFotos = fotosCsv ? fotosCsv.split(',').map((s) => s.trim()).filter(Boolean) : []
        const verifiedFotos: string[] = []
        for (const f of rawFotos) { if (await verifyImage(f)) verifiedFotos.push(f) }
        // resolve material id from included relation or by matching tipo_material against all materials
        let materialId: string | undefined = (inf as any).material_id || (inf as any).material?.id
        if (!materialId) {
          const name = ((inf as any).material?.name || inf.tipo_material || '').trim().toLowerCase()
          if (name && materials && materials.length) {
            const found = materials.find((m) => (m.name || '').trim().toLowerCase() === name)
            materialId = found?.id || undefined
          }
        }
        // ensure sector options populated to show selected label immediately
        const sid = inf.sector_infracao_id || ''
        if (sid && (!materialsBySector[sid] || materialsBySector[sid].length === 0) && materials && materials.length) {
          const opts = materials
            .filter((m) => String(m.sector_infracao_id || '') === String(sid))
            .filter((m) => m.id && (m.name || m.id))
            .map((m) => ({ id: String(m.id), label: String(m.name || m.id) }))
          if (opts.length) setMaterialsBySector((prev) => ({ ...prev, [sid]: opts }))
        }
        return {
          id: inf.id,
          sector_infracao_id: inf.sector_infracao_id || undefined,
          tipo_infracao_id: inf.tipo_infracao_id || undefined,
          // keep tipo_material for compatibility/display; but track material_id for selection
          tipo_material: inf.tipo_material || (materials?.find((m) => m.id === materialId)?.name || undefined),
          ...(materialId ? ({ material_id: String(materialId) } as any) : {}),
          quantidade: inf.quantidade != null ? Number(inf.quantidade) as any : undefined,
          valor: inf.valor != null ? Number(inf.valor) as any : undefined,
          lat: inf.lat != null ? Number(inf.lat) as any : undefined,
          long: inf.long != null ? Number(inf.long) as any : undefined,
          fotografias: verifiedFotos,
          infractors: (inf.infractors ?? []).map((x) => ({ id: x.id, nome: x.nome || undefined, nr_identificacao: x.nr_identificacao || undefined, tipo_identificacao: x.tipo_identificacao || undefined })) as any
        } as any
      }))
      setInfractions(mapped)
      // store original infractor ids per infraction id
      const orig: Record<string, string[]> = {}
      for (const inf of mapped) { if ((inf as any).id) { orig[String((inf as any).id)] = ((inf as any).infractors ?? []).map((i: any) => i.id).filter(Boolean) } }
      setOriginalInfractorIds(orig)
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 401 || isUnauthorizedBody(err?.response?.data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      setError(status === 404 ? 'Ocorrência não encontrada.' : (!status ? 'Sem ligação ao servidor.' : status >= 500 ? 'Erro do servidor ao carregar.' : 'Falha a obter ocorrência.'))
    } finally { setLoading(false) }
  }, [occurrenceApi, authHeader, id, verifyImage])

  useEffect(() => { loadOccurrence() }, [loadOccurrence])

  // Keep default occurrence location for new infractions
  useEffect(() => {
    const occLat = lat !== '' && !Number.isNaN(Number(lat)) ? Number(lat) : undefined
    const occLong = long !== '' && !Number.isNaN(Number(long)) ? Number(long) : undefined
    if (occLat === undefined || occLong === undefined) return
    setInfractions((arr) => arr.map((it) => (it.lat == null && it.long == null ? { ...it, lat: occLat as any, long: occLong as any } : it)))
  }, [lat, long])

  function updateInf(index: number, partial: Partial<OccurrenceCreateOccurrenceInfraction & { id?: string }>) {
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
    for (let i = 0; i < files.length; i++) { try { urls.push(await toDataUrl(files[i])) } catch {} }
    if (urls.length) { setInfractions((arr) => arr.map((it, i) => i === index ? ({ ...it, fotografias: [ ...(it.fotografias ?? []), ...urls ] }) : it)) }
  }
  function removePhoto(index: number, pIndex: number) { setInfractions((arr) => arr.map((it, i) => i === index ? ({ ...it, fotografias: (it.fotografias ?? []).filter((_, k) => k !== pIndex) }) : it)) }

  function updateInfractor(index: number, iIndex: number, partial: Partial<OccurrenceCreateOccurrenceInfractor & { id?: string }>) {
    setInfractions((arr) => arr.map((it, i) => (i === index ? ({ ...it, infractors: (it.infractors ?? []).map((x, k) => (k === iIndex ? { ...x, ...partial } : x)) }) : it)))
  }
  function addInfractor(index: number) { setInfractions((arr) => arr.map((it, i) => (i === index ? ({ ...it, infractors: [ ...(it.infractors ?? []), {} as any ] }) : it))) }
  function removeInfractor(index: number, iIndex: number) { setInfractions((arr) => arr.map((it, i) => (i === index ? ({ ...it, infractors: (it.infractors ?? []).filter((_, k) => k !== iIndex) }) : it))) }

  async function submit() {
    setSubmitting(true); setSubmitError(null)
    try {
      // 1) Update occurrence base
      const occPayload: OccurrenceUpdateOccurrenceRequest = {
        local: local || undefined,
        descricao: descricao || undefined,
        lat: lat ? Number(lat) : undefined,
        long: long ? Number(long) : undefined,
      }
      const extras: any = { processo_criminal_aberto: !!procCriminal }
      if (procCriminal) {
        if (autoTexto) extras.auto = autoTexto
        if (autoImagem) extras.auto_image = autoImagem.startsWith('data:') ? (autoImagem.split(',')[1] || '') : autoImagem
      }
      const toRfc3339 = (d?: string | null) => { if (!d) return undefined; try { return new Date(`${d}T00:00:00Z`).toISOString() } catch { return undefined } }
      await occurrenceApi.privateOccurrencesIdPut(id, authHeader, { ...(occPayload as any), ...extras, data_facto: toRfc3339(dataFacto) } as any)

      // 2) Upsert infractions
      for (const inf of infractions) {
        // Apenas enviar novas imagens (base64). Imagens existentes por nome NÃO devem ser reenviadas no update.
        const newFotosBase64 = (inf.fotografias ?? [])
          .filter((img) => img.startsWith('data:'))
          .map((img) => (img.split(',')[1] || ''))
        const quantidade = (inf.quantidade != null && !Number.isNaN(Number(inf.quantidade)) && Number(inf.quantidade) >= 1) ? Number(inf.quantidade) : undefined
        const payload: any = {
          sector_infracao_id: inf.sector_infracao_id || undefined,
          tipo_infracao_id: inf.tipo_infracao_id || undefined,
          // No update contract for material_id; fall back to tipo_material
          tipo_material: (inf as any).material_id ? (materialsBySector[inf.sector_infracao_id ?? ''] || []).find((o) => o.id === (inf as any).material_id)?.label : (inf as any).tipo_material,
          quantidade,
          valor: inf.valor != null && !Number.isNaN(Number(inf.valor)) ? Number(inf.valor) : undefined,
          lat: inf.lat != null && !Number.isNaN(Number(inf.lat)) ? Number(inf.lat) : undefined,
          long: inf.long != null && !Number.isNaN(Number(inf.long)) ? Number(inf.long) : undefined,
        }
        if (newFotosBase64.length > 0) payload.fotografias = newFotosBase64
        if ((inf as any).id) {
          await infractionApi.privateInfractionsIdPut(String((inf as any).id), authHeader, payload as any)
          // Infractors sync for existing infraction id
          const curIds = ((inf.infractors ?? []) as any[]).map((x) => x.id).filter(Boolean)
          const origIds = originalInfractorIds[String((inf as any).id)] || []
          // delete removed
          for (const delId of origIds.filter((x) => !curIds.includes(x))) {
            try { await infractorApi.privateInfractorsIdDelete(delId, authHeader) } catch {}
          }
          // upsert current
          for (const it of (inf.infractors ?? []) as any[]) {
            if (it.id) {
              await infractorApi.privateInfractorsIdPut(String(it.id), authHeader, {
                nome: it.nome || undefined,
                nr_identificacao: it.nr_identificacao || undefined,
                tipo_identificacao: it.tipo_identificacao || undefined
              })
            } else {
              await infractorApi.privateInfractorsPost(authHeader, {
                infraction_id: String((inf as any).id),
                nome: it.nome || undefined,
                nr_identificacao: it.nr_identificacao || undefined,
                tipo_identificacao: it.tipo_identificacao || undefined
              })
            }
          }
        } else {
          // create new infraction for this occurrence
          const { data: created } = await infractionApi.privateInfractionsPost(authHeader, { ...(payload as any), occurrence_id: id })
          const newId = (created as any)?.id
          if (newId && (inf.infractors ?? []).length) {
            for (const it of (inf.infractors ?? []) as any[]) {
              await infractorApi.privateInfractorsPost(authHeader, {
                infraction_id: String(newId),
                nome: it.nome || undefined,
                nr_identificacao: it.nr_identificacao || undefined,
                tipo_identificacao: it.tipo_identificacao || undefined
              })
            }
          }
        }
      }

      // Done -> go to details
      if (id) { window.history.pushState({}, '', `/ocorrencias/${id}${window.location.search}`); window.dispatchEvent(new Event('locationchange')) }
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 401 || isUnauthorizedBody(err?.response?.data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      setSubmitError(status === 400 ? 'Dados inválidos.' : !status ? 'Sem ligação ao servidor.' : 'Falha ao atualizar ocorrência.')
    } finally { setSubmitting(false) }
  }

  function cancelar() {
    if (id) { window.history.pushState({}, '', `/ocorrencias/${id}${window.location.search}`); window.dispatchEvent(new Event('locationchange')) }
    else { window.history.pushState({}, '', `/ocorrencias${window.location.search}`); window.dispatchEvent(new Event('locationchange')) }
  }

  function renderPhotoSrc(s: string): string {
    if (!s) return ''
    if (s.startsWith('data:')) return s
    return `${apiBase}/public/images/${s}`
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={editHeroStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={editEyebrowStyle}>Ocorrências</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Heading level={2}>Editar ocorrência</Heading>
            <p style={{ margin: 0, color: '#5f6673', lineHeight: 1.6 }}>
              Atualize os dados gerais, coordenadas, processo criminal e infrações associadas.
            </p>
          </div>
        </div>
        <div style={editActionRowStyle}>
          <button type="button" onClick={cancelar} style={editSecondaryActionStyle}>
            <IconClose />
            <span>Cancelar</span>
          </button>
        </div>
      </div>

      {error ? <div style={editErrorBannerStyle}>{error}</div> : null}
      {submitError ? <div style={editErrorBannerStyle}>{submitError}</div> : null}

      <Card subtitle="Atualize o contexto, a geografia e a localização antes de ajustar as infrações.">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={editSectionCardStyle}>
            <SectionHeading icon={<IconInfo />} title="Contexto base" subtitle="Atualize o registo principal, a data do facto e a descrição operacional." />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 260, gridColumn: 'span 2' }}>
                <span style={editFieldLabelStyle}>Local</span>
                <input value={local} onChange={(e) => setLocal(e.target.value)} placeholder="Ex.: Rua X, Bairro Y" style={editInputStyle} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 220 }}>
                <span style={editFieldLabelStyle}>Data da ocorrência</span>
                <div style={editInputWithIconStyle}>
                  <span style={editInputIconStyle}><IconCalendar /></span>
                  <input type="date" value={dataFacto} onChange={(e) => setDataFacto(e.target.value)} style={editDateInputStyle} />
                </div>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 220 }}>
                <span style={editFieldLabelStyle}>Forma de conhecimento</span>
                <select value={formaId} onChange={(e) => setFormaId(e.target.value)} style={editInputStyle}>
                  <option value="">Selecionar</option>
                  {formas.map((f) => <option key={f.id} value={f.id}>{f.name || f.id}</option>)}
                </select>
              </label>
            </div>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={editFieldLabelStyle}>Descrição</span>
              <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descrição da ocorrência" rows={4} style={editTextareaStyle} />
            </label>
          </div>

          <div style={editSectionCardStyle}>
            <SectionHeading icon={<IconToggle />} title="Classificação e processo" subtitle="Ative o processo criminal apenas quando for necessário manter os dados do auto." />
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <TogglePill
                checked={procCriminal}
                label="Processo criminal aberto"
                description="Revela os dados do auto e o respetivo anexo."
                onChange={(next) => setProcCriminal(next)}
              />
            </div>

            {procCriminal && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 220 }}>
                  <span style={editFieldLabelStyle}>Dados do auto</span>
                  <input value={autoTexto} onChange={(e) => setAutoTexto(e.target.value)} placeholder="Número ou descrição do auto" style={editInputStyle} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 260 }}>
                  <span style={editFieldLabelStyle}>Anexo do auto</span>
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
                    <div style={editPreviewCardStyle}>
                      <img src={autoImagem} alt="Auto" style={{ width: 160, height: 120, objectFit: 'cover', borderRadius: 12, border: '1px solid rgba(101, 74, 32, 0.12)' }} />
                    </div>
                  ) : null}
                </label>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) minmax(320px, 1.1fr)', gap: 16 }}>
            <div style={editSectionCardStyle}>
              <SectionHeading icon={<IconMapPin />} title="Contexto territorial" subtitle="Agrupe aqui a região, ASC e o enquadramento operacional do registo." />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={editFieldLabelStyle}>Região</span>
                  <select value={regiaoId} onChange={(e) => { setRegiaoId(e.target.value); setAscId('') }} style={editInputStyle}>
                    <option value="">Selecionar</option>
                    {regioes.map((r) => <option key={r.id} value={r.id}>{r.name || r.id}</option>)}
                  </select>
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={editFieldLabelStyle}>ASC</span>
                  <select value={ascId} onChange={(e) => setAscId(e.target.value)} style={editInputStyle}>
                    <option value="">Selecionar</option>
                    {ascs.filter((a) => !regiaoId || a.regiao_id === regiaoId).map((a) => <option key={a.id} value={a.id}>{a.name || a.id}</option>)}
                  </select>
                </label>
              </div>
            </div>

            <div style={editSectionCardStyle}>
              <SectionHeading icon={<IconTarget />} title="Localização" subtitle="Ajuste as coordenadas e reaproveite-as rapidamente nas infrações." />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(120px, 1fr))', gap: 14 }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={editFieldLabelStyle}>Latitude</span>
                  <input value={lat} onChange={(e) => setLat(e.target.value)} placeholder="-25.96" inputMode="decimal" style={editInputStyle} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={editFieldLabelStyle}>Longitude</span>
                  <input value={long} onChange={(e) => setLong(e.target.value)} placeholder="32.58" inputMode="decimal" style={editInputStyle} />
                </label>
              </div>
              <MapPicker
                markerKind="occurrence"
                value={{ lat: lat !== '' && !Number.isNaN(Number(lat)) ? Number(lat) : undefined, lng: long !== '' && !Number.isNaN(Number(long)) ? Number(long) : undefined }}
                onChange={(pos) => { setLat(String(pos.lat)); setLong(String(pos.lng)) }}
                height={300}
              />
            </div>
          </div>
        </div>
      </Card>

      <Card title="Infrações" subtitle="Atualize os blocos de infração, materiais, fotografias e intervenientes." extra={<span style={editCardIconBadgeStyle}><IconWarn /></span>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {infractions.map((inf, idx) => (
            <div key={idx} style={editInfractionCardStyle}>
              <div style={editInfractionHeaderStyle}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={editInfractionEyebrowStyle}>Bloco {idx + 1}</span>
                  <strong style={{ color: '#1f2937', fontSize: 18 }}>Infração</strong>
                </div>
                <span style={editInfractionMetaStyle}>
                  {(inf.fotografias ?? []).length} foto(s)
                </span>
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 220 }}>
                  <span style={editFieldLabelStyle}>Sector de Infração</span>
                  <select
                    value={inf.sector_infracao_id ?? ''}
                    onChange={(e) => { const sid = e.target.value || undefined; updateInf(idx, { sector_infracao_id: sid, ...(sid ? ({ material_id: undefined } as any) : {}) }); ensureMaterials(sid) }}
                    style={editCompactInputStyle}
                  >
                    <option value="">— Selecionar —</option>
                    {setores.map((s) => <option key={s.id} value={s.id}>{s.name || s.id}</option>)}
                  </select>
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 220 }}>
                  <span style={editFieldLabelStyle}>Tipo de Infração</span>
                  <select value={inf.tipo_infracao_id ?? ''} onChange={(e) => updateInf(idx, { tipo_infracao_id: e.target.value || undefined })} style={editCompactInputStyle}>
                    <option value="">— Selecionar —</option>
                    {tiposInf.map((t) => <option key={t.id} value={t.id}>{t.name || t.id}</option>)}
                  </select>
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 240 }}>
                  <span style={editFieldLabelStyle}>Material</span>
                  <SearchSelect
                    options={materialsBySector[inf.sector_infracao_id ?? ''] ?? []}
                    value={(inf as any).material_id || ''}
                    onChange={(mid) => updateInf(idx, mid ? ({ material_id: mid } as any) : ({ material_id: undefined } as any))}
                    placeholder={inf.sector_infracao_id ? (loadingMaterialsSector[inf.sector_infracao_id] ? 'A carregar…' : 'Selecionar material…') : 'Selecione o sector primeiro'}
                    searchPlaceholder="Procurar material…"
                    noResultsText="Sem materiais"
                    disabled={!inf.sector_infracao_id || loadingMaterialsSector[inf.sector_infracao_id]}
                  />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 160 }}>
                  <span style={editFieldLabelStyle}>Quantidade</span>
                  <input
                    type="number"
                    min={1}
                    step="any"
                    value={inf.quantidade ?? ''}
                    onChange={(e) => {
                      const val = e.target.value
                      if (val === '') { updateInf(idx, { quantidade: undefined as any }); return }
                      const num = Number(val)
                      if (Number.isNaN(num)) return
                      updateInf(idx, { quantidade: (num < 1 ? 1 : num) as any })
                    }}
                    placeholder="1"
                    style={editCompactInputStyle}
                  />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 160 }}>
                  <span style={editFieldLabelStyle}>Valor</span>
                  <input value={inf.valor ?? ''} onChange={(e) => updateInf(idx, { valor: e.target.value ? Number(e.target.value) as any : undefined })} inputMode="decimal" placeholder="0" style={editCompactInputStyle} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 160 }}>
                  <span style={editFieldLabelStyle}>Latitude</span>
                  <input value={inf.lat ?? ''} onChange={(e) => updateInf(idx, { lat: e.target.value ? Number(e.target.value) as any : undefined })} inputMode="decimal" placeholder="-25.96" style={editCompactInputStyle} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 160 }}>
                  <span style={editFieldLabelStyle}>Longitude</span>
                  <input value={inf.long ?? ''} onChange={(e) => updateInf(idx, { long: e.target.value ? Number(e.target.value) as any : undefined })} inputMode="decimal" placeholder="32.58" style={editCompactInputStyle} />
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
                <div style={editSubsectionTitleStyle}>
                  <IconCamera />
                  <strong>Fotografias</strong>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                  {(inf.fotografias ?? []).map((img, i) => (
                    <div key={i} style={editMediaChipStyle}>
                      <img src={renderPhotoSrc(img)} alt="Foto" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 6 }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '0.3' }} />
                      {!img.startsWith('data:') ? <span style={{ fontSize: 12, color: '#374151' }}>{img}</span> : null}
                      <Button size="sm" variant="danger" onClick={() => removePhoto(idx, i)}>
                        <IconTrash />
                      </Button>
                    </div>
                  ))}
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
                    const fileInputId = `inf-edit-files-${idx}`
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

              <div style={{ marginTop: 12 }}>
                <div style={editSubsectionTitleStyle}>
                  <IconPeople />
                  <strong>Infractores</strong>
                </div>
                {(inf.infractors ?? []).length === 0 ? (
                  <div style={editMutedBannerStyle}>Sem infractores (opcional).</div>
                ) : null}
                {(inf.infractors ?? []).map((it: any, k: number) => (
                  <div key={k} style={{ ...editInfractorCardStyle, marginTop: 8 }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 200 }}>
                      <span style={editFieldLabelStyle}>Nome</span>
                      <input value={it.nome ?? ''} onChange={(e) => updateInfractor(idx, k, { nome: e.target.value })} placeholder="Nome" style={editCompactInputStyle} />
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 180 }}>
                      <span style={editFieldLabelStyle}>Documento</span>
                      <input value={it.nr_identificacao ?? ''} onChange={(e) => updateInfractor(idx, k, { nr_identificacao: e.target.value })} placeholder="Nr. identificação" style={editCompactInputStyle} />
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 200 }}>
                      <span style={editFieldLabelStyle}>Tipo de identificação</span>
                      <input value={it.tipo_identificacao ?? ''} onChange={(e) => updateInfractor(idx, k, { tipo_identificacao: e.target.value })} placeholder="BI, Passaporte…" style={editCompactInputStyle} />
                    </label>
                    <Button size="sm" type="button" variant="danger" onClick={() => removeInfractor(idx, k)}>
                      <IconTrash />
                      <span>Remover</span>
                    </Button>
                  </div>
                ))}
                <div style={{ marginTop: 8 }}>
                  <Button size="sm" type="button" variant="secondary" onClick={() => addInfractor(idx)}>
                    <IconPlus />
                    <span>Adicionar infractor</span>
                  </Button>
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

      <div style={editFooterActionsStyle}>
        <button type="button" onClick={cancelar} style={editSecondaryActionStyle}>
          <IconClose />
          <span>Cancelar</span>
        </button>
        <button type="button" onClick={submit} disabled={submitting} style={editPrimaryActionStyle(submitting)}>
          <IconSave />
          <span>{submitting ? 'A guardar…' : 'Guardar alterações'}</span>
        </button>
      </div>
    </div>
  )
}

const editHeroStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'space-between',
  gap: 16,
  flexWrap: 'wrap',
  padding: 24,
  borderRadius: 28,
  background: 'linear-gradient(135deg, rgba(255, 249, 240, 0.98) 0%, rgba(247, 237, 222, 0.96) 100%)',
  border: '1px solid rgba(101, 74, 32, 0.12)',
  boxShadow: '0 24px 44px rgba(101, 74, 32, 0.08)',
}

const editEyebrowStyle: React.CSSProperties = {
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

const editActionRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap',
}

const editErrorBannerStyle: React.CSSProperties = {
  padding: '14px 16px',
  borderRadius: 18,
  background: '#fff1f1',
  border: '1px solid rgba(200, 60, 60, 0.18)',
  color: '#991b1b',
  fontWeight: 700,
}

const editSectionCardStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
  padding: 18,
  borderRadius: 22,
  border: '1px solid rgba(101, 74, 32, 0.12)',
  background: 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(250,246,239,0.92) 100%)',
  boxShadow: '0 14px 28px rgba(101, 74, 32, 0.05)',
}

const editFieldLabelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: '.08em',
  textTransform: 'uppercase',
  color: '#8d4a17',
}

const editInputStyle: React.CSSProperties = {
  minHeight: 46,
  padding: '0 14px',
  borderRadius: 14,
  border: '1px solid rgba(101, 74, 32, 0.14)',
  background: 'rgba(255,255,255,0.94)',
  color: '#1f2937',
  boxShadow: '0 8px 18px rgba(101, 74, 32, 0.04)',
}

const editCompactInputStyle: React.CSSProperties = {
  minHeight: 42,
  padding: '0 12px',
  borderRadius: 12,
  border: '1px solid rgba(101, 74, 32, 0.14)',
  background: 'rgba(255,255,255,0.94)',
  color: '#1f2937',
  boxShadow: '0 8px 18px rgba(101, 74, 32, 0.04)',
}

const editTextareaStyle: React.CSSProperties = {
  minHeight: 112,
  padding: 14,
  borderRadius: 16,
  border: '1px solid rgba(101, 74, 32, 0.14)',
  background: 'rgba(255,255,255,0.94)',
  color: '#1f2937',
  resize: 'vertical' as const,
  boxShadow: '0 8px 18px rgba(101, 74, 32, 0.04)',
}

const editInputWithIconStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  minHeight: 46,
  paddingLeft: 12,
  borderRadius: 14,
  border: '1px solid rgba(101, 74, 32, 0.14)',
  background: 'rgba(255,255,255,0.94)',
  boxShadow: '0 8px 18px rgba(101, 74, 32, 0.04)',
}

const editInputIconStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 28,
  height: 28,
  color: '#8d4a17',
}

const editDateInputStyle: React.CSSProperties = {
  flex: 1,
  minHeight: 44,
  padding: '0 14px 0 8px',
  border: 'none',
  background: 'transparent',
  color: '#1f2937',
  outline: 'none',
}

const editPreviewCardStyle: React.CSSProperties = {
  display: 'inline-flex',
  marginTop: 6,
  padding: 8,
  borderRadius: 16,
  border: '1px solid rgba(101, 74, 32, 0.12)',
  background: 'rgba(255,255,255,0.92)',
}

const editCardIconBadgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 38,
  height: 38,
  borderRadius: 14,
  background: 'rgba(168, 113, 51, 0.1)',
  color: '#8d4a17',
}

const editInfractionCardStyle: React.CSSProperties = {
  border: '1px solid rgba(101, 74, 32, 0.12)',
  borderRadius: 22,
  padding: 16,
  background: 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(250,246,239,0.92) 100%)',
  boxShadow: '0 16px 32px rgba(101, 74, 32, 0.06)',
}

const editInfractionHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  flexWrap: 'wrap',
  marginBottom: 14,
}

const editInfractionEyebrowStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: '.12em',
  textTransform: 'uppercase',
  color: '#8d4a17',
}

const editInfractionMetaStyle: React.CSSProperties = {
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

const editSubsectionTitleStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  color: '#1f2937',
}

const editMediaChipStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: 8,
  borderRadius: 14,
  border: '1px solid rgba(101, 74, 32, 0.12)',
  background: 'rgba(255,255,255,0.94)',
}

const editMutedBannerStyle: React.CSSProperties = {
  padding: '14px 16px',
  borderRadius: 18,
  background: 'rgba(255, 252, 246, 0.9)',
  border: '1px dashed rgba(101, 74, 32, 0.18)',
  color: '#5f6673',
  fontWeight: 600,
  marginTop: 8,
}

const editInfractorCardStyle: React.CSSProperties = {
  display: 'flex',
  gap: 12,
  alignItems: 'flex-end',
  flexWrap: 'wrap',
  padding: 12,
  borderRadius: 18,
  border: '1px dashed rgba(101, 74, 32, 0.18)',
  background: 'rgba(255, 252, 246, 0.92)',
}

const editFooterActionsStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 10,
  flexWrap: 'wrap',
  padding: 20,
  borderRadius: 22,
  border: '1px solid rgba(101, 74, 32, 0.12)',
  background: 'linear-gradient(180deg, rgba(255, 252, 246, 0.98) 0%, rgba(250, 244, 234, 0.96) 100%)',
}

const editSecondaryActionStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  minHeight: 46,
  padding: '0 18px',
  borderRadius: 16,
  border: '1px solid rgba(101, 74, 32, 0.16)',
  background: 'linear-gradient(180deg, #fffaf2 0%, #f6ecde 100%)',
  color: '#8d4a17',
  fontSize: 14,
  fontWeight: 800,
  boxShadow: '0 12px 24px rgba(76, 57, 24, 0.08)',
  cursor: 'pointer',
}

function editPrimaryActionStyle(disabled?: boolean): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 46,
    padding: '0 18px',
    borderRadius: 16,
    border: '1px solid rgba(201, 109, 31, 0.18)',
    background: disabled
      ? 'linear-gradient(135deg, rgba(201,109,31,0.55) 0%, rgba(168,92,28,0.55) 100%)'
      : 'linear-gradient(135deg, #c96d1f 0%, #a85c1c 100%)',
    color: '#fff8ef',
    fontSize: 14,
    fontWeight: 800,
    letterSpacing: '.01em',
    boxShadow: disabled ? 'none' : '0 18px 34px rgba(201, 109, 31, 0.22)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.72 : 1,
  }
}

function SectionHeading({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
      <div style={{ ...editInputIconStyle, width: 36, height: 36, borderRadius: 12, background: 'rgba(168, 113, 51, 0.1)' }}>
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
      <span aria-hidden="true" style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', width: 48, height: 28, borderRadius: 999, background: checked ? '#c96d1f' : '#d8dde6', transition: 'background 0.18s ease', flexShrink: 0 }}>
        <span style={{ position: 'absolute', top: 3, left: checked ? 23 : 3, width: 22, height: 22, borderRadius: '50%', background: '#fff', boxShadow: '0 4px 10px rgba(31, 41, 55, 0.18)', transition: 'left 0.18s ease' }} />
      </span>
      <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ color: '#1f2937', fontWeight: 800, lineHeight: 1.2 }}>{label}</span>
        <span style={{ color: '#5f6673', fontSize: 13, lineHeight: 1.45 }}>{description}</span>
      </span>
    </button>
  )
}

function EditIconBase({ children }: { children: React.ReactNode }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  )
}

function IconInfo() { return <EditIconBase><circle cx="12" cy="12" r="8" /><path d="M12 10v5" /><circle cx="12" cy="7.5" r=".6" fill="currentColor" stroke="none" /></EditIconBase> }
function IconCalendar() { return <EditIconBase><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4M16 3v4M4 10h16" /></EditIconBase> }
function IconToggle() { return <EditIconBase><rect x="3" y="8" width="18" height="8" rx="4" /><circle cx="16" cy="12" r="3" fill="currentColor" stroke="none" /></EditIconBase> }
function IconMapPin() { return <EditIconBase><path d="M12 20s6-5.4 6-10a6 6 0 1 0-12 0c0 4.6 6 10 6 10Z" /><circle cx="12" cy="10" r="2.2" /></EditIconBase> }
function IconTarget() { return <EditIconBase><circle cx="12" cy="12" r="7" /><circle cx="12" cy="12" r="2.2" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2" /></EditIconBase> }
function IconWarn() { return <EditIconBase><path d="M12 4 20 19H4L12 4Z" /><path d="M12 9v4" /><circle cx="12" cy="16" r=".7" fill="currentColor" stroke="none" /></EditIconBase> }
function IconPeople() { return <EditIconBase><circle cx="9" cy="9" r="3" /><path d="M4.5 18c1.4-2.4 7.6-2.4 9 0" /><path d="M17 8.5a2.4 2.4 0 1 1 0 4.8" /><path d="M18.5 17c-.5-1-1.4-1.8-2.7-2.2" /></EditIconBase> }
function IconCamera() { return <EditIconBase><path d="M5 8h14v10H5z" /><path d="M9 8 10.5 6h3L15 8" /><circle cx="12" cy="13" r="2.8" /></EditIconBase> }
function IconUpload() { return <EditIconBase><path d="M12 16V7" /><path d="m8.5 10.5 3.5-3.5 3.5 3.5" /><path d="M5 18h14" /></EditIconBase> }
function IconTrash() { return <EditIconBase><path d="M5 7h14" /><path d="M9 4h6" /><path d="m7 7 .8 11h8.4L17 7" /><path d="M10 11v4M14 11v4" /></EditIconBase> }
function IconPlus() { return <EditIconBase><path d="M12 5v14M5 12h14" /></EditIconBase> }
function IconClose() { return <EditIconBase><path d="m7 7 10 10M17 7 7 17" /></EditIconBase> }
function IconSave() { return <EditIconBase><path d="M5 5h12l2 2v12H5z" /><path d="M9 5v5h6V5" /><path d="M9 19v-5h6v5" /></EditIconBase> }
