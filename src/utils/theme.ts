// Sistema de Cores Institucional EDM
export const PRIMARY_COLORS = {
  50: '#fff7ed',
  100: '#ffedd5', 
  200: '#fed7aa',
  300: '#fdba74', // Laranja claro para hover/bordas
  400: '#fb923c',
  500: '#f97316', // Laranja base do logo
  600: '#ea580c', // Laranja principal (mais escuro, sério)
  700: '#c2410c',
  800: '#9a3412',
  900: '#7c2d12'
} as const

export const NEUTRAL_COLORS = {
  50: '#fafafa',
  100: '#f4f4f5',
  200: '#e4e4e7',
  300: '#d4d4d8',
  400: '#a1a1aa',
  500: '#71717a',
  600: '#52525b',
  700: '#3f3f46',
  800: '#27272a',
  900: '#18181b'
} as const

// Cores principais para uso direto
export const PRIMARY_COLOR = PRIMARY_COLORS[600] // Laranja institucional sério
export const PRIMARY_HOVER = PRIMARY_COLORS[700] // Hover mais escuro
export const PRIMARY_LIGHT = PRIMARY_COLORS[50] // Fundo claro
export const PRIMARY_BORDER = PRIMARY_COLORS[200] // Bordas suaves
export const PRIMARY_TEXT_ON = '#ffffff'

// Cores de superficie e texto (mais sérias)
export const SURFACE_BG = NEUTRAL_COLORS[50] // Fundo neutro limpo
export const SURFACE_ELEVATED = '#ffffff' // Cards e elevações
export const BORDER_COLOR = NEUTRAL_COLORS[200] // Bordas discretas
export const TEXT_PRIMARY = NEUTRAL_COLORS[900] // Texto principal escuro
export const TEXT_SECONDARY = NEUTRAL_COLORS[600] // Texto secundário
export const TEXT_MUTED = NEUTRAL_COLORS[400] // Texto desabilitado

// Cores semânticas institucionais
export const SEMANTIC_COLORS = {
  success: '#16a34a', // Verde institucional
  warning: '#d97706', // Amarelo sério
  error: '#dc2626', // Vermelho institucional
  info: '#0284c7' // Azul institucional
} as const

// Design tokens
export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20
} as const

export const SHADOW = {
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
} as const

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 40
} as const

// Compatibilidade com código existente
export const PRIMARY_TINT = PRIMARY_COLORS[300]
export const SHADOW_SM = SHADOW.sm
export const SHADOW_MD = SHADOW.md
