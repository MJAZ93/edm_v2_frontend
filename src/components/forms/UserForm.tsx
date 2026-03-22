import React, { useEffect, useMemo, useState } from 'react'
import { Button } from '../ui/Button'
import { fieldLabelStyle, inputStyle, stackedFieldStyle } from '../ui/ManagementUI'
import { ASCApi, RegiaoApi, type ModelASC, type ModelRegiao } from '../../services'
import { useAuth } from '../../contexts/AuthContext'

export type UserFormValues = {
  name: string
  username: string
  email: string
  password?: string
  type?: string
  type_id?: string
}

type Props = {
  mode: 'create' | 'edit'
  initialValues?: Partial<UserFormValues>
  submitting?: boolean
  error?: string | null
  onSubmit: (values: UserFormValues) => void
  onCancel?: () => void
}

export default function UserForm({ mode, initialValues, submitting = false, error = null, onSubmit, onCancel }: Props) {
  const { getApiConfig, getAuthorizationHeaderValue } = useAuth()
  const [values, setValues] = useState<UserFormValues>({
    name: initialValues?.name ?? '',
    username: initialValues?.username ?? '',
    email: initialValues?.email ?? '',
    password: '',
    type: initialValues?.type ?? undefined,
    type_id: initialValues?.type_id ?? ''
  })
  const [options, setOptions] = useState<Array<{ id: string; label: string }>>([])
  const [loadingOptions, setLoadingOptions] = useState(false)

  const subtitle = useMemo(
    () => mode === 'create'
      ? 'Preencha apenas os dados necessários para criar a conta.'
      : 'Atualize os dados do utilizador e altere a palavra-passe apenas se necessário.',
    [mode]
  )

  function update<K extends keyof UserFormValues>(key: K, value: UserFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  useEffect(() => {
    if (mode !== 'create') return
    if (values.username && values.username.trim().length > 0) return
    const generateUuid = () => {
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
        const random = (Math.random() * 16) | 0
        const value = char === 'x' ? random : (random & 0x3) | 0x8
        return value.toString(16)
      })
    }
    setValues((current) => ({ ...current, username: generateUuid() }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!values.name.trim() || !values.email.trim()) return
    onSubmit({
      name: values.name.trim(),
      username: values.username.trim(),
      email: values.email.trim(),
      type: values.type,
      type_id: values.type_id?.trim() || undefined,
      ...(mode === 'create' || values.password ? { password: values.password } : {}),
    })
  }

  useEffect(() => {
    setOptions([])
    setValues((current) => ({ ...current, type_id: '' }))
  }, [values.type])

  useEffect(() => {
    let cancelled = false

    async function loadOptions() {
      if (!values.type || (values.type !== 'ASC' && values.type !== 'REGIAO')) return
      setLoadingOptions(true)
      try {
        const apiConfig = getApiConfig()
        const authHeader = getAuthorizationHeaderValue()
        if (values.type === 'ASC') {
          const api = new ASCApi(apiConfig)
          const { data } = await api.privateAscsGet(authHeader, -1, undefined, 'name', 'asc')
          const items = (data.items ?? []) as ModelASC[]
          if (!cancelled) {
            setOptions(items.filter((item) => item.id && item.name).map((item) => ({ id: String(item.id), label: item.name || '' })))
          }
        } else {
          const api = new RegiaoApi(apiConfig)
          const { data } = await api.privateRegioesGet(authHeader, -1, undefined, 'name', 'asc')
          const items = (data.items ?? []) as ModelRegiao[]
          if (!cancelled) {
            setOptions(items.filter((item) => item.id && item.name).map((item) => ({ id: String(item.id), label: item.name || '' })))
          }
        }
      } catch {
        if (!cancelled) setOptions([])
      } finally {
        if (!cancelled) setLoadingOptions(false)
      }
    }

    loadOptions()
    return () => {
      cancelled = true
    }
  }, [values.type, getApiConfig, getAuthorizationHeaderValue])

  return (
    <form onSubmit={handleSubmit} style={formStyle}>
      <p style={subtitleStyle}>{subtitle}</p>

      {error ? <div style={errorBannerStyle}>{error}</div> : null}

      <div style={formGridStyle}>
        <label style={stackedFieldStyle}>
          <span style={fieldLabelStyle}>Nome</span>
          <input
            required
            value={values.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder="Nome completo"
            style={inputStyle}
          />
        </label>

        <label style={stackedFieldStyle}>
          <span style={fieldLabelStyle}>Email</span>
          <input
            required
            type="email"
            value={values.email}
            onChange={(e) => update('email', e.target.value)}
            placeholder="utilizador@exemplo.com"
            autoComplete="email"
            style={inputStyle}
          />
        </label>

        <label style={stackedFieldStyle}>
          <span style={fieldLabelStyle}>Perfil</span>
          <select
            value={values.type ?? ''}
            onChange={(e) => update('type', e.target.value || undefined)}
            style={inputStyle}
          >
            <option value="">Selecionar perfil</option>
            <option value="SUPER_ADMIN">Super administrador</option>
            <option value="PAIS">País</option>
            <option value="REGIAO">Região</option>
            <option value="ASC">ASC</option>
            {mode === 'edit' ? <option value="PT">PT</option> : null}
          </select>
        </label>

        <label style={stackedFieldStyle}>
          <span style={fieldLabelStyle}>Palavra-passe{mode === 'edit' ? ' (opcional)' : ''}</span>
          <input
            type="password"
            value={values.password ?? ''}
            onChange={(e) => update('password', e.target.value)}
            placeholder={mode === 'create' ? 'Defina uma palavra-passe segura' : 'Deixe em branco para manter a atual'}
            autoComplete={mode === 'create' ? 'new-password' : 'current-password'}
            style={inputStyle}
          />
        </label>

        {(values.type === 'ASC' || values.type === 'REGIAO') ? (
          <label style={{ ...stackedFieldStyle, gridColumn: '1 / -1' }}>
            <span style={fieldLabelStyle}>{values.type === 'ASC' ? 'ASC associada' : 'Região associada'}</span>
            <select
              value={values.type_id ?? ''}
              onChange={(e) => update('type_id', e.target.value)}
              style={inputStyle}
            >
              <option value="">
                {loadingOptions ? 'A carregar opções…' : options.length ? 'Selecionar opção' : 'Sem resultados disponíveis'}
              </option>
              {options.map((option) => (
                <option key={option.id} value={option.id}>{option.label}</option>
              ))}
            </select>
            <span style={helperTextStyle}>Associe a conta ao respetivo âmbito operacional.</span>
          </label>
        ) : null}
      </div>

      <div style={footerStyle}>
        {onCancel ? (
          <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting} style={secondaryActionButtonStyle}>
            Cancelar
          </Button>
        ) : null}
        <Button type="submit" loading={submitting} disabled={submitting} style={primaryActionButtonStyle}>
          {mode === 'create' ? 'Criar utilizador' : 'Guardar alterações'}
        </Button>
      </div>
    </form>
  )
}

const formStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 18,
}

const subtitleStyle: React.CSSProperties = {
  margin: 0,
  color: '#64748b',
  lineHeight: 1.6,
}

const errorBannerStyle: React.CSSProperties = {
  padding: '12px 14px',
  borderRadius: 16,
  border: '1px solid rgba(220, 38, 38, 0.18)',
  background: 'rgba(254, 226, 226, 0.92)',
  color: '#991b1b',
}

const formGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 16,
}

const helperTextStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#64748b',
  lineHeight: 1.5,
}

const footerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 8,
  flexWrap: 'wrap',
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
}

const primaryActionButtonStyle: React.CSSProperties = {
  minHeight: 42,
  padding: '0 18px',
  borderRadius: 14,
  background: 'linear-gradient(180deg, #cf711f 0%, #a95516 100%)',
  border: '1px solid rgba(141, 74, 23, 0.24)',
  color: '#fffaf2',
  fontWeight: 800,
  boxShadow: '0 12px 24px rgba(141, 74, 23, 0.18)',
}
