import React from 'react'
import { Card, Grid, Heading, Button } from '../components'

export default function ConfigScreen() {
  function go(path: string) {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path)
      try {
        window.dispatchEvent(new PopStateEvent('popstate'))
      } catch {}
      try {
        window.dispatchEvent(new Event('locationchange'))
      } catch {}
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Grid columns={2} gap={16}>
        <Card title="Províncias" subtitle="Gerir lista de províncias">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Adicionar, editar e remover províncias.</span>
            <Button onClick={() => go('/provincias')}>Gerir</Button>
          </div>
        </Card>
        <Card title="Regiões" subtitle="Gerir lista de regiões">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Adicionar, editar e remover regiões.</span>
            <Button onClick={() => go('/regioes')}>Gerir</Button>
          </div>
        </Card>
        <Card title="ASCs" subtitle="Gerir lista de ASCs">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Adicionar, editar e remover ASCs.</span>
            <Button onClick={() => go('/ascs')}>Gerir</Button>
          </div>
        </Card>
        <Card title="Formas de Conhecimento" subtitle="Gerir formas de conhecimento">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Adicionar, editar e remover formas de conhecimento.</span>
            <Button onClick={() => go('/formas-conhecimento')}>Gerir</Button>
          </div>
        </Card>
        <Card title="Materiais" subtitle="Gerir materiais">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Adicionar, editar e remover materiais.</span>
            <Button onClick={() => go('/materiais')}>Gerir</Button>
          </div>
        </Card>
        <Card title="Setores de Infração" subtitle="Gerir setores de infração">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Adicionar, editar e remover setores.</span>
            <Button onClick={() => go('/setores-infracao')}>Gerir</Button>
          </div>
        </Card>
        <Card title="Tipos de Infração" subtitle="Gerir tipos de infração">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Adicionar, editar e remover tipos de infração.</span>
            <Button onClick={() => go('/tipos-infracao')}>Gerir</Button>
          </div>
        </Card>
        <Card title="Tipo de Ações" subtitle="Gerir tipos de ações para instalações">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Adicionar, editar e remover tipos de ações.</span>
            <Button onClick={() => go('/config/tipos-accao')}>Gerir</Button>
          </div>
        </Card>
      </Grid>
    </div>
  )
}
