import React from 'react'

type Props = React.PropsWithChildren<{}>

export default function PrivateRoute({ children }: Props) {
  // Placeholder route guard. Real auth logic will be added later.
  return <>{children}</>
}

