import React from 'react'

type Props = React.PropsWithChildren<{
  sidebar: React.ReactNode
  header?: React.ReactNode
}>

export function AppShell({ sidebar, header, children }: Props) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', minHeight: '100vh' }}>
      {sidebar}
      <div style={{ background: '#f8fafc' }}>
        {header}
        <main style={{ padding: 20 }}>{children}</main>
      </div>
    </div>
  )
}
