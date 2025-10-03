import React from 'react'
import { PRIMARY_COLOR, PRIMARY_TEXT_ON, PRIMARY_TINT } from '../../utils/theme'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  fullWidth?: boolean
}

export function Button({ variant = 'primary', fullWidth = false, children, ...rest }: Props) {
  const styles: Record<string, React.CSSProperties> = {
    primary: { background: PRIMARY_COLOR, color: PRIMARY_TEXT_ON, border: 'none' },
    secondary: { background: 'transparent', color: '#111827', border: `1px solid ${PRIMARY_TINT}` },
    ghost: { background: 'transparent', color: PRIMARY_COLOR, border: 'none' },
    danger: { background: '#dc2626', color: '#fff', border: 'none' }
  }
  return (
    <button style={{ padding: '12px 14px', borderRadius: 8, width: fullWidth ? '100%' : undefined, ...styles[variant] }} {...rest}>
      {children}
    </button>
  )
}
