import React from 'react'

type Props = React.PropsWithChildren<{ title?: string }>

export function Card({ title, children }: Props) {
  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
      {title && <h3 style={{ marginTop: 0 }}>{title}</h3>}
      {children}
    </div>
  )
}

