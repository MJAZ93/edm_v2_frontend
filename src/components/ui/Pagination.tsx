import React, { useState } from 'react'
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
  showQuickJump?: boolean
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
  showQuickJump = true,
  showFirstLast = true
}: Props) {
  const [jumpPage, setJumpPage] = useState('')

  // Gerar números de páginas visíveis
  const getVisiblePages = () => {
    const delta = 2 // Número de páginas antes e depois da atual
    const range = []
    const rangeWithDots = []

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i)
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...')
    } else {
      rangeWithDots.push(1)
    }

    rangeWithDots.push(...range)

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages)
    } else {
      if (totalPages > 1) rangeWithDots.push(totalPages)
    }

    return rangeWithDots.filter((item, index, arr) => arr.indexOf(item) === index)
  }

  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const page = parseInt(jumpPage)
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      onPageChange(page)
      setJumpPage('')
    }
  }

  const buttonStyle = (active = false, disabled = false): React.CSSProperties => ({
    padding: '8px 12px',
    border: active ? `2px solid ${PRIMARY_COLOR}` : `1px solid ${BORDER_COLOR}`,
    background: active ? PRIMARY_COLOR : SURFACE_ELEVATED,
    color: active ? 'white' : disabled ? TEXT_SECONDARY : TEXT_PRIMARY,
    borderRadius: RADIUS.md,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: 14,
    fontWeight: active ? 600 : 500,
    minWidth: 40,
    textAlign: 'center',
    transition: 'all 0.2s ease-in-out',
    opacity: disabled ? 0.5 : 1
  })

  const inputStyle: React.CSSProperties = {
    padding: '6px 8px',
    border: `1px solid ${BORDER_COLOR}`,
    borderRadius: RADIUS.sm,
    fontSize: 14,
    width: 60,
    textAlign: 'center'
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: SPACING.md,
      alignItems: 'center',
      marginTop: SPACING.lg
    }}>
      {/* Informações e seletor de tamanho da página */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        width: '100%',
        flexWrap: 'wrap',
        gap: SPACING.md
      }}>
        <div style={{ color: TEXT_SECONDARY, fontSize: 14 }}>
          Página {currentPage} de {totalPages} • Total: {totalItems} itens
        </div>
        
        {showPageSizeSelector && onPageSizeChange && (
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            style={{
              padding: '8px 12px',
              border: `1px solid ${BORDER_COLOR}`,
              borderRadius: RADIUS.md,
              fontSize: 14,
              background: SURFACE_ELEVATED
            }}
          >
            <option value={10}>10 por página</option>
            <option value={20}>20 por página</option>
            <option value={50}>50 por página</option>
            <option value={100}>100 por página</option>
          </select>
        )}
      </div>

      {/* Controles de navegação */}
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
            style={buttonStyle(false, currentPage === 1)}
            title="Primeira página"
          >
            <DoubleChevronLeftIcon />
          </button>
        )}

        {/* Página anterior */}
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          style={buttonStyle(false, currentPage <= 1)}
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
              style={buttonStyle(page === currentPage)}
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
          style={buttonStyle(false, currentPage >= totalPages)}
          title="Página seguinte"
        >
          <ChevronRightIcon />
        </button>

        {/* Última página */}
        {showFirstLast && (
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            style={buttonStyle(false, currentPage === totalPages)}
            title="Última página"
          >
            <DoubleChevronRightIcon />
          </button>
        )}
      </div>

      {/* Saltar para página específica */}
      {showQuickJump && totalPages > 10 && (
        <form onSubmit={handleJumpSubmit} style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: SPACING.sm 
        }}>
          <span style={{ fontSize: 14, color: TEXT_SECONDARY }}>
            Ir para página:
          </span>
          <input
            type="number"
            min="1"
            max={totalPages}
            value={jumpPage}
            onChange={(e) => setJumpPage(e.target.value)}
            placeholder={`1-${totalPages}`}
            style={inputStyle}
          />
          <button
            type="submit"
            disabled={!jumpPage || parseInt(jumpPage) < 1 || parseInt(jumpPage) > totalPages}
            style={{
              ...buttonStyle(),
              padding: '6px 12px',
              fontSize: 13
            }}
          >
            Ir
          </button>
        </form>
      )}
    </div>
  )
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