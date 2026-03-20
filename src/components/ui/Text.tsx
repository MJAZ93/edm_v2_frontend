import React from 'react'

type Props = React.PropsWithChildren<{
  as?: React.ElementType
  className?: string
  style?: React.CSSProperties
}>

export function Text({ as: Tag = 'p', className, style, children }: Props) {
  return <Tag className={className} style={style}>{children}</Tag>
}
