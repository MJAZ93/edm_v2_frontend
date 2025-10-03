import React from 'react'

type Props = React.PropsWithChildren<{ className?: string }>

export function Container({ children, className }: Props) {
  return <div className={className} style={{ margin: '0 auto', padding: 16, maxWidth: 1200 }}>{children}</div>
}

