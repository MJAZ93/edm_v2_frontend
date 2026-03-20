import React from 'react'
import { 
  PRIMARY_COLOR, 
  SURFACE_ELEVATED, 
  BORDER_COLOR, 
  TEXT_PRIMARY, 
  TEXT_SECONDARY, 
  RADIUS, 
  SPACING 
} from '../../utils/theme'

type Props = {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (size: number) => void
  showPageSizeSelector?: boolean
  showFirstLast?: boolean
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  showPageSizeSelector = true,
  showFirstLast = true
}: Props) {

  // Gerar números de páginas visíveis
  const getVisiblePages = () => {
    if (totalPages <= 1) return []
    
    const delta = 2 // Número de páginas antes e depois da atual
    const range = []
    const rangeWithDots = []

    // Se há poucas páginas, mostra todas
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        range.push(i)
      }
      return range
    }

    // Sempre inclui a primeira página
    rangeWithDots.push(1)

    // Adiciona "..." se necessário antes do range central
    if (currentPage - delta > 2) {
      rangeWithDots.push('...')
    }

    // Calcula o range central (páginas ao redor da atual)
    const start = Math.max(2, currentPage - delta)
    const end = Math.min(totalPages - 1, currentPage + delta)
    
    for (let i = start; i <= end; i++) {
      if (i !== 1 && i !== totalPages) { // Evita duplicar primeira e última
        range.push(i)
      }
    }
    
    rangeWithDots.push(...range)

    // Adiciona "..." se necessário depois do range central
    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...')
    }

    // Sempre inclui a última página (se diferente da primeira)
    if (totalPages > 1) {
      rangeWithDots.push(totalPages)
    }

    // Remove duplicatas mantendo ordem
    return rangeWithDots.filter((item, index, arr) => {
      if (typeof item === 'string') return true // Mantém todos os "..."
      return arr.indexOf(item) === index // Remove números duplicados
    })
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: SPACING.md,
      marginTop: SPACING.lg,
      padding: 18,
      borderRadius: 22,
      border: '1px solid rgba(101, 74, 32, 0.12)',
      background: 'linear-gradient(180deg, rgba(255, 252, 246, 0.98) 0%, rgba(250, 244, 234, 0.96) 100%)',
      boxShadow: '0 18px 40px rgba(101, 74, 32, 0.08)'
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        width: '100%',
        flexWrap: 'wrap',
        gap: SPACING.md
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <span style={summaryChipStyle}>Página {currentPage} de {totalPages}</span>
          <span style={summaryChipStyle}>Total: {totalItems} itens</span>
        </div>
        
        {showPageSizeSelector && onPageSizeChange && (
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={selectLabelStyle}>Itens por página</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              style={pageSizeSelectStyle}
            >
              <option value={10}>10 por página</option>
              <option value={20}>20 por página</option>
              <option value={50}>50 por página</option>
              <option value={100}>100 por página</option>
            </select>
          </label>
        )}
      </div>

      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: SPACING.sm,
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        {/* Primeira página */}
        {showFirstLast && (
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            style={pageButtonStyle(false, currentPage === 1)}
            title="Primeira página"
          >
            <DoubleChevronLeftIcon />
          </button>
        )}

        {/* Página anterior */}
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          style={pageButtonStyle(false, currentPage <= 1)}
          title="Página anterior"
        >
          <ChevronLeftIcon />
        </button>

        {/* Números das páginas */}
        {totalPages > 1 && getVisiblePages().map((page, index) => (
          page === '...' ? (
            <span key={`dots-${index}`} style={{ 
              padding: '8px 4px', 
              color: TEXT_SECONDARY,
              fontSize: 16,
              fontWeight: 600
            }}>
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page as number)}
              style={pageButtonStyle(page === currentPage)}
              title={`Página ${page}`}
            >
              {page}
            </button>
          )
        ))}

        {/* Página seguinte */}
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          style={pageButtonStyle(false, currentPage >= totalPages)}
          title="Página seguinte"
        >
          <ChevronRightIcon />
        </button>

        {/* Última página */}
        {showFirstLast && (
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            style={pageButtonStyle(false, currentPage === totalPages)}
            title="Última página"
          >
            <DoubleChevronRightIcon />
          </button>
        )}
      </div>

    </div>
  )
}

const summaryChipStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  minHeight: 34,
  padding: '0 12px',
  borderRadius: 999,
  background: 'linear-gradient(180deg, #faf1e3 0%, #f5ead9 100%)',
  border: '1px solid rgba(101, 74, 32, 0.14)',
  color: '#5f6673',
  fontSize: 12,
  fontWeight: 700,
}

const selectLabelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: '.12em',
  textTransform: 'uppercase',
  color: '#8d4a17',
}

const pageSizeSelectStyle: React.CSSProperties = {
  minHeight: 42,
  padding: '0 14px',
  border: `1px solid ${BORDER_COLOR}`,
  borderRadius: 14,
  fontSize: 14,
  fontWeight: 600,
  color: TEXT_PRIMARY,
  background: 'rgba(255,255,255,0.9)',
  boxShadow: '0 10px 24px rgba(101, 74, 32, 0.06)',
}

function pageButtonStyle(active = false, disabled = false): React.CSSProperties {
  return {
    minWidth: 44,
    minHeight: 44,
    padding: '0 14px',
    border: active ? '1px solid rgba(201, 109, 31, 0.24)' : `1px solid ${BORDER_COLOR}`,
    background: active
      ? 'linear-gradient(135deg, #c96d1f 0%, #a85c1c 100%)'
      : 'rgba(255,255,255,0.92)',
    color: active ? '#fff8ef' : disabled ? TEXT_SECONDARY : TEXT_PRIMARY,
    borderRadius: 14,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: 14,
    fontWeight: active ? 800 : 700,
    textAlign: 'center',
    transition: 'all 0.2s ease-in-out',
    opacity: disabled ? 0.48 : 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: active ? '0 14px 26px rgba(201, 109, 31, 0.24)' : '0 10px 22px rgba(101, 74, 32, 0.06)'
  }
}

// Ícones SVG
function ChevronLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function DoubleChevronLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M11 12L7 8L11 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7 12L3 8L7 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function DoubleChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M5 4L9 8L5 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 4L13 8L9 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
