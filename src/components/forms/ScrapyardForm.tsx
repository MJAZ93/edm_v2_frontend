import React, { useEffect, useMemo, useState } from 'react'
import { Button } from '../ui/Button'
import { MultiSelect } from '../ui/MultiSelect'
import { MapPicker } from '../ui/MapPicker'
import { useAuth } from '../../contexts/AuthContext'
import { ASCApi, MaterialApi, type ModelASC, type ModelMaterial } from '../../services'

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

export default function ScrapyardForm({
  mode,
  initialValues,
  submitting = false,
  error = null,
  onSubmit,
  onCancel,
}: Props) {
  const { getApiConfig, getAuthorizationHeaderValue } = useAuth()
  const [values, setValues] = useState<ScrapyardFormValues>({
    nome: initialValues?.nome ?? '',
    asc_id: initialValues?.asc_id ?? '',
    lat: initialValues?.lat ?? undefined,
    lng: initialValues?.lng ?? undefined,
    nivel_confianca: initialValues?.nivel_confianca ?? 50,
    material_ids: initialValues?.material_ids ?? [],
  })

  const [ascOptions, setAscOptions] = useState<Array<{ id: string; label: string }>>([])
  const [loadingAsc, setLoadingAsc] = useState(false)
  const [materialOptions, setMaterialOptions] = useState<Array<{ id: string; label: string }>>([])
  const [loadingMaterials, setLoadingMaterials] = useState(false)

  const title = useMemo(() => (mode === 'create' ? 'Criar sucataria' : 'Editar sucataria'), [mode])

  function update<K extends keyof ScrapyardFormValues>(key: K, value: ScrapyardFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!values.nome || !values.asc_id) return
    onSubmit({
      nome: values.nome.trim(),
      asc_id: values.asc_id || undefined,
      lat: values.lat == null || Number.isNaN(Number(values.lat)) ? undefined : Number(values.lat),
      lng: values.lng == null || Number.isNaN(Number(values.lng)) ? undefined : Number(values.lng),
      nivel_confianca: values.nivel_confianca == null || Number.isNaN(Number(values.nivel_confianca)) ? 50 : Number(values.nivel_confianca),
      material_ids: Array.isArray(values.material_ids) ? values.material_ids : [],
    })
  }

  useEffect(() => {
    let cancelled = false

    async function loadASCs() {
      setLoadingAsc(true)
      try {
        const api = new ASCApi(getApiConfig())
        const { data } = await api.privateAscsGet(getAuthorizationHeaderValue(), -1, undefined, 'name', 'asc')
        const items = (data.items ?? []) as ModelASC[]
        if (!cancelled) {
          setAscOptions(items.filter((item) => item.id && item.name).map((item) => ({ id: String(item.id), label: String(item.name) })))
        }
      } catch {
        if (!cancelled) setAscOptions([])
      } finally {
        if (!cancelled) setLoadingAsc(false)
      }
    }

    async function loadMaterials() {
      setLoadingMaterials(true)
      try {
        const api = new MaterialApi(getApiConfig())
        const { data } = await api.privateMateriaisGet(getAuthorizationHeaderValue(), -1, undefined, 'name', 'asc')
        const items = (data.items ?? []) as ModelMaterial[]
        if (!cancelled) {
          setMaterialOptions(items.filter((item) => item.id && item.name).map((item) => ({ id: String(item.id), label: String(item.name) })))
        }
      } catch {
        if (!cancelled) setMaterialOptions([])
      } finally {
        if (!cancelled) setLoadingMaterials(false)
      }
    }

    loadASCs()
    loadMaterials()
    return () => { cancelled = true }
  }, [getApiConfig, getAuthorizationHeaderValue])

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <strong style={{ color: '#1f2937', fontSize: 18 }}>{title}</strong>
        <span style={{ color: '#5f6673', lineHeight: 1.6 }}>
          Preencha os dados principais da sucataria, materiais associados e localização no mapa.
        </span>
      </div>

      {error ? <div style={errorBannerStyle}>{error}</div> : null}

      <div style={formGridStyle}>
        <label style={{ ...fieldGroupStyle, gridColumn: '1 / -1' }}>
          <span style={fieldLabelStyle}>Nome</span>
          <input
            required
            value={values.nome}
            onChange={(e) => update('nome', e.target.value)}
            placeholder="Nome da sucataria"
            style={fieldControlStyle}
          />
        </label>

        <label style={fieldGroupStyle}>
          <span style={fieldLabelStyle}>ASC</span>
          <select
            required
            value={values.asc_id ?? ''}
            onChange={(e) => update('asc_id', e.target.value)}
            style={fieldControlStyle}
          >
            <option value="">{loadingAsc ? 'A carregar…' : ascOptions.length ? 'Selecionar' : 'Sem resultados'}</option>
            {ascOptions.map((option) => (
              <option key={option.id} value={option.id}>{option.label}</option>
            ))}
          </select>
        </label>

        <label style={fieldGroupStyle}>
          <span style={fieldLabelStyle}>Latitude</span>
          <input
            type="number"
            step="any"
            inputMode="decimal"
            value={values.lat ?? ''}
            onChange={(e) => update('lat', e.target.value === '' ? undefined : Number(e.target.value))}
            placeholder="-25.965"
            style={fieldControlStyle}
          />
        </label>

        <label style={fieldGroupStyle}>
          <span style={fieldLabelStyle}>Longitude</span>
          <input
            type="number"
            step="any"
            inputMode="decimal"
            value={values.lng ?? ''}
            onChange={(e) => update('lng', e.target.value === '' ? undefined : Number(e.target.value))}
            placeholder="32.571"
            style={fieldControlStyle}
          />
        </label>

        <div style={{ ...fieldGroupStyle, gridColumn: '1 / -1' }}>
          <span style={fieldLabelStyle}>Materiais</span>
          <MultiSelect
            options={materialOptions}
            value={values.material_ids ?? []}
            onChange={(ids) => update('material_ids', ids)}
            placeholder={loadingMaterials ? 'A carregar…' : 'Selecionar…'}
            searchPlaceholder="Procurar materiais…"
            noResultsText="Sem materiais"
            disabled={loadingMaterials}
          />
          <span style={helperTextStyle}>Pode pesquisar e selecionar múltiplos materiais associados à sucataria.</span>
        </div>

        <div style={{ ...fieldGroupStyle, gridColumn: '1 / -1' }}>
          <span style={fieldLabelStyle}>Localização no mapa</span>
          <div style={mapPanelStyle}>
            <MapPicker
              markerKind="scrapyard"
              value={{ lat: values.lat ?? -25.965, lng: values.lng ?? 32.571 }}
              onChange={(pos) => setValues((current) => ({ ...current, lat: pos.lat, lng: pos.lng }))}
              height={320}
            />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
        {onCancel ? (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={submitting}
            style={secondaryActionButtonStyle}
          >
            Cancelar
          </Button>
        ) : null}
        <Button type="submit" disabled={submitting} style={primaryActionButtonStyle}>
          {submitting ? 'A guardar…' : 'Guardar'}
        </Button>
      </div>
    </form>
  )
}

const formGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 14,
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
  minHeight: 48,
  padding: '0 14px',
  borderRadius: 14,
  border: '1px solid rgba(101, 74, 32, 0.14)',
  background: '#fffdf9',
  color: '#1f2937',
  boxShadow: '0 10px 24px rgba(101, 74, 32, 0.05)',
}

const mapPanelStyle: React.CSSProperties = {
  borderRadius: 20,
  overflow: 'hidden',
  border: '1px solid rgba(101, 74, 32, 0.12)',
  background: '#fffdf8',
}

const helperTextStyle: React.CSSProperties = {
  color: '#7b8494',
  fontSize: 12,
  fontWeight: 600,
}

const errorBannerStyle: React.CSSProperties = {
  padding: '12px 14px',
  borderRadius: 16,
  background: '#fff1f1',
  border: '1px solid rgba(200, 60, 60, 0.18)',
  color: '#991b1b',
  fontWeight: 700,
}

const secondaryActionButtonStyle: React.CSSProperties = {
  minHeight: 44,
  padding: '0 18px',
  borderRadius: 16,
  border: '1px solid rgba(101, 74, 32, 0.16)',
  background: 'linear-gradient(180deg, #fffaf2 0%, #f6ecde 100%)',
  color: '#8d4a17',
  fontWeight: 800,
  boxShadow: '0 10px 24px rgba(76, 57, 24, 0.08)',
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
}
