import React, { useEffect, useRef, useState } from 'react'
import { PRIMARY_COLOR, SURFACE_ELEVATED, BORDER_COLOR, TEXT_PRIMARY, TEXT_SECONDARY, SHADOW, SPACING, RADIUS } from '../../utils/theme'
import { useAuth } from '../../contexts/AuthContext'

type Props = {
  onNavigate?: (path: string) => void
  currentPath?: string
}

export function Navbar({ onNavigate, currentPath }: Props) {
  const { logout } = useAuth()
  const [open, setOpen] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!ref.current) return
      if (!ref.current.contains(e.target as Node)) setOpen(null)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const go = (path: string) => {
    onNavigate?.(path)
    setOpen(null)
  }
  const isActive = (path: string) => currentPath === path

  const linkStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: SPACING.sm,
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: TEXT_PRIMARY,
    padding: `${SPACING.sm}px ${SPACING.md}px`,
    borderRadius: RADIUS.md,
    fontSize: 14,
    fontWeight: 500,
    transition: 'all 0.2s ease-in-out'
  }

  return (
    <nav 
      ref={ref} 
      style={{ 
        padding: `${SPACING.md}px ${SPACING.lg}px`, 
        borderBottom: `1px solid ${BORDER_COLOR}`, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        background: SURFACE_ELEVATED,
        boxShadow: SHADOW.sm,
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.md }}>
        <img 
          src="/images/logo.png" 
          alt="EDM - Electricidade de Moçambique" 
          style={{ 
            height: 40,
            width: 'auto',
            objectFit: 'contain'
          }} 
        />
        <div style={{ 
          borderLeft: `2px solid ${BORDER_COLOR}`, 
          paddingLeft: SPACING.md,
          height: 32
        }}>
          <strong style={{ 
            letterSpacing: '0.02em',
            fontSize: 16,
            color: TEXT_PRIMARY,
            fontWeight: 600
          }}>
            Sistema EDM
          </strong>
          <div style={{
            fontSize: 12,
            color: TEXT_SECONDARY,
            fontWeight: 400,
            marginTop: 2
          }}>
            Gestão de Vandalizações
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.xs }}>
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setOpen((o) => (o === 'sucatarias' ? null : 'sucatarias'))}
            style={{
              ...linkStyle,
              background: (isActive('/sucatarias') || isActive('/sucatarias/mapa')) ? PRIMARY_COLOR : 'transparent',
              color: (isActive('/sucatarias') || isActive('/sucatarias/mapa')) ? 'white' : TEXT_PRIMARY,
              boxShadow: (isActive('/sucatarias') || isActive('/sucatarias/mapa')) ? SHADOW.sm : 'none'
            }}
            title="Sucatarias"
            onMouseEnter={(e) => {
              if (!isActive('/sucatarias') && !isActive('/sucatarias/mapa')) {
                e.currentTarget.style.background = '#f8fafc'
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive('/sucatarias') && !isActive('/sucatarias/mapa')) {
                e.currentTarget.style.background = 'transparent'
              }
            }}
          >
            <IconFactory />
            <span>Sucatarias</span>
            <IconChevron open={open === 'sucatarias'} />
          </button>
          {open === 'sucatarias' && (
            <div style={{ 
              position: 'absolute', 
              right: 0, 
              top: '100%', 
              marginTop: SPACING.xs, 
              background: SURFACE_ELEVATED, 
              border: `1px solid ${BORDER_COLOR}`, 
              borderRadius: RADIUS.lg, 
              boxShadow: SHADOW.lg, 
              minWidth: 200,
              overflow: 'hidden'
            }}>
              <button 
                onClick={() => go('/sucatarias')} 
                style={{ 
                  ...linkStyle, 
                  width: '100%', 
                  justifyContent: 'flex-start',
                  borderRadius: 0,
                  padding: `${SPACING.md}px ${SPACING.lg}px`
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <IconList />
                <span>Lista</span>
              </button>
              <button 
                onClick={() => go('/sucatarias/mapa')} 
                style={{ 
                  ...linkStyle, 
                  width: '100%', 
                  justifyContent: 'flex-start',
                  borderRadius: 0,
                  padding: `${SPACING.md}px ${SPACING.lg}px`
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <IconMap />
                <span>Mapa</span>
              </button>
            </div>
          )}
        </div>
        <button 
          onClick={() => logout()} 
          title="Terminar sessão" 
          style={{ 
            ...linkStyle, 
            color: TEXT_SECONDARY,
            marginLeft: SPACING.md,
            border: `1px solid ${BORDER_COLOR}`
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#fef2f2'
            e.currentTarget.style.borderColor = '#fca5a5'
            e.currentTarget.style.color = '#dc2626'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.borderColor = BORDER_COLOR
            e.currentTarget.style.color = TEXT_SECONDARY
          }}
        >
          <IconLogout />
          <span>Terminar sessão</span>
        </button>
      </div>
    </nav>
  )
}

function IconBase({ children }: { children: React.ReactNode }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {children}
    </svg>
  )
}
function IconFactory() { return (
  <IconBase>
    <rect x="2.5" y="7.5" width="11" height="6" rx="1" />
    <path d="M5 7.5V5.5L7.5 7.5" />
  </IconBase>
) }
function IconList() { return (
  <IconBase>
    <path d="M6 4h7" /><path d="M6 8h7" /><path d="M6 12h7" />
    <circle cx="3" cy="4" r=".8" fill="currentColor" stroke="none" />
    <circle cx="3" cy="8" r=".8" fill="currentColor" stroke="none" />
    <circle cx="3" cy="12" r=".8" fill="currentColor" stroke="none" />
  </IconBase>
) }
function IconMap() { return (
  <IconBase>
    <polyline points="2,4 6,2 10,4 14,2 14,12 10,14 6,12 2,14 2,4" />
    <line x1="6" y1="2" x2="6" y2="12" /><line x1="10" y1="4" x2="10" y2="14" />
  </IconBase>
) }
function IconChevron({ open }: { open?: boolean }) { return (
  <IconBase>
    <polyline points={open ? '4,10 8,6 12,10' : '4,6 8,10 12,6'} />
  </IconBase>
) }
function IconLogout() { return (
  <IconBase>
    <path d="M6 3H3v10h3" /><path d="M10 11l3-3-3-3" /><path d="M13 8H6" />
  </IconBase>
) }
