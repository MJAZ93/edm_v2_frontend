import React, { useEffect, useMemo, useState } from 'react'
import { AppShell } from '../components/layout/AppShell'
import { Sidebar } from '../components/layout/Sidebar'
import { Card } from '../components/ui/Card'
import { Heading } from '../components/ui/Heading'
import { Grid } from '../components/layout/Grid'
import { PRIMARY_COLOR } from '../utils/theme'
import UsersScreen from './UsersScreen'
import ConfigScreen from './ConfigScreen'
import RegioesScreen from './RegioesScreen'
import ASCsScreen from './ASCsScreen'
import { SemiCircularGauge } from '../components/ui/SemiCircularGauge'

const MENU = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'mapa', label: 'Mapa' },
  { key: 'ocorrencias', label: 'Ocorrências' },
  { key: 'infracoes', label: 'Infrações' },
  { key: 'infractores', label: 'Infractores' },
  { key: 'sucatarias', label: 'Sucatarias' },
  { key: 'utilizadores', label: 'Utilizadores' },
  { key: 'config', label: 'Configurações' }
]

export default function DashboardScreen() {
  const KEY_TO_PATH = useMemo(() => ({
    dashboard: '/dashboard',
    mapa: '/mapa',
    ocorrencias: '/ocorrencias',
    infracoes: '/infracoes',
    infractores: '/infractores',
    sucatarias: '/sucatarias',
    utilizadores: '/utilizadores',
    config: '/config',
    regioes: '/regioes',
    ascs: '/ascs'
  } as const), [])

  const PATH_TO_KEY = useMemo(() => Object.fromEntries(Object.entries(KEY_TO_PATH).map(([k, v]) => [v, k])), [KEY_TO_PATH]) as Record<string, keyof typeof KEY_TO_PATH>

  const normalizePath = (path: string): string => {
    if (!path) return '/dashboard'
    // remove trailing slashes
    let p = path.replace(/\/+$/, '')
    if (p === '') p = '/'
    if (p === '/') return '/dashboard'
    return p
  }

  const resolveKeyFromPath = (path: string): keyof typeof KEY_TO_PATH => {
    const p = normalizePath(path)
    const direct = PATH_TO_KEY[p]
    if (direct) return direct
    // tenta por prefixo (ex.: /ascs/123)
    const entry = Object.entries(KEY_TO_PATH).find(([, v]) => p.startsWith(v))
    if (entry) return entry[0] as keyof typeof KEY_TO_PATH
    return 'dashboard'
  }

  const [active, setActive] = useState<keyof typeof KEY_TO_PATH>(() => resolveKeyFromPath(window.location.pathname))
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string>('--:--:--')

  useEffect(() => {
    const updateTime = () => setLastUpdated(new Date().toLocaleTimeString())
    updateTime()
    if (!autoRefresh) return
    const id = setInterval(updateTime, 10_000)
    return () => clearInterval(id)
  }, [autoRefresh])

  // Sincroniza estado com URL (history API)
  useEffect(() => {
    const onPopState = () => {
      const nextKey = resolveKeyFromPath(window.location.pathname)
      setActive(nextKey)
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const handleSelect = (key: string) => {
    const k = key as keyof typeof KEY_TO_PATH
    const path = KEY_TO_PATH[k] || '/dashboard'
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path)
    }
    setActive(k)
  }

  return (
    <AppShell
      sidebar={<Sidebar groupLabel="Vandalizações" items={MENU} activeKey={active} onSelect={handleSelect} />}
      header={
        <div style={{ padding: 16, borderBottom: '1px solid #e5e7eb', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Heading level={1}>
            {active === 'dashboard' && 'Dashboard'}
            {active === 'mapa' && 'Mapa'}
            {active === 'ocorrencias' && 'Ocorrências'}
            {active === 'infracoes' && 'Infrações'}
            {active === 'infractores' && 'Infractores'}
            {active === 'sucatarias' && 'Sucatarias'}
            {active === 'utilizadores' && 'Utilizadores'}
            {active === 'config' && 'Configurações'}
            {active === 'regioes' && 'Regiões'}
            {active === 'ascs' && 'ASCs'}
          </Heading>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#6b7280' }}>
            <span style={{ background: '#eef2ff', color: '#4338ca', padding: '6px 10px', borderRadius: 999 }}>Atualizado: {lastUpdated}</span>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
              <span>Auto-refresh (10s)</span>
            </label>
            <select defaultValue="24h" style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: '6px 8px', background: '#fff' }}>
              <option value="1h">Last 1h</option>
              <option value="12h">Last 12h</option>
              <option value="24h">Last 24h</option>
              <option value="7d">Last 7d</option>
            </select>
            <button style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', background: '#fff' }}>Refresh</button>
          </div>
        </div>
      }
    >
      {active === 'dashboard' && (
        <>
          <Grid columns={4} gap={20}>
            <Card title="Total Services">
              <div style={{ fontSize: 28, fontWeight: 700 }}>0</div>
              <div style={{ color: '#6b7280', marginTop: 6 }}>Healthy: 0 · Warning: 0 · Critical: 0</div>
            </Card>

            <Card title="System Health">
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <SemiCircularGauge value={0} />
                <div style={{ color: '#6b7280' }}>Success rate: 0.00%</div>
              </div>
            </Card>

            <Card title="Total Requests (24h)">
              <div style={{ fontSize: 28, fontWeight: 700 }}>0</div>
              <div style={{ color: '#6b7280', marginTop: 6 }}>Peak: 0 rpm</div>
            </Card>

            <Card title="Avg Latency (p95)" subtitle={`Atualizado ${lastUpdated}`}>
              <div style={{ fontSize: 28, fontWeight: 700 }}>0.00 ms</div>
            </Card>
          </Grid>

          <Grid columns={2} gap={20}>
            <Card title="Critical Services">
              <div style={{ color: '#6b7280', padding: 12, border: '1px dashed #e5e7eb', borderRadius: 8 }}>No critical services</div>
            </Card>
            <Card title="Warning Services">
              <div style={{ color: '#6b7280', padding: 12, border: '1px dashed #e5e7eb', borderRadius: 8 }}>No warning services</div>
            </Card>
          </Grid>

          <Grid columns={2} gap={20}>
            <Card title="Traffic (24h distribution)">
              <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                Bar chart (placeholder)
              </div>
            </Card>
            <Card title="Latency (p50/p95/p99)">
              <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                Bar chart (placeholder)
              </div>
            </Card>
          </Grid>
        </>
      )}

      {active !== 'dashboard' && active !== 'utilizadores' && active !== 'config' && active !== 'regioes' && active !== 'ascs' && (
        <Card>
          <div style={{ color: '#6b7280' }}>Conteúdo de "{MENU.find(m => m.key === active)?.label}" a implementar.</div>
        </Card>
      )}

      {active === 'utilizadores' && <UsersScreen />}
      {active === 'config' && <ConfigScreen />}
      {active === 'regioes' && <RegioesScreen />}
      {active === 'ascs' && <ASCsScreen />}
    </AppShell>
  )
}
