import React, { useState } from 'react'
import { PRIMARY_COLOR, BORDER_COLOR } from '../../utils/theme'
import { useAuth } from '../../contexts/AuthContext'

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
  const { user, logout } = useAuth()
  const [expanded, setExpanded] = useState<Record<number, boolean>>(() => Object.fromEntries(groups.map((_, i) => [i, true])) as Record<number, boolean>)

  const iconForKey = (key: string) => {
    const k = key.toLowerCase()
    if (k.includes('dashboard')) return <IconHome />
    if (k.includes('ocorrencia')) return <IconPin />
    if (k.includes('infracao')) return <IconWarn />
    if (k.includes('infractor')) return <IconUser />
    if (k.includes('accoes') || k.includes('acao')) return <IconWrench />
    if (k.includes('instalacao') || k.includes('instalacoes') || k.includes('installation') || k.includes('cliente')) return <IconBuilding />
    if (k.includes('inspecc')) return <IconSearch />
    if (k.includes('sucataria') || k.includes('sucatarias')) return <IconBuilding />
    if (k.includes('utilizador') || k.includes('user')) return <IconUser />
    if (k.includes('config')) return <IconCog />
    if (k.includes('relatorio')) return <IconChart />
    if (k.includes('regiao')) return <IconMap />
    if (k.includes('asc')) return <IconBuilding />
    return <IconDot />
  }
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 10, height: 10, background: PRIMARY_COLOR, borderRadius: 999 }} />
          <strong>EDM</strong>
        </div>
        <button
          onClick={() => logout()}
          title="Terminar sessão"
          style={{ background: 'transparent', border: 'none', color: '#6b7280', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 8px', borderRadius: 8 }}
        >
          <IconLogout />
          <span style={{ fontSize: 13 }}>Terminar sessão</span>
        </button>
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
                      boxShadow: active ? `0 0 0 3px rgba(234,88,12,.1)` : undefined,
                      display: 'flex', alignItems: 'center', gap: 8
                    }}
                  >
                    {iconForKey(it.key)}
                    <span>{it.label}</span>
                  </button>
                )
              })}
            </nav>
          )}
        </div>
      ))}
      <div style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid ${BORDER_COLOR}`, color: '#6b7280', fontSize: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Utilizador</span>
          <span style={{ color: '#111827', fontWeight: 600 }}>{user?.name || user?.email || '—'}</span>
        </div>
      </div>
    </aside>
  )
}

function IconBase({ children }: { children: React.ReactNode }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {children}
    </svg>
  )
}
function IconHome() { return (
  <IconBase>
    <polyline points="2,8 8,3 14,8" /><rect x="4" y="8" width="8" height="6" rx="1" />
  </IconBase>
) }
function IconPin() { return (
  <IconBase>
    <path d="M8 2a4 4 0 0 1 4 4c0 3-4 8-4 8S4 9 4 6a4 4 0 0 1 4-4z" />
    <circle cx="8" cy="6" r="1.5" />
  </IconBase>
) }
function IconWarn() { return (
  <IconBase>
    <polygon points="8,2 14,14 2,14" /><line x1="8" y1="6" x2="8" y2="10" /><circle cx="8" cy="12.5" r="0.6" fill="currentColor" stroke="none" />
  </IconBase>
) }
function IconUser() { return (
  <IconBase>
    <circle cx="8" cy="6" r="3" /><path d="M3 14c2-3 8-3 10 0" />
  </IconBase>
) }
function IconWrench() { return (
  <IconBase>
    <path d="M3 13l5-5" />
    <circle cx="9" cy="9" r="2" />
  </IconBase>
) }
function IconBuilding() { return (
  <IconBase>
    <rect x="3" y="5" width="10" height="8" rx="1" />
    <line x1="6" y1="5" x2="6" y2="13" /><line x1="10" y1="5" x2="10" y2="13" />
  </IconBase>
) }
function IconSearch() { return (
  <IconBase>
    <circle cx="7" cy="7" r="4" /><line x1="10.5" y1="10.5" x2="14" y2="14" />
  </IconBase>
) }
function IconCog() { return (
  <IconBase>
    <circle cx="8" cy="8" r="2" />
    <path d="M8 3v2M8 11v2M3 8h2M11 8h2M4.2 4.2l1.4 1.4M10.4 10.4l1.4 1.4M11.8 4.2l-1.4 1.4M5.6 10.4l-1.4 1.4" />
  </IconBase>
) }
function IconChart() { return (
  <IconBase>
    <rect x="3" y="9" width="2" height="4" /><rect x="7" y="7" width="2" height="6" /><rect x="11" y="5" width="2" height="8" />
  </IconBase>
) }
function IconMap() { return (
  <IconBase>
    <polyline points="2,4 6,2 10,4 14,2 14,12 10,14 6,12 2,14 2,4" />
  </IconBase>
) }
function IconDot() { return (
  <IconBase>
    <circle cx="8" cy="8" r="2" />
  </IconBase>
) }
function IconLogout() { return (
  <IconBase>
    <path d="M6 3H3v10h3" /><path d="M10 11l3-3-3-3" /><path d="M13 8H6" />
  </IconBase>
) }
