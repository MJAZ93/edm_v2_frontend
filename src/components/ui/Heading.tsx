import React from 'react'

type Props = React.PropsWithChildren<{ level?: 1 | 2 | 3 | 4 }>

export function Heading({ level = 2, children }: Props) {
  const Tag = (`h${level}` as unknown) as keyof JSX.IntrinsicElements
  return <Tag>{children}</Tag>
}

