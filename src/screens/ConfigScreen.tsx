import React from 'react'
import { ArrowRightIcon, Button, Card, Grid } from '../components'

type ConfigItem = {
  title: string
  subtitle: string
  description: string
  cta: string
  path: string
}

const configItems: ConfigItem[] = [
  {
    title: 'Direções de Transporte',
    subtitle: 'Estruture as unidades operacionais e mantenha a navegação coerente.',
    description: 'Adicionar, editar e remover direções com uma experiência de gestão mais clara.',
    cta: 'Gerir direções',
    path: '/direcoes-transportes',
  },
  {
    title: 'Províncias',
    subtitle: 'Mantenha a base territorial organizada para filtros e cruzamentos.',
    description: 'Adicionar, editar e remover províncias com controlo rápido de listagem.',
    cta: 'Gerir províncias',
    path: '/provincias',
  },
  {
    title: 'Regiões',
    subtitle: 'Alinhe o agrupamento territorial usado em dashboards e operações.',
    description: 'Adicionar, editar e remover regiões sem perder contexto do fluxo.',
    cta: 'Gerir regiões',
    path: '/regioes',
  },
  {
    title: 'ASCs',
    subtitle: 'Associe equipas de campo às respetivas regiões com mais visibilidade.',
    description: 'Adicionar, editar e remover ASCs com foco em filtros e relações.',
    cta: 'Gerir ASCs',
    path: '/ascs',
  },
  {
    title: 'Formas de Conhecimento',
    subtitle: 'Padronize as origens de conhecimento usadas nas operações.',
    description: 'Adicionar, editar e remover formas com descrições e pesquisa rápida.',
    cta: 'Gerir formas',
    path: '/formas-conhecimento',
  },
  {
    title: 'Materiais',
    subtitle: 'Centralize materiais, unidades e associações com setores.',
    description: 'Adicionar, editar e remover materiais com melhor leitura da tabela.',
    cta: 'Gerir materiais',
    path: '/materiais',
  },
  {
    title: 'Setores de Infração',
    subtitle: 'Organize as categorias de enquadramento operacional e analítico.',
    description: 'Adicionar, editar e remover setores com ações rápidas na listagem.',
    cta: 'Gerir setores',
    path: '/setores-infracao',
  },
  {
    title: 'Tipos de Infração',
    subtitle: 'Mantenha a taxonomia das infrações consistente em toda a aplicação.',
    description: 'Adicionar, editar e remover tipos com foco em ordenação e pesquisa.',
    cta: 'Gerir tipos',
    path: '/tipos-infracao',
  },
  {
    title: 'Tipos de Ação',
    subtitle: 'Padronize os tipos aplicados nas ações de instalações.',
    description: 'Adicionar, editar e remover tipos de ação com descrições mais claras.',
    cta: 'Gerir tipos de ação',
    path: '/config/tipos-accao',
  },
]

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <Grid columns={2} gap={16}>
        {configItems.map((item) => (
          <Card
            key={item.path}
            title={item.title}
            subtitle={item.subtitle}
            style={configCardStyle}
            extra={(
              <Button variant="secondary" size="sm" onClick={() => go(item.path)}>
                <ArrowRightIcon />
                <span>{item.cta}</span>
              </Button>
            )}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p style={configDescriptionStyle}>{item.description}</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={configChipStyle}>Adicionar</span>
                <span style={configChipStyle}>Listar</span>
                <span style={configChipStyle}>Editar</span>
                <span style={configChipStyle}>Apagar</span>
              </div>
            </div>
          </Card>
        ))}
      </Grid>
    </div>
  )
}

const configCardStyle: React.CSSProperties = {
  borderRadius: 24,
  border: '1px solid rgba(245, 158, 11, 0.08)',
  background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(250,250,252,0.98) 100%)',
  boxShadow: '0 18px 36px rgba(15, 23, 42, 0.06)',
}

const configDescriptionStyle: React.CSSProperties = {
  margin: 0,
  color: '#5f6673',
  lineHeight: 1.6,
}

const configChipStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  minHeight: 30,
  padding: '0 12px',
  borderRadius: 999,
  background: 'linear-gradient(180deg, #fffaf2 0%, #f6ecde 100%)',
  border: '1px solid rgba(101, 74, 32, 0.12)',
  color: '#8d4a17',
  fontSize: 12,
  fontWeight: 700,
}
