import React from 'react'

type Props = React.PropsWithChildren<{}>

export function PrivateArea({ children }: Props) {
  // Layout wrapper for authenticated areas (placeholder)
  return <div>{children}</div>
}

