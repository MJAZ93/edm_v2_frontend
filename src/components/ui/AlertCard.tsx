import React from 'react'

type Props = React.PropsWithChildren<{ type?: 'info' | 'warning' | 'error' }>

export function AlertCard({ type = 'info', children }: Props) {
  const color = type === 'error' ? '#fee2e2' : type === 'warning' ? '#fef3c7' : '#e0f2fe'
  return <div style={{ background: color, padding: 12, borderRadius: 6 }}>{children}</div>
}

