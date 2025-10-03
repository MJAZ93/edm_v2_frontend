import React from 'react'

type Props = React.PropsWithChildren<{ columns?: number; gap?: number }>

export function Grid({ children, columns = 2, gap = 16 }: Props) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gap
      }}
    >
      {children}
    </div>
  )
}

