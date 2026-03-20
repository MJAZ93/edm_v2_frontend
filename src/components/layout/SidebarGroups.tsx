import React, { useState } from 'react'
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
  const [expanded, setExpanded] = useState<Record<number, boolean>>(
    () => Object.fromEntries(groups.map((_, index) => [index, true])) as Record<number, boolean>
  )

  const displayName = user?.name || user?.email || 'Utilizador'
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'ED'

  const iconForKey = (key: string) => {
    const normalized = key.toLowerCase()
    if (normalized.includes('dashboard')) return <IconHome />
    if (normalized.includes('ocorrencia')) return <IconPin />
    if (normalized.includes('infracao')) return <IconWarn />
    if (normalized.includes('infractor')) return <IconUser />
    if (normalized.includes('accoes') || normalized.includes('acao')) return <IconWrench />
    if (normalized.includes('instalacao') || normalized.includes('instalacoes') || normalized.includes('cliente')) return <IconBuilding />
    if (normalized.includes('inspecc')) return <IconSearch />
    if (normalized.includes('sucataria')) return <IconFactory />
    if (normalized.includes('utilizador') || normalized.includes('user')) return <IconUser />
    if (normalized.includes('config')) return <IconCog />
    if (normalized.includes('relatorio')) return <IconChart />
    if (normalized.includes('regiao')) return <IconMap />
    if (normalized.includes('asc')) return <IconCompass />
    return <IconDot />
  }

  return (
    <div className="private-sidebar">
      <div className="private-sidebar__brand">
        <div className="private-sidebar__brand-mark">
          <img src="/images/logo.png" alt="EDM" />
        </div>

        <div style={{ minWidth: 0 }}>
          <div className="private-sidebar__eyebrow">Área privada</div>
          <div className="private-sidebar__title">Sistema EDM</div>
          <div className="private-sidebar__subtitle">Monitorização operacional</div>
        </div>
      </div>

      <div className="private-sidebar__panel">
        <div className="private-sidebar__user">
          <div className="private-sidebar__avatar">{initials}</div>
          <div style={{ minWidth: 0 }}>
            <div className="private-sidebar__user-name">{displayName}</div>
            <div className="private-sidebar__user-role">{user?.email || 'Sessão ativa'}</div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => logout()}
          className="private-sidebar__logout"
        >
          <IconLogout />
          <span>Terminar sessão</span>
        </button>
      </div>

      <div className="private-sidebar__groups">
        {groups.map((group, index) => (
          <section key={group.label} className="private-sidebar__group">
            <button
              type="button"
              className="private-sidebar__group-toggle"
              onClick={() => setExpanded((current) => ({ ...current, [index]: !current[index] }))}
            >
              <span>{group.label}</span>
              <span
                aria-hidden
                style={{ transform: expanded[index] ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 160ms ease' }}
              >
                ›
              </span>
            </button>

            {expanded[index] && (
              <nav aria-label={group.label} className="private-sidebar__nav">
                {group.items.map((item) => {
                  const active = item.key === activeKey

                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => onSelect(item.key)}
                      className={`private-sidebar__item ${active ? 'is-active' : ''}`}
                    >
                      <span className="private-sidebar__item-icon">{iconForKey(item.key)}</span>
                      <span className="private-sidebar__item-label">{item.label}</span>
                    </button>
                  )
                })}
              </nav>
            )}
          </section>
        ))}
      </div>

      <div className="private-sidebar__footer">
        <div className="private-sidebar__footer-label">Plataforma EDM v2</div>
        <div className="private-sidebar__footer-text">Estrutura revista para navegação privada, foco e maior densidade útil.</div>
      </div>
    </div>
  )
}

function IconBase({ children }: { children: React.ReactNode }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {children}
    </svg>
  )
}

function IconHome() {
  return (
    <IconBase>
      <path d="M2.5 8.2 9 3l6.5 5.2" />
      <path d="M4.5 7.5v7h9v-7" />
    </IconBase>
  )
}

function IconPin() {
  return (
    <IconBase>
      <path d="M9 15s4.5-4.3 4.5-8A4.5 4.5 0 1 0 4.5 7c0 3.7 4.5 8 4.5 8Z" />
      <circle cx="9" cy="7" r="1.7" />
    </IconBase>
  )
}

function IconWarn() {
  return (
    <IconBase>
      <path d="M9 3 16 15H2L9 3Z" />
      <path d="M9 7v3.2" />
      <circle cx="9" cy="12.6" r=".6" fill="currentColor" stroke="none" />
    </IconBase>
  )
}

function IconUser() {
  return (
    <IconBase>
      <circle cx="9" cy="6.5" r="2.8" />
      <path d="M3.5 14c1.8-2.7 9.2-2.7 11 0" />
    </IconBase>
  )
}

function IconWrench() {
  return (
    <IconBase>
      <path d="m11.8 3.5 2.7 2.7-7.8 7.8H4v-2.7l7.8-7.8Z" />
      <path d="m10.6 4.7 2.7 2.7" />
    </IconBase>
  )
}

function IconBuilding() {
  return (
    <IconBase>
      <rect x="4" y="3.5" width="10" height="11" rx="1.6" />
      <path d="M7 6.5h.01M11 6.5h.01M7 9.5h.01M11 9.5h.01M9 14.5v-2.5" />
    </IconBase>
  )
}

function IconFactory() {
  return (
    <IconBase>
      <path d="M3 14.5V8.5l4 2v-2l4 2v-5l4 2v7Z" />
    </IconBase>
  )
}

function IconSearch() {
  return (
    <IconBase>
      <circle cx="8" cy="8" r="4" />
      <path d="m11.5 11.5 3 3" />
    </IconBase>
  )
}

function IconCog() {
  return (
    <IconBase>
      <circle cx="9" cy="9" r="2.2" />
      <path d="M9 2.8v1.4M9 13.8v1.4M15.2 9h-1.4M4.2 9H2.8M13.4 4.6l-1 1M5.6 12.4l-1 1M13.4 13.4l-1-1M5.6 5.6l-1-1" />
    </IconBase>
  )
}

function IconChart() {
  return (
    <IconBase>
      <path d="M3.5 14.5h11" />
      <rect x="5" y="8.5" width="2.2" height="4.5" rx=".6" />
      <rect x="8.9" y="6" width="2.2" height="7" rx=".6" />
      <rect x="12.8" y="4" width="2.2" height="9" rx=".6" />
    </IconBase>
  )
}

function IconMap() {
  return (
    <IconBase>
      <path d="m2.8 4.4 4-1.6 4.4 1.6 4-1.6v10.8l-4 1.6-4.4-1.6-4 1.6Z" />
      <path d="M7 3.1v10.6M11.2 4.3v10.6" />
    </IconBase>
  )
}

function IconCompass() {
  return (
    <IconBase>
      <circle cx="9" cy="9" r="6" />
      <path d="m11.8 6.2-1.6 4-4 1.6 1.6-4 4-1.6Z" />
    </IconBase>
  )
}

function IconDot() {
  return (
    <IconBase>
      <circle cx="9" cy="9" r="1.8" />
    </IconBase>
  )
}

function IconLogout() {
  return (
    <IconBase>
      <path d="M7 4H4v10h3" />
      <path d="m10.2 6.2 3 2.8-3 2.8" />
      <path d="M13 9H6.5" />
    </IconBase>
  )
}
