import React from 'react'
import { PRIMARY_COLOR, PRIMARY_TEXT_ON, PRIMARY_TINT } from '../../utils/theme'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  fullWidth?: boolean
}

export function Button({ variant = 'primary', fullWidth = false, children, ...rest }: Props) {
  const styles: Record<string, React.CSSProperties> = {
    primary: { background: PRIMARY_COLOR, color: PRIMARY_TEXT_ON, border: 'none', boxShadow: '0 2px 10px rgba(234,88,12,.3)' },
    secondary: { background: '#fff', color: '#111827', border: `1px solid ${PRIMARY_TINT}` },
    ghost: { background: 'transparent', color: PRIMARY_COLOR, border: 'none' },
    danger: { background: '#dc2626', color: '#fff', border: 'none' }
  }
  return (
    <button
      style={{ padding: '12px 14px', borderRadius: 10, width: fullWidth ? '100%' : undefined, ...styles[variant] }}
      onMouseOver={(e) => {
        const el = e.currentTarget
        if (variant === 'primary') el.style.filter = 'brightness(0.95)'
        if (variant === 'secondary') el.style.background = '#fff7ed'
      }}
      onMouseOut={(e) => {
        const el = e.currentTarget
        if (variant === 'primary') el.style.filter = 'none'
        if (variant === 'secondary') el.style.background = '#fff'
      }}
      {...rest}
    >
      {children}
    </button>
  )
}
