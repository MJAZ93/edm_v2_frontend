import React from 'react'

type Props = React.PropsWithChildren<{ title?: string; style?: React.CSSProperties }>

export function Card({ title, style, children }: Props) {
  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 24, boxShadow: '0 6px 20px rgba(0,0,0,0.08)', width: '100%', ...style }}>
      {title && <h3 style={{ marginTop: 0 }}>{title}</h3>}
      {children}
    </div>
  )
}
