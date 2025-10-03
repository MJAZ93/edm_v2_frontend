import React from 'react'

type Props = React.PropsWithChildren<{ title?: string }>

export function Section({ title, children }: Props) {
  return (
    <section style={{ margin: '24px 0' }}>
      {title && <h2 style={{ marginBottom: 12 }}>{title}</h2>}
      {children}
    </section>
  )}

