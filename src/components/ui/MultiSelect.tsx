import React, { useEffect, useMemo, useRef, useState } from 'react'

export type MultiOption = { id: string; label: string }

type Props = {
  options: MultiOption[]
  value: string[]
  onChange: (next: string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  noResultsText?: string
  disabled?: boolean
  maxDropdownHeight?: number
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = 'Selecionar…',
  searchPlaceholder = 'Procurar…',
  noResultsText = 'Sem resultados',
  disabled = false,
  maxDropdownHeight = 220,
}: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const map = useMemo(() => new Map(options.map((o) => [o.id, o.label])), [options])
  const selected = useMemo(() => value.map((id) => ({ id, label: map.get(id) || id })), [value, map])
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter((o) => o.label.toLowerCase().includes(q))
  }, [options, query])

  useEffect(() => {
    function handleDocClick(e: MouseEvent) {
      if (!containerRef.current) return
      if (containerRef.current.contains(e.target as Node)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handleDocClick)
    return () => document.removeEventListener('mousedown', handleDocClick)
  }, [])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  function toggle(id: string) {
    if (disabled) return
    const set = new Set(value)
    if (set.has(id)) set.delete(id)
    else set.add(id)
    onChange(Array.from(set))
  }

  function clearAll() {
    if (disabled) return
    onChange([])
  }

  function selectAllVisible() {
    if (disabled) return
    const ids = new Set(value)
    filtered.forEach((o) => ids.add(o.id))
    onChange(Array.from(ids))
  }

  const summaryLabel = useMemo(() => {
    if (selected.length === 0) return placeholder
    if (selected.length <= 2) return selected.map((s) => s.label).join(', ')
    return `${selected.length} selecionados`
  }, [selected, placeholder])

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{
          width: '100%',
          textAlign: 'left',
          padding: '10px 12px',
          borderRadius: 8,
          border: '1px solid #d1d5db',
          background: disabled ? '#f9fafb' : '#fff',
          color: selected.length === 0 ? '#9ca3af' : '#111827',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
        title={selected.length ? selected.map((s) => s.label).join(', ') : placeholder}
     >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{summaryLabel}</span>
        <span aria-hidden style={{ color: '#6b7280' }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && !disabled && (
        <div
          role="listbox"
          aria-multiselectable="true"
          style={{
            position: 'absolute',
            zIndex: 20,
            marginTop: 6,
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
            width: '100%',
          }}
        >
          <div style={{ padding: 8, borderBottom: '1px solid #f3f4f6', display: 'flex', gap: 8 }}>
            <input
              ref={inputRef}
              placeholder={searchPlaceholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid #e5e7eb' }}
            />
            <button type="button" onClick={selectAllVisible} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer' }}>
              Selecionar visíveis
            </button>
            <button type="button" onClick={clearAll} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer' }}>
              Limpar
            </button>
          </div>
          <div style={{ maxHeight: maxDropdownHeight, overflowY: 'auto', padding: 6 }}>
            {filtered.length === 0 ? (
              <div style={{ padding: 10, color: '#6b7280' }}>{noResultsText}</div>
            ) : (
              filtered.map((opt) => {
                const checked = value.includes(opt.id)
                return (
                  <label key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(opt.id)}
                      style={{ width: 16, height: 16 }}
                    />
                    <span style={{ color: '#111827' }}>{opt.label}</span>
                  </label>
                )
              })
            )}
          </div>
          {selected.length > 0 && (
            <div style={{ borderTop: '1px solid #f3f4f6', padding: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {selected.slice(0, 6).map((s) => (
                <span key={s.id} style={{ background: '#eff6ff', color: '#1d4ed8', padding: '4px 8px', borderRadius: 999, fontSize: 12 }}>{s.label}</span>
              ))}
              {selected.length > 6 && <span style={{ color: '#6b7280', fontSize: 12 }}>+{selected.length - 6}</span>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

