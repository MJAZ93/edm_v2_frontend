import React, { useEffect, useRef, useState } from 'react'
import { PRIMARY_COLOR } from '../../utils/theme'

type Props = {
  onNavigate?: (path: string) => void
  currentPath?: string
}

export function Navbar({ onNavigate, currentPath }: Props) {
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
            <span aria-hidden>🏭</span>
            <span>Sucatarias</span>
            <span aria-hidden style={{ marginLeft: 4, color: '#6b7280' }}>{open === 'sucatarias' ? '▴' : '▾'}</span>
          </button>
          {open === 'sucatarias' && (
            <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 6, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)', minWidth: 180 }}>
              <button onClick={() => go('/sucatarias')} style={{ ...linkStyle, width: '100%', justifyContent: 'flex-start' }}>
                <span aria-hidden>🗂️</span>
                <span>Lista</span>
              </button>
              <button onClick={() => go('/sucatarias/mapa')} style={{ ...linkStyle, width: '100%', justifyContent: 'flex-start' }}>
                <span aria-hidden>🗺️</span>
                <span>Mapa</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
