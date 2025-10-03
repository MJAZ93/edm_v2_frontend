import React from 'react'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
}

export function Button({ variant = 'primary', children, ...rest }: Props) {
  const styles: Record<string, React.CSSProperties> = {
    primary: { background: '#2563eb', color: '#fff', border: 'none' },
    secondary: { background: 'transparent', color: '#111827', border: '1px solid #d1d5db' },
    ghost: { background: 'transparent', color: '#374151', border: 'none' },
    danger: { background: '#dc2626', color: '#fff', border: 'none' }
  }
  return (
    <button style={{ padding: '8px 12px', borderRadius: 6, ...styles[variant] }} {...rest}>
      {children}
    </button>
  )
}

