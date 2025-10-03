import React from 'react'

type Props = React.InputHTMLAttributes<HTMLInputElement>

export function DatePicker(props: Props) {
  return <input type="date" {...props} />
}

