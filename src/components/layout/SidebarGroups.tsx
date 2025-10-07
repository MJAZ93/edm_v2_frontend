import React, { useState } from 'react'
import { PRIMARY_COLOR, BORDER_COLOR } from '../../utils/theme'

type MenuItem = {
  key: string
  label: string
}

type Group = {
  label: string
  items: MenuItem[]
}

type Props = {
  groups: Group[]
  activeKey: string
  onSelect: (key: string) => void
}

export function SidebarGroups({ groups, activeKey, onSelect }: Props) {
  const [expanded, setExpanded] = useState<Record<number, boolean>>(() => Object.fromEntries(groups.map((_, i) => [i, true])) as Record<number, boolean>)
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
      {groups.map((g, idx) => (
        <div key={idx} style={{ marginBottom: 8 }}>
          <button
            onClick={() => setExpanded((prev) => ({ ...prev, [idx]: !prev[idx] }))}
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
            <span>{g.label}</span>
            <span aria-hidden style={{ transform: expanded[idx] ? 'rotate(90deg)' : 'rotate(0deg)' }}>›</span>
          </button>
          {expanded[idx] && (
            <nav aria-label={g.label} style={{ marginTop: 8 }}>
              {g.items.map((it) => {
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
        </div>
      ))}
    </aside>
  )
}

