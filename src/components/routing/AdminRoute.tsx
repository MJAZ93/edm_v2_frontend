import React from 'react'

type Props = React.PropsWithChildren<{}>

export default function AdminRoute({ children }: Props) {
  // Placeholder admin guard.
  return <>{children}</>
}

