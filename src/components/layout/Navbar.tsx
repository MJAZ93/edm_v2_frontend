import React from 'react'
import { PRIMARY_COLOR } from '../../utils/theme'

export function Navbar() {
  return (
    <nav style={{ padding: 12, borderBottom: `3px solid ${PRIMARY_COLOR}`, display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ width: 10, height: 10, background: PRIMARY_COLOR, borderRadius: '50%' }} aria-hidden />
      <strong>EDM</strong>
    </nav>
  )
}
