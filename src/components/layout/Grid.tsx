import React from 'react'

type Props = React.PropsWithChildren<{
  columns?: number
  gap?: number
  minColumnWidth?: number
}>

export function Grid({ children, columns = 2, gap = 16, minColumnWidth }: Props) {
  const gridTemplateColumns = minColumnWidth
    ? `repeat(auto-fit, minmax(${minColumnWidth}px, 1fr))`
    : `repeat(${columns}, minmax(0, 1fr))`
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns,
        gap
      }}
    >
      {children}
    </div>
  )
}
