import React from 'react'

type Props = { data?: unknown[] }

export function HexTileChart({ data = [] }: Props) {
  return <div aria-label="HexTileChart">Tiles: {data.length}</div>
}

