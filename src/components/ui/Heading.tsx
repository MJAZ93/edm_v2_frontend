import React from 'react'

type Props = React.PropsWithChildren<{
  level?: 1 | 2 | 3 | 4
  className?: string
  style?: React.CSSProperties
}>

export function Heading({ level = 2, className, style, children }: Props) {
  const Tag = `h${level}` as React.ElementType
  return <Tag className={className} style={style}>{children}</Tag>
}
