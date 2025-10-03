import React from 'react'

type Props = React.PropsWithChildren<{ as?: keyof JSX.IntrinsicElements }>

export function Text({ as: Tag = 'p', children }: Props) {
  return <Tag>{children}</Tag>
}

