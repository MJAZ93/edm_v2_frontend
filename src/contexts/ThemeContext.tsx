import React, { createContext, useState } from 'react'

export type Theme = 'light' | 'dark'
export const ThemeContext = createContext<{ theme: Theme; toggleTheme: () => void } | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')
  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'))
  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>
}

