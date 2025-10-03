import React from 'react'

type Props = { value?: number }

export function SemiCircularGauge({ value = 0 }: Props) {
  return <div aria-label="SemiCircularGauge">Gauge: {value}%</div>
}

