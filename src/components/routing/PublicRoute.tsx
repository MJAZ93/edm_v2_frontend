import React from 'react'

type Props = React.PropsWithChildren<{}>

export default function PublicRoute({ children }: Props) {
  return <>{children}</>
}

