import React from 'react'
import { BORDER_COLOR, SHADOW_SM, RADIUS } from '../../utils/theme'

type Props = React.PropsWithChildren<{
  title?: string
  subtitle?: string
  extra?: React.ReactNode
  style?: React.CSSProperties
}>

export function Card({ title, subtitle, extra, style, children }: Props) {
  return (
    <div style={{ border: `1px solid ${BORDER_COLOR}`, borderRadius: RADIUS, padding: 20, boxShadow: SHADOW_SM, width: '100%', background: '#fff', overflow: 'hidden', ...style }}>
      {(title || extra) && (
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            {title && <h3 style={{ margin: 0, fontSize: 16 }}>{title}</h3>}
            {subtitle && <div style={{ color: '#6b7280', fontSize: 12 }}>{subtitle}</div>}
          </div>
          {extra && <div>{extra}</div>}
        </div>
      )}
      {children}
    </div>
  )
}
