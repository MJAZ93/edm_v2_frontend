import React, { useEffect, useMemo, useState } from 'react'
import { Button } from '../ui/Button'
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

  // Estado para combobox de ID (ASC/Região)
  const [options, setOptions] = useState<Array<{ id: string; label: string }>>([])
  const [loadingOptions, setLoadingOptions] = useState(false)
  // Nota: obter config/token apenas quando necessário para evitar re-render loops

  const title = useMemo(() => (mode === 'create' ? 'Criar utilizador' : 'Editar utilizador'), [mode])

  function update<K extends keyof UserFormValues>(key: K, val: UserFormValues[K]) {
    setValues((v) => ({ ...v, [key]: val }))
  }

  // Gera username UUID automaticamente no modo criação, se estiver vazio
  useEffect(() => {
    if (mode !== 'create') return
    if (values.username && values.username.trim().length > 0) return
    const gen = () => {
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
      // Fallback simples para UUID v4
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0
        const v = c === 'x' ? r : (r & 0x3) | 0x8
        return v.toString(16)
      })
    }
    setValues((v) => ({ ...v, username: gen() }))
  // Apenas na montagem/primeira renderização de criação
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!values.name || !values.email) return
    const payload: UserFormValues = {
      name: values.name.trim(),
      username: (values.username ?? '').trim(),
      email: values.email.trim(),
      type: values.type,
      // Quando o tipo requer ID mas não há seleção válida, envia vazio
      type_id: values.type_id?.trim() || undefined,
      ...(mode === 'create' || values.password ? { password: values.password } : {})
    }
    onSubmit(payload)
  }

  // Limpa ID ao mudar o tipo
  useEffect(() => {
    setOptions([])
    // Se mudar o tipo, limpa o ID selecionado
    setValues((v) => ({ ...v, type_id: '' }))
  }, [values.type])

  // Carrega opções (ASC/Região) quando type é ASC ou REGIAO, trazendo tudo (page = -1)
  useEffect(() => {
    let cancelled = false
    async function load() {
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
            setOptions(items.filter((i) => i.id && i.name).map((i) => ({ id: String(i.id), label: `${i.name}` })))
          }
        } else if (values.type === 'REGIAO') {
          const api = new RegiaoApi(apiConfig)
          const { data } = await api.privateRegioesGet(authHeader, -1, undefined, 'name', 'asc')
          const items = (data.items ?? []) as ModelRegiao[]
          if (!cancelled) {
            setOptions(items.filter((i) => i.id && i.name).map((i) => ({ id: String(i.id), label: `${i.name}` })))
          }
        }
      } catch {
        if (!cancelled) setOptions([])
      } finally {
        if (!cancelled) setLoadingOptions(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [values.type, getApiConfig, getAuthorizationHeaderValue])

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
          value={values.name}
          onChange={(e) => update('name', e.target.value)}
          placeholder="Nome completo"
          style={{ padding: 12, borderRadius: 8, border: '1px solid #d1d5db' }}
        />
      </label>

      {/* Campo de Utilizador oculto: username é gerado automaticamente (UUID) no modo criação */}

      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 13, color: '#374151' }}>Email</span>
        <input
          required
          type="email"
          value={values.email}
          onChange={(e) => update('email', e.target.value)}
          placeholder="utilizador@exemplo.com"
          style={{ padding: 12, borderRadius: 8, border: '1px solid #d1d5db' }}
        />
      </label>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 13, color: '#374151' }}>Palavra‑passe{mode === 'edit' ? ' (opcional)' : ''}</span>
        <input
          type="password"
          value={values.password ?? ''}
          onChange={(e) => update('password', e.target.value)}
          placeholder={mode === 'create' ? '••••••••' : 'Deixe em branco para manter'}
          style={{ padding: 12, borderRadius: 8, border: '1px solid #d1d5db' }}
        />
      </label>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 13, color: '#374151' }}>Tipo</span>
          <select
            value={values.type ?? ''}
            onChange={(e) => update('type', e.target.value || undefined)}
            style={{ padding: 12, borderRadius: 8, border: '1px solid #d1d5db', background: '#fff' }}
          >
            <option value="">— Selecionar —</option>
            <option value="SUPER_ADMIN">SUPER_ADMIN</option>
            <option value="PAIS">PAIS</option>
            <option value="REGIAO">REGIAO</option>
            <option value="ASC">ASC</option>
            {/* Ocultar PT na criação */}
            {mode === 'edit' ? <option value="PT">PT</option> : null}
          </select>
        </label>

        {/* Campo de ID/Combobox: mostra procura + seleção quando tipo for ASC/REGIAO; caso contrário, campo simples opcional */}
        {values.type === 'ASC' || values.type === 'REGIAO' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, color: '#374151' }}>
              {values.type === 'ASC' ? 'ASC: selecionar' : 'Região: selecionar'}
            </span>
            <select
              value={values.type_id ?? ''}
              onChange={(e) => update('type_id', e.target.value)}
              style={{ padding: 12, borderRadius: 8, border: '1px solid #d1d5db', background: '#fff' }}
            >
              <option value="">— {loadingOptions ? 'A carregar…' : options.length ? 'Selecionar' : 'Sem resultados'} —</option>
              {options.map((opt) => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>
            <span style={{ fontSize: 12, color: '#6b7280' }}>Se não selecionar, o ID será enviado em branco.</span>
          </div>
        ) : null}
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
