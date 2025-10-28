import React, { useEffect, useMemo, useState } from 'react'
import { Button } from '../ui/Button'
import { ASCApi, MaterialApi, type ModelASC, type ModelMaterial } from '../../services'
import { useAuth } from '../../contexts/AuthContext'
import { MapPicker } from '../ui/MapPicker'
import { MultiSelect } from '../ui/MultiSelect'

export type ScrapyardFormValues = {
  nome: string
  asc_id?: string
  lat?: number
  lng?: number
  nivel_confianca?: number
  material_ids?: string[]
}

type Props = {
  mode: 'create' | 'edit'
  initialValues?: Partial<ScrapyardFormValues>
  submitting?: boolean
  error?: string | null
  onSubmit: (values: ScrapyardFormValues) => void
  onCancel?: () => void
}

export default function ScrapyardForm({ mode, initialValues, submitting = false, error = null, onSubmit, onCancel }: Props) {
  const { getApiConfig, getAuthorizationHeaderValue } = useAuth()
  const [values, setValues] = useState<ScrapyardFormValues>({
    nome: initialValues?.nome ?? '',
    asc_id: initialValues?.asc_id ?? '',
    lat: initialValues?.lat ?? undefined,
    lng: initialValues?.lng ?? undefined,
    nivel_confianca: initialValues?.nivel_confianca ?? 50,
    material_ids: initialValues?.material_ids ?? []
  })

  const [ascOptions, setAscOptions] = useState<Array<{ id: string; label: string }>>([])
  const [loadingAsc, setLoadingAsc] = useState(false)
  const [materialOptions, setMaterialOptions] = useState<Array<{ id: string; label: string }>>([])
  const [loadingMaterials, setLoadingMaterials] = useState(false)

  const title = useMemo(() => (mode === 'create' ? 'Criar sucataria' : 'Editar sucataria'), [mode])

  function update<K extends keyof ScrapyardFormValues>(key: K, val: ScrapyardFormValues[K]) {
    setValues((v) => ({ ...v, [key]: val }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!values.nome || !values.asc_id) return
    const payload: ScrapyardFormValues = {
      nome: values.nome.trim(),
      asc_id: values.asc_id || undefined,
      lat: values.lat === undefined || values.lat === null || Number.isNaN(Number(values.lat)) ? undefined : Number(values.lat),
      lng: values.lng === undefined || values.lng === null || Number.isNaN(Number(values.lng)) ? undefined : Number(values.lng),
      nivel_confianca:
        values.nivel_confianca === undefined || values.nivel_confianca === null || Number.isNaN(Number(values.nivel_confianca))
          ? 50
          : Number(values.nivel_confianca),
      material_ids: Array.isArray(values.material_ids) ? values.material_ids : []
    }
    onSubmit(payload)
  }

  // Carrega lista de ASCs (page = -1) uma vez ao montar
  useEffect(() => {
    let cancelled = false
    async function loadASCs() {
      setLoadingAsc(true)
      try {
        const api = new ASCApi(getApiConfig())
        const { data } = await api.privateAscsGet(getAuthorizationHeaderValue(), -1, undefined, 'name', 'asc')
        const items = (data.items ?? []) as ModelASC[]
        if (!cancelled) setAscOptions(items.filter((i) => i.id && i.name).map((i) => ({ id: String(i.id), label: `${i.name}` })))
      } catch {
        if (!cancelled) setAscOptions([])
      } finally {
        if (!cancelled) setLoadingAsc(false)
      }
    }
    loadASCs()
    async function loadMaterials() {
      setLoadingMaterials(true)
      try {
        const api = new MaterialApi(getApiConfig())
        const { data } = await api.privateMateriaisGet(getAuthorizationHeaderValue(), -1, undefined, 'name', 'asc')
        const items = (data.items ?? []) as ModelMaterial[]
        if (!cancelled) setMaterialOptions(items.filter((i) => i.id && i.name).map((i) => ({ id: String(i.id), label: `${i.name}` })))
      } catch {
        if (!cancelled) setMaterialOptions([])
      } finally {
        if (!cancelled) setLoadingMaterials(false)
      }
    }
    loadMaterials()
    return () => {
      cancelled = true
    }
  }, [getApiConfig, getAuthorizationHeaderValue])

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 360 }}>
      <h3 style={{ margin: 0 }}>{title}</h3>
      {error ? (
        <div style={{ background: '#fee2e2', color: '#991b1b', padding: 10, borderRadius: 8 }}>{error}</div>
      ) : null}

      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 13, color: '#374151' }}>Nome</span>
        <input
          required
          value={values.nome}
          onChange={(e) => update('nome', e.target.value)}
          placeholder="Nome da sucataria"
          style={{ padding: 12, borderRadius: 8, border: '1px solid #d1d5db' }}
        />
      </label>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 13, color: '#374151' }}>ASC</span>
          <select
            required
            value={values.asc_id ?? ''}
            onChange={(e) => update('asc_id', e.target.value)}
            style={{ padding: 12, borderRadius: 8, border: '1px solid #d1d5db', background: '#fff' }}
          >
            <option value="">— {loadingAsc ? 'A carregar…' : ascOptions.length ? 'Selecionar' : 'Sem resultados'} —</option>
            {ascOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>{opt.label}</option>
            ))}
          </select>
        </label>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, color: '#374151' }}>Latitude (opcional)</span>
            <input
              type="number"
              step="any"
              inputMode="decimal"
              value={values.lat ?? ''}
              onChange={(e) => update('lat', e.target.value === '' ? undefined : Number(e.target.value))}
              placeholder="-25.965"
              style={{ padding: 12, borderRadius: 8, border: '1px solid #d1d5db' }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, color: '#374151' }}>Longitude (opcional)</span>
            <input
              type="number"
              step="any"
              inputMode="decimal"
              value={values.lng ?? ''}
              onChange={(e) => update('lng', e.target.value === '' ? undefined : Number(e.target.value))}
              placeholder="32.571"
              style={{ padding: 12, borderRadius: 8, border: '1px solid #d1d5db' }}
            />
          </label>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 13, color: '#374151' }}>Materiais (opcional)</span>
          <MultiSelect
            options={materialOptions}
            value={values.material_ids ?? []}
            onChange={(ids) => update('material_ids', ids)}
            placeholder={loadingMaterials ? 'A carregar…' : 'Selecionar…'}
            searchPlaceholder="Procurar materiais…"
            noResultsText="Sem materiais"
            disabled={loadingMaterials}
          />
          <span style={{ color: '#6b7280', fontSize: 12 }}>Pode pesquisar e selecionar múltiplos.</span>
        </div>

        {/* Campo de nível de desconfiança oculto; valor por omissão = 50 */}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 13, color: '#374151' }}>Localização no mapa (opcional)</span>
          <MapPicker
            value={{ lat: values.lat ?? -25.965, lng: values.lng ?? 32.571 }}
            onChange={(pos) => {
              setValues((v) => ({ ...v, lat: pos.lat, lng: pos.lng }))
            }}
            height={300}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'A guardar…' : 'Guardar'}
        </Button>
        {onCancel ? (
          <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
            Cancelar
          </Button>
        ) : null}
      </div>
    </form>
  )
}
