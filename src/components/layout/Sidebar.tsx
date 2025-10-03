import React, { useState } from 'react'
import { PRIMARY_COLOR, BORDER_COLOR } from '../../utils/theme'

type MenuItem = {
  key: string
  label: string
}

type Props = {
  groupLabel: string
  items: MenuItem[]
  activeKey: string
  onSelect: (key: string) => void
}

export function Sidebar({ groupLabel, items, activeKey, onSelect }: Props) {
  const [expanded, setExpanded] = useState(true)
  return (
    <aside
      style={{
        width: 280,
        borderRight: `1px solid ${BORDER_COLOR}`,
        minHeight: '100vh',
        padding: 16,
        position: 'sticky',
        top: 0,
        background: '#fff'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <span style={{ width: 10, height: 10, background: PRIMARY_COLOR, borderRadius: 999 }} />
        <strong>EDM</strong>
      </div>
      <button
        onClick={() => setExpanded((v) => !v)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'transparent',
          border: 'none',
          color: '#374151',
          padding: '10px 8px',
          fontWeight: 600,
          cursor: 'pointer'
        }}
      >
        <span>{groupLabel}</span>
        <span aria-hidden style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>›</span>
      </button>
      {expanded && (
        <nav aria-label={groupLabel} style={{ marginTop: 8 }}>
          {items.map((it) => {
            const active = it.key === activeKey
            return (
              <button
                key={it.key}
                onClick={() => onSelect(it.key)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  background: active ? '#fff1e6' : 'transparent',
                  border: `1px solid ${active ? PRIMARY_COLOR : 'transparent'}`,
                  color: active ? '#111827' : '#374151',
                  padding: '10px 10px',
                  borderRadius: 10,
                  marginBottom: 4,
                  cursor: 'pointer',
                  outline: 'none',
                  boxShadow: active ? `0 0 0 3px rgba(234,88,12,.1)` : undefined
                }}
              >
                {it.label}
              </button>
            )
          })}
        </nav>
      )}
    </aside>
  )
}
