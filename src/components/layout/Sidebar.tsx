import React, { useState } from 'react'
import { 
  PRIMARY_COLOR, 
  PRIMARY_LIGHT, 
  BORDER_COLOR, 
  SURFACE_ELEVATED, 
  TEXT_PRIMARY, 
  TEXT_SECONDARY, 
  SHADOW, 
  RADIUS, 
  SPACING 
} from '../../utils/theme'

type MenuItem = {
  key: string
  label: string
  icon?: React.ReactNode
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
        width: 300,
        borderRight: `1px solid ${BORDER_COLOR}`,
        minHeight: '100vh',
        padding: 0,
        position: 'sticky',
        top: 0,
        background: SURFACE_ELEVATED,
        boxShadow: SHADOW.sm,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Cabeçalho com Logo */}
      <div style={{ 
        padding: SPACING.xl,
        borderBottom: `1px solid ${BORDER_COLOR}`,
        background: `linear-gradient(135deg, ${PRIMARY_COLOR} 0%, #c2410c 100%)`,
        color: 'white'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: SPACING.md,
          marginBottom: SPACING.md
        }}>
          <div style={{
            width: 48,
            height: 48,
            background: 'white',
            borderRadius: RADIUS.md,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: SPACING.xs,
            boxShadow: SHADOW.md
          }}>
            <img 
              src="/images/logo.png" 
              alt="EDM Logo" 
              style={{ 
                width: '100%',
                height: '100%',
                objectFit: 'contain'
              }} 
            />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ 
              fontSize: 18,
              fontWeight: 600,
              letterSpacing: '0.02em',
              lineHeight: 1.2
            }}>
              Sistema EDM
            </div>
            <div style={{
              fontSize: 13,
              opacity: 0.9,
              fontWeight: 400,
              marginTop: 2
            }}>
              Gestão de Vandalizações
            </div>
          </div>
        </div>
        
        {/* Versão ou info adicional */}
        <div style={{
          fontSize: 11,
          opacity: 0.7,
          background: 'rgba(255,255,255,0.1)',
          padding: `${SPACING.xs}px ${SPACING.sm}px`,
          borderRadius: RADIUS.sm,
          textAlign: 'center',
          letterSpacing: '0.01em'
        }}>
          v2.0 • Electricidade de Moçambique
        </div>
      </div>

      {/* Conteúdo do Menu */}
      <div style={{ 
        flex: 1, 
        padding: SPACING.lg,
        paddingTop: SPACING.xl 
      }}>
        {/* Cabeçalho da Secção */}
        <button
          onClick={() => setExpanded((v) => !v)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'transparent',
            border: 'none',
            color: TEXT_PRIMARY,
            padding: `${SPACING.md}px 0`,
            fontWeight: 600,
            fontSize: 14,
            cursor: 'pointer',
            borderRadius: RADIUS.md,
            transition: 'all 0.2s ease-in-out',
            marginBottom: SPACING.md,
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = PRIMARY_LIGHT
            e.currentTarget.style.color = PRIMARY_COLOR
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = TEXT_PRIMARY
          }}
        >
          <span>{groupLabel}</span>
          <ChevronIcon expanded={expanded} />
        </button>

        {/* Lista de Navegação */}
        {expanded && (
          <nav aria-label={groupLabel} style={{ marginTop: SPACING.sm }}>
            {items.map((item) => {
              const active = item.key === activeKey
              return (
                <button
                  key={item.key}
                  onClick={() => onSelect(item.key)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    background: active ? PRIMARY_LIGHT : 'transparent',
                    border: active ? `2px solid ${PRIMARY_COLOR}` : '2px solid transparent',
                    color: active ? PRIMARY_COLOR : TEXT_SECONDARY,
                    padding: `${SPACING.md}px ${SPACING.lg}px`,
                    borderRadius: RADIUS.lg,
                    marginBottom: SPACING.xs,
                    cursor: 'pointer',
                    outline: 'none',
                    transition: 'all 0.2s ease-in-out',
                    fontSize: 15,
                    fontWeight: active ? 600 : 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: SPACING.md,
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = '#f8fafc'
                      e.currentTarget.style.color = TEXT_PRIMARY
                      e.currentTarget.style.transform = 'translateX(4px)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = TEXT_SECONDARY
                      e.currentTarget.style.transform = 'translateX(0)'
                    }
                  }}
                >
                  {/* Indicador visual para item ativo */}
                  {active && (
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: 4,
                      background: PRIMARY_COLOR,
                      borderRadius: '0 4px 4px 0'
                    }} />
                  )}
                  
                  {/* Ícone se fornecido */}
                  {item.icon && (
                    <span style={{ 
                      opacity: active ? 1 : 0.7,
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      {item.icon}
                    </span>
                  )}
                  
                  {/* Label do item */}
                  <span style={{ flex: 1 }}>
                    {item.label}
                  </span>
                  
                  {/* Indicador adicional para item ativo */}
                  {active && (
                    <div style={{
                      width: 6,
                      height: 6,
                      background: PRIMARY_COLOR,
                      borderRadius: '50%',
                      opacity: 0.8
                    }} />
                  )}
                </button>
              )
            })}
          </nav>
        )}
      </div>

      {/* Rodapé do Sidebar */}
      <div style={{
        padding: SPACING.lg,
        borderTop: `1px solid ${BORDER_COLOR}`,
        background: '#fafafa',
        fontSize: 12,
        color: TEXT_SECONDARY,
        textAlign: 'center'
      }}>
        <div style={{ marginBottom: SPACING.xs }}>
          © 2024 EDM, E.P.
        </div>
        <div style={{ opacity: 0.7 }}>
          Electricidade de Moçambique
        </div>
      </div>
    </aside>
  )
}

// Componente para o ícone chevron
function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg 
      width="16" 
      height="16" 
      viewBox="0 0 16 16" 
      fill="none" 
      style={{ 
        transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
        transition: 'transform 0.2s ease-in-out'
      }}
    >
      <path 
        d="M6 12L10 8L6 4" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  )
}
