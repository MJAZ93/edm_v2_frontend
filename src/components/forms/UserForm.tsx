import React, { useMemo, useState } from 'react'
import { Button } from '../ui/Button'

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
  const [values, setValues] = useState<UserFormValues>({
    name: initialValues?.name ?? '',
    username: initialValues?.username ?? '',
    email: initialValues?.email ?? '',
    password: '',
    type: initialValues?.type ?? undefined,
    type_id: initialValues?.type_id ?? ''
  })

  const title = useMemo(() => (mode === 'create' ? 'Criar utilizador' : 'Editar utilizador'), [mode])

  function update<K extends keyof UserFormValues>(key: K, val: UserFormValues[K]) {
    setValues((v) => ({ ...v, [key]: val }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!values.name || !values.username || !values.email) return
    const payload: UserFormValues = {
      name: values.name.trim(),
      username: values.username.trim(),
      email: values.email.trim(),
      type: values.type,
      type_id: values.type_id?.trim() || undefined,
      ...(mode === 'create' || values.password ? { password: values.password } : {})
    }
    onSubmit(payload)
  }

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

      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 13, color: '#374151' }}>Utilizador</span>
        <input
          required
          value={values.username}
          onChange={(e) => update('username', e.target.value)}
          placeholder="username"
          style={{ padding: 12, borderRadius: 8, border: '1px solid #d1d5db' }}
        />
      </label>

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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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
            <option value="PT">PT</option>
          </select>
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 13, color: '#374151' }}>ID do tipo (opcional)</span>
          <input
            value={values.type_id ?? ''}
            onChange={(e) => update('type_id', e.target.value)}
            placeholder="ID associado ao tipo"
            style={{ padding: 12, borderRadius: 8, border: '1px solid #d1d5db' }}
          />
        </label>
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

