import React, { useEffect, useMemo, useState } from 'react'
import { AppShell } from '../components/layout/AppShell'
// Navbar removido conforme pedido (sem dropdown "Sucatarias")
import ScrapyardsMapScreen from './ScrapyardsMapScreen'
import { Sidebar } from '../components/layout/Sidebar'
import { Card } from '../components/ui/Card'
import { Heading } from '../components/ui/Heading'
import { Grid } from '../components/layout/Grid'
import { PRIMARY_COLOR } from '../utils/theme'
import UsersScreen from './UsersScreen'
import ConfigScreen from './ConfigScreen'
import RegioesScreen from './RegioesScreen'
import ASCsScreen from './ASCsScreen'
import FormasConhecimentoScreen from './FormasConhecimentoScreen'
import MateriaisScreen from './MateriaisScreen'
import SetoresInfracaoScreen from './SetoresInfracaoScreen'
import TiposInfracaoScreen from './TiposInfracaoScreen'
import ScrapyardsScreen from './ScrapyardsScreen'
import ScrapyardDetailScreen from './ScrapyardDetailScreen'
import { SemiCircularGauge } from '../components/ui/SemiCircularGauge'
import OcorrenciasScreen from './OcorrenciasScreen'
import OcorrenciaCreateScreen from './OcorrenciaCreateScreen'
import OcorrenciaDetailScreen from './OcorrenciaDetailScreen'
import OcorrenciaEditScreen from './OcorrenciaEditScreen'
import InfractionsScreen from './InfractionsScreen'
import InfractionDetailScreen from './InfractionDetailScreen'
import InfractionEditScreen from './InfractionEditScreen'
import InfractorsScreen from './InfractorsScreen'
import InfractorDetailScreen from './InfractorDetailScreen'
import InfractorEditScreen from './InfractorEditScreen'
import ReportsScreen from './ReportsScreen'
import AccoesScreen from './AccoesScreen'
import AccaoDetailScreen from './AccaoDetailScreen'
import AccaoEditScreen from './AccaoEditScreen'

const MENU = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'ocorrencias', label: 'Ocorrências' },
  { key: 'infracoes', label: 'Infrações' },
  { key: 'infractores', label: 'Infractores' },
  { key: 'accoes', label: 'Ações' },
  { key: 'sucatarias', label: 'Sucatarias' },
  { key: 'relatorios', label: 'Relatórios' },
  { key: 'utilizadores', label: 'Utilizadores' },
  { key: 'config', label: 'Configurações' }
]

export default function DashboardScreen() {
  const KEY_TO_PATH = useMemo(() => ({
    dashboard: '/dashboard',
    ocorrencias: '/ocorrencias',
    infracoes: '/infracoes',
    infractores: '/infractores',
    accoes: '/accoes',
    sucatarias: '/sucatarias',
    sucatariasMapa: '/sucatarias/mapa',
    utilizadores: '/utilizadores',
    config: '/config',
    regioes: '/regioes',
    ascs: '/ascs',
    formasConhecimento: '/formas-conhecimento',
    materiais: '/materiais',
    setoresInfracao: '/setores-infracao',
    tiposInfracao: '/tipos-infracao',
    relatorios: '/relatorios'
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
  const [path, setPath] = useState<string>(() => normalizePath(window.location.pathname))
  // Removed auto-refresh and timestamp UI to simplify header

  // Sincroniza estado com URL (history API)
  useEffect(() => {
    const onPopState = () => {
      const currentPath = normalizePath(window.location.pathname)
      setPath(currentPath)
      const nextKey = resolveKeyFromPath(currentPath)
      setActive(nextKey)
    }
    window.addEventListener('popstate', onPopState)
    window.addEventListener('locationchange', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const handleSelect = (key: string) => {
    const k = key as keyof typeof KEY_TO_PATH
    const path = KEY_TO_PATH[k] || '/dashboard'
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path)
      setPath(normalizePath(path))
      window.dispatchEvent(new Event('locationchange'))
    }
    setActive(k)
  }

  const navigateToPath = (path: string) => {
    const norm = normalizePath(path)
    if (window.location.pathname !== norm) {
      window.history.pushState({}, '', norm)
      setPath(norm)
      window.dispatchEvent(new Event('locationchange'))
    }
    setActive(resolveKeyFromPath(norm))
  }

  const occRoute = useMemo(() => {
    if (path.startsWith('/ocorrencias/novo')) return 'create'
    if (/^\/ocorrencias\/[^/]+\/editar$/.test(path)) return 'edit'
    if (/^\/ocorrencias\/[^/]+$/.test(path)) return 'detail'
    return 'list'
  }, [path]) as 'create' | 'edit' | 'detail' | 'list'

  const infraRoute = useMemo(() => {
    if (/^\/infracoes\/[^/]+\/editar$/.test(path)) return 'edit'
    if (/^\/infracoes\/[^/]+$/.test(path)) return 'detail'
    return 'list'
  }, [path]) as 'edit' | 'detail' | 'list'

  const infractorRoute = useMemo(() => {
    if (/^\/infractores\/[^/]+\/editar$/.test(path)) return 'edit'
    if (/^\/infractores\/[^/]+$/.test(path)) return 'detail'
    return 'list'
  }, [path]) as 'edit' | 'detail' | 'list'

  const accaoRoute = useMemo(() => {
    if (path.startsWith('/accoes/novo')) return 'create'
    if (/^\/accoes\/[^/]+\/editar$/.test(path)) return 'edit'
    if (/^\/accoes\/[^/]+$/.test(path)) return 'detail'
    return 'list'
  }, [path]) as 'create' | 'edit' | 'detail' | 'list'

  return (
    <AppShell
      sidebar={<Sidebar groupLabel="Vandalizações" items={MENU} activeKey={active} onSelect={handleSelect} />}
      header={undefined}
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

            <Card title="Avg Latency (p95)">
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

      {/* Placeholder removido a pedido: não mostrar conteúdo a implementar */}

      {active === 'utilizadores' && <UsersScreen />}
      {active === 'ocorrencias' && (
        occRoute === 'create' ? (
          <OcorrenciaCreateScreen />
        ) : occRoute === 'edit' ? (
          <OcorrenciaEditScreen />
        ) : occRoute === 'detail' ? (
          <OcorrenciaDetailScreen />
        ) : (
          <OcorrenciasScreen />
        )
      )}
      {active === 'infracoes' && (
        infraRoute === 'edit' ? (
          <InfractionEditScreen />
        ) : infraRoute === 'detail' ? (
          <InfractionDetailScreen />
        ) : (
          <InfractionsScreen />
        )
      )}
      {active === 'infractores' && (
        infractorRoute === 'edit' ? (
          <InfractorEditScreen />
        ) : infractorRoute === 'detail' ? (
          <InfractorDetailScreen />
        ) : (
          <InfractorsScreen />
        )
      )}
      {active === 'sucatarias' && (
        /^\/sucatarias\/[^/]+$/.test(path) ? (
          <ScrapyardDetailScreen />
        ) : (
          <ScrapyardsScreen />
        )
      )}
      {active === 'sucatariasMapa' && <ScrapyardsMapScreen />}
      {active === 'config' && <ConfigScreen />}
      {active === 'regioes' && <RegioesScreen />}
      {active === 'ascs' && <ASCsScreen />}
      {active === 'formasConhecimento' && <FormasConhecimentoScreen />}
      {active === 'materiais' && <MateriaisScreen />}
      {active === 'setoresInfracao' && <SetoresInfracaoScreen />}
      {active === 'tiposInfracao' && <TiposInfracaoScreen />}
      {active === 'relatorios' && <ReportsScreen />}
      {active === 'accoes' && (
        accaoRoute === 'create' ? (
          <AccaoEditScreen />
        ) : accaoRoute === 'edit' ? (
          <AccaoEditScreen />
        ) : accaoRoute === 'detail' ? (
          <AccaoDetailScreen />
        ) : (
          <AccoesScreen />
        )
      )}
    </AppShell>
  )
}
