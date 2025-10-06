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
      await occurrenceApi.privateOccurrencesIdPut(id, authHeader, { ...(occPayload as any), ...extras })

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
      if (id) { window.history.pushState({}, '', `/ocorrencias/${id}`); window.dispatchEvent(new Event('locationchange')) }
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 401 || isUnauthorizedBody(err?.response?.data)) { logout('Sessão expirada. Inicie sessão novamente.'); return }
      setSubmitError(status === 400 ? 'Dados inválidos.' : !status ? 'Sem ligação ao servidor.' : 'Falha ao atualizar ocorrência.')
    } finally { setSubmitting(false) }
  }

  function cancelar() {
    if (id) { window.history.pushState({}, '', `/ocorrencias/${id}`); window.dispatchEvent(new Event('locationchange')) }
    else { window.history.pushState({}, '', `/ocorrencias`); window.dispatchEvent(new Event('locationchange')) }
  }

  function renderPhotoSrc(s: string): string {
    if (!s) return ''
    if (s.startsWith('data:')) return s
    return `${apiBase}/public/images/${s}`
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Heading level={2}>Editar ocorrência</Heading>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" onClick={cancelar}>Voltar</Button>
          <Button onClick={submit} disabled={submitting}>{submitting ? 'A guardar…' : 'Guardar'}</Button>
        </div>
      </div>

      {error ? <div style={{ background: '#fee2e2', color: '#991b1b', padding: 10, borderRadius: 8 }}>{error}</div> : null}
      {submitError ? <div style={{ background: '#fee2e2', color: '#991b1b', padding: 10, borderRadius: 8 }}>{submitError}</div> : null}

      <Card title="Dados da ocorrência">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, color: '#374151' }}>Local</span>
            <input value={local} onChange={(e) => setLocal(e.target.value)} placeholder="Ex.: Rua X, Bairro Y" style={{ padding: 12, borderRadius: 8, border: '1px solid #d1d5db' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, color: '#374151' }}>Descrição</span>
            <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descrição da ocorrência" rows={4} style={{ padding: 12, borderRadius: 8, border: '1px solid #d1d5db', resize: 'vertical' }} />
          </label>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 220 }}>
              <span style={{ fontSize: 13, color: '#374151' }}>Região</span>
              <select value={regiaoId} onChange={(e) => { setRegiaoId(e.target.value); setAscId('') }} required style={{ padding: 12, borderRadius: 8, border: '1px solid #d1d5db', background: '#fff' }}>
                <option value="">— Selecionar —</option>
                {regioes.map((r) => <option key={r.id} value={r.id}>{r.name || r.id}</option>)}
              </select>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 220 }}>
              <span style={{ fontSize: 13, color: '#374151' }}>ASC</span>
              <select value={ascId} onChange={(e) => setAscId(e.target.value)} style={{ padding: 12, borderRadius: 8, border: '1px solid #d1d5db', background: '#fff' }}>
                <option value="">— Selecionar —</option>
                {ascs.filter((a) => !regiaoId || a.regiao_id === regiaoId).map((a) => <option key={a.id} value={a.id}>{a.name || a.id}</option>)}
              </select>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 220 }}>
              <span style={{ fontSize: 13, color: '#374151' }}>Forma de conhecimento</span>
              <select value={formaId} onChange={(e) => setFormaId(e.target.value)} style={{ padding: 12, borderRadius: 8, border: '1px solid #d1d5db', background: '#fff' }}>
                <option value="">— Selecionar —</option>
                {formas.map((f) => <option key={f.id} value={f.id}>{f.name || f.id}</option>)}
              </select>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 160 }}>
              <span style={{ fontSize: 13, color: '#374151' }}>Latitude</span>
              <input value={lat} onChange={(e) => setLat(e.target.value)} placeholder="-25.96" inputMode="decimal" style={{ padding: 12, borderRadius: 8, border: '1px solid #d1d5db' }} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 160 }}>
              <span style={{ fontSize: 13, color: '#374151' }}>Longitude</span>
              <input value={long} onChange={(e) => setLong(e.target.value)} placeholder="32.58" inputMode="decimal" style={{ padding: 12, borderRadius: 8, border: '1px solid #d1d5db' }} />
            </label>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={procCriminal} onChange={(e) => setProcCriminal(e.target.checked)} />
              <span style={{ fontSize: 13, color: '#374151' }}>Processo criminal aberto</span>
            </label>
          </div>
          {procCriminal && (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 220 }}>
                <span style={{ fontSize: 13, color: '#374151' }}>Dados do auto</span>
                <input value={autoTexto} onChange={(e) => setAutoTexto(e.target.value)} placeholder="Número/descrição do auto" style={{ padding: 12, borderRadius: 8, border: '1px solid #d1d5db' }} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 260 }}>
                <span style={{ fontSize: 13, color: '#374151' }}>Anexo do auto (imagem)</span>
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
                  <img src={autoImagem} alt="Auto" style={{ marginTop: 6, width: 160, height: 120, objectFit: 'cover', borderRadius: 8, border: '1px solid #e5e7eb' }} />
                ) : null}
              </label>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, color: '#374151' }}>Localização no mapa</span>
            <MapPicker
              value={{ lat: lat !== '' && !Number.isNaN(Number(lat)) ? Number(lat) : undefined, lng: long !== '' && !Number.isNaN(Number(long)) ? Number(long) : undefined }}
              onChange={(pos) => { setLat(String(pos.lat)); setLong(String(pos.lng)) }}
              height={300}
            />
          </div>
        </div>
      </Card>

      <Card title="Infrações">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {infractions.map((inf, idx) => (
            <div key={idx} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 12 }}>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 220 }}>
                  <span style={{ fontSize: 13, color: '#374151' }}>Sector de Infração</span>
                  <select
                    value={inf.sector_infracao_id ?? ''}
                    onChange={(e) => { const sid = e.target.value || undefined; updateInf(idx, { sector_infracao_id: sid, ...(sid ? ({ material_id: undefined } as any) : {}) }); ensureMaterials(sid) }}
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
                    onChange={(mid) => updateInf(idx, mid ? ({ material_id: mid } as any) : ({ material_id: undefined } as any))}
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
                      if (Number.isNaN(num)) return
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
                  <Button type="button" variant="secondary" onClick={() => {
                    const occLat = lat !== '' && !Number.isNaN(Number(lat)) ? Number(lat) : undefined
                    const occLong = long !== '' && !Number.isNaN(Number(long)) ? Number(long) : undefined
                    updateInf(idx, { lat: occLat as any, long: occLong as any })
                  }}>Usar localização da ocorrência</Button>
                </div>
              </div>

              <div style={{ marginTop: 10 }}>
                <strong>Fotografias</strong>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                  {(inf.fotografias ?? []).map((img, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid #e5e7eb', borderRadius: 8, padding: 6 }}>
                      <img src={renderPhotoSrc(img)} alt="Foto" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 6 }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '0.3' }} />
                      {!img.startsWith('data:') ? <span style={{ fontSize: 12, color: '#374151' }}>{img}</span> : null}
                      <Button variant="danger" onClick={() => removePhoto(idx, i)}>Remover</Button>
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
                        <Button type="button" variant="secondary" onClick={() => (document.getElementById(fileInputId) as HTMLInputElement)?.click()}>
                          Escolher ficheiros…
                        </Button>
                        <span style={{ color: '#6b7280', fontSize: 12 }}>Pode selecionar múltiplas imagens</span>
                      </>
                    )
                  })()}
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <strong>Infractores</strong>
                {(inf.infractors ?? []).length === 0 ? (
                  <div style={{ color: '#6b7280', margin: '6px 0 8px 0' }}>Sem infractores (opcional).</div>
                ) : null}
                {(inf.infractors ?? []).map((it: any, k: number) => (
                  <div key={k} style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap', border: '1px dashed #e5e7eb', padding: 8, borderRadius: 8, marginTop: 8 }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 200 }}>
                      <span style={{ fontSize: 13, color: '#374151' }}>Nome</span>
                      <input value={it.nome ?? ''} onChange={(e) => updateInfractor(idx, k, { nome: e.target.value })} placeholder="Nome" style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db' }} />
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 180 }}>
                      <span style={{ fontSize: 13, color: '#374151' }}>Documento</span>
                      <input value={it.nr_identificacao ?? ''} onChange={(e) => updateInfractor(idx, k, { nr_identificacao: e.target.value })} placeholder="Nr. identificação" style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db' }} />
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 200 }}>
                      <span style={{ fontSize: 13, color: '#374151' }}>Tipo de identificação</span>
                      <input value={it.tipo_identificacao ?? ''} onChange={(e) => updateInfractor(idx, k, { tipo_identificacao: e.target.value })} placeholder="BI, Passaporte…" style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db' }} />
                    </label>
                    <Button type="button" variant="danger" onClick={() => removeInfractor(idx, k)}>Remover</Button>
                  </div>
                ))}
                <div style={{ marginTop: 8 }}>
                  <Button type="button" variant="secondary" onClick={() => addInfractor(idx)}>Adicionar infractor</Button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
                <Button type="button" variant="danger" onClick={() => removeInf(idx)} disabled={infractions.length <= 1}>Remover infração</Button>
                {idx === infractions.length - 1 && (
                  <Button type="button" variant="secondary" onClick={addInf}>Adicionar infração</Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <Button variant="secondary" onClick={cancelar}>Voltar</Button>
        <Button onClick={submit} disabled={submitting}>{submitting ? 'A guardar…' : 'Guardar'}</Button>
      </div>
    </div>
  )
}
