import React from 'react'
import { 
  PRIMARY_COLOR, 
  PRIMARY_HOVER, 
  PRIMARY_TEXT_ON, 
  PRIMARY_LIGHT,
  SEMANTIC_COLORS,
  SURFACE_ELEVATED,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  BORDER_COLOR,
  RADIUS,
  SHADOW,
  SPACING
} from '../../utils/theme'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  loading?: boolean
}

export function Button({ 
  variant = 'primary', 
  size = 'md',
  fullWidth = false, 
  loading = false,
  children, 
  disabled,
  ...rest 
}: Props) {
  const sizeStyles = {
    sm: { 
      padding: `${SPACING.sm}px ${SPACING.md}px`, 
      fontSize: 14,
      fontWeight: 500,
      minHeight: 36
    },
    md: { 
      padding: `${SPACING.md}px ${SPACING.lg}px`, 
      fontSize: 15,
      fontWeight: 500,
      minHeight: 42
    },
    lg: { 
      padding: `${SPACING.lg}px ${SPACING.xl}px`, 
      fontSize: 16,
      fontWeight: 600,
      minHeight: 48
    }
  }

  const variants: Record<string, React.CSSProperties> = {
    primary: { 
      background: PRIMARY_COLOR, 
      color: PRIMARY_TEXT_ON, 
      border: 'none',
      boxShadow: SHADOW.sm
    },
    secondary: { 
      background: SURFACE_ELEVATED, 
      color: TEXT_PRIMARY, 
      border: `1px solid ${BORDER_COLOR}`,
      boxShadow: SHADOW.sm
    },
    outline: { 
      background: 'transparent', 
      color: PRIMARY_COLOR, 
      border: `2px solid ${PRIMARY_COLOR}`
    },
    ghost: { 
      background: 'transparent', 
      color: TEXT_SECONDARY, 
      border: 'none'
    },
    danger: { 
      background: SEMANTIC_COLORS.error, 
      color: PRIMARY_TEXT_ON, 
      border: 'none',
      boxShadow: SHADOW.sm
    },
    success: { 
      background: SEMANTIC_COLORS.success, 
      color: PRIMARY_TEXT_ON, 
      border: 'none',
      boxShadow: SHADOW.sm
    }
  }

  const baseStyle: React.CSSProperties = {
    borderRadius: RADIUS.md,
    width: fullWidth ? '100%' : undefined,
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease-in-out',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    letterSpacing: '0.01em',
    opacity: disabled ? 0.6 : 1,
    outline: 'none',
    ...sizeStyles[size],
    ...variants[variant]
  }

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return
    const el = e.currentTarget
    
    switch (variant) {
      case 'primary':
        el.style.background = PRIMARY_HOVER
        el.style.transform = 'translateY(-1px)'
        el.style.boxShadow = SHADOW.md
        break
      case 'secondary':
        el.style.background = PRIMARY_LIGHT
        el.style.borderColor = PRIMARY_COLOR
        break
      case 'outline':
        el.style.background = PRIMARY_LIGHT
        break
      case 'ghost':
        el.style.background = PRIMARY_LIGHT
        el.style.color = PRIMARY_COLOR
        break
      case 'danger':
        el.style.filter = 'brightness(1.1)'
        el.style.transform = 'translateY(-1px)'
        break
      case 'success':
        el.style.filter = 'brightness(1.1)'
        el.style.transform = 'translateY(-1px)'
        break
    }
  }

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return
    const el = e.currentTarget
    
    // Reset to original styles
    Object.assign(el.style, baseStyle)
  }

  return (
    <button
      style={baseStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && (
        <div 
          style={{
            width: 16,
            height: 16,
            border: '2px solid transparent',
            borderTop: variant === 'primary' || variant === 'danger' || variant === 'success' 
              ? '2px solid currentColor' 
              : `2px solid ${PRIMARY_COLOR}`,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}
        />
      )}
      {children}
    </button>
  )
}
