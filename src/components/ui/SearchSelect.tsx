import React, { useEffect, useMemo, useRef, useState } from 'react'

export type SearchOption = { id: string; label: string }

type Props = {
  options: SearchOption[]
  value?: string
  onChange: (id: string | undefined) => void
  placeholder?: string
  searchPlaceholder?: string
  noResultsText?: string
  disabled?: boolean
  maxDropdownHeight?: number
}

export function SearchSelect({
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

  const selectedLabel = useMemo(() => options.find((o) => o.id === value)?.label, [options, value])
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

  useEffect(() => { if (open) inputRef.current?.focus() }, [open])

  function select(id: string) {
    if (disabled) return
    onChange(id)
    setOpen(false)
  }

  function clear() {
    if (disabled) return
    onChange(undefined)
    setOpen(false)
  }

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
          color: !selectedLabel ? '#9ca3af' : '#111827',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
        title={selectedLabel || placeholder}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedLabel || placeholder}</span>
        <span aria-hidden style={{ color: '#6b7280' }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && !disabled && (
        <div
          role="listbox"
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
            <button type="button" onClick={clear} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer' }}>
              Limpar
            </button>
          </div>
          <div style={{ maxHeight: maxDropdownHeight, overflowY: 'auto', padding: 6 }}>
            {filtered.length === 0 ? (
              <div style={{ padding: 10, color: '#6b7280' }}>{noResultsText}</div>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => select(opt.id)}
                  style={{ width: '100%', textAlign: 'left', padding: '6px 8px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                >
                  <span style={{ color: '#111827' }}>{opt.label}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

