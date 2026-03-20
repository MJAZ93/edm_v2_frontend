import React, { useEffect, useState } from 'react'

type Props = React.PropsWithChildren<{
  sidebar: React.ReactNode
  header?: React.ReactNode
}>

export function AppShell({ sidebar, header, children }: Props) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1100) setMobileMenuOpen(false)
    }

    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return (
    <div className="app-shell">
      <div
        className={`app-shell__backdrop ${mobileMenuOpen ? 'is-open' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden={!mobileMenuOpen}
      />

      <aside className={`app-shell__sidebar ${mobileMenuOpen ? 'is-open' : ''}`}>
        {sidebar}
      </aside>

      <div className="app-shell__main">
        <div className="app-shell__topbar">
          <button
            type="button"
            className="app-shell__menu-button"
            onClick={() => setMobileMenuOpen((value) => !value)}
            aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
          >
            <span />
            <span />
            <span />
          </button>

          <div className="app-shell__header">
            {header}
          </div>
        </div>

        <main className="app-shell__content">
          <div className="app-shell__content-inner">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
