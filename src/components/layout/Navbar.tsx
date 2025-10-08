import React, { useEffect, useRef, useState } from 'react'
import { PRIMARY_COLOR } from '../../utils/theme'
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
    gap: 8,
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: '#374151',
    padding: '8px 10px',
    borderRadius: 8
  }

  return (
    <nav ref={ref} style={{ padding: 10, borderBottom: `2px solid ${PRIMARY_COLOR}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ width: 12, height: 12, background: PRIMARY_COLOR, borderRadius: '50%' }} aria-hidden />
        <strong style={{ letterSpacing: 0.3 }}>EDM</strong>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setOpen((o) => (o === 'sucatarias' ? null : 'sucatarias'))}
            style={{
              ...linkStyle,
              outline: (isActive('/sucatarias') || isActive('/sucatarias/mapa')) ? `2px solid ${PRIMARY_COLOR}` : 'none'
            }}
            title="Sucatarias"
          >
            <IconFactory />
            <span>Sucatarias</span>
            <IconChevron open={open === 'sucatarias'} />
          </button>
          {open === 'sucatarias' && (
            <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 6, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)', minWidth: 180 }}>
              <button onClick={() => go('/sucatarias')} style={{ ...linkStyle, width: '100%', justifyContent: 'flex-start' }}>
                <IconList />
                <span>Lista</span>
              </button>
              <button onClick={() => go('/sucatarias/mapa')} style={{ ...linkStyle, width: '100%', justifyContent: 'flex-start' }}>
                <IconMap />
                <span>Mapa</span>
              </button>
            </div>
          )}
        </div>
        <button onClick={() => logout()} title="Terminar sessão" style={{ ...linkStyle, color: '#6b7280' }}>
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
