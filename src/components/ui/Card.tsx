import React from 'react'
import { BORDER_COLOR, SHADOW, RADIUS, SURFACE_ELEVATED, TEXT_PRIMARY, TEXT_SECONDARY, SPACING } from '../../utils/theme'

type Props = React.PropsWithChildren<{
  title?: string
  subtitle?: string
  extra?: React.ReactNode
  style?: React.CSSProperties
  variant?: 'default' | 'elevated' | 'bordered'
  padding?: 'sm' | 'md' | 'lg'
}>

export function Card({ 
  title, 
  subtitle, 
  extra, 
  style, 
  children, 
  variant = 'elevated',
  padding = 'lg'
}: Props) {
  const variants = {
    default: {
      background: SURFACE_ELEVATED,
      border: `1px solid ${BORDER_COLOR}`,
      boxShadow: 'none'
    },
    elevated: {
      background: SURFACE_ELEVATED,
      border: `1px solid ${BORDER_COLOR}`,
      boxShadow: SHADOW.md
    },
    bordered: {
      background: SURFACE_ELEVATED,
      border: `1px solid ${BORDER_COLOR}`,
      boxShadow: SHADOW.sm
    }
  }

  const paddingValues = {
    sm: SPACING.md,
    md: SPACING.lg,
    lg: SPACING.xl
  }

  return (
    <div 
      style={{ 
        borderRadius: RADIUS.xl, 
        padding: paddingValues[padding], 
        width: '100%', 
        overflow: 'visible',
        transition: 'box-shadow 0.2s ease-in-out, transform 0.2s ease-in-out',
        ...variants[variant],
        position: 'relative',
        ...style 
      }}
      onMouseEnter={(e) => {
        if (variant === 'elevated') {
          e.currentTarget.style.boxShadow = SHADOW.lg
          e.currentTarget.style.transform = 'translateY(-2px)'
        }
      }}
      onMouseLeave={(e) => {
        if (variant === 'elevated') {
          e.currentTarget.style.boxShadow = SHADOW.md
          e.currentTarget.style.transform = 'translateY(0)'
        }
      }}
    >
      {(title || extra) && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'flex-start', 
          justifyContent: 'space-between', 
          gap: SPACING.md,
          marginBottom: SPACING.lg,
          paddingBottom: title || subtitle ? SPACING.md : 0,
          borderBottom: title || subtitle ? `1px solid ${BORDER_COLOR}` : 'none'
        }}>
          <div style={{ flex: 1 }}>
            {title && (
              <h3 style={{ 
                margin: 0, 
                fontSize: 19,
                fontWeight: 700,
                color: TEXT_PRIMARY,
                lineHeight: 1.3,
                letterSpacing: '-0.02em'
              }}>
                {title}
              </h3>
            )}
            {subtitle && (
              <p style={{ 
                color: TEXT_SECONDARY, 
                fontSize: 14,
                margin: title ? `${SPACING.xs}px 0 0 0` : 0,
                lineHeight: 1.4
              }}>
                {subtitle}
              </p>
            )}
          </div>
          {extra && (
            <div style={{ 
              marginLeft: SPACING.md,
              flexShrink: 0
            }}>
              {extra}
            </div>
          )}
        </div>
      )}
      <div style={{ color: TEXT_PRIMARY, minWidth: 0 }}>
        {children}
      </div>
    </div>
  )
}
