import React, { useState } from 'react'
import { Button } from './Button'
import { Card } from './Card'
import {
  BORDER_COLOR,
  PRIMARY_BORDER,
  PRIMARY_COLOR,
  PRIMARY_LIGHT,
  PRIMARY_TEXT_ON,
  RADIUS,
  SEMANTIC_COLORS,
  SHADOW,
  SPACING,
  SURFACE_ELEVATED,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from '../../utils/theme'

export function ManagementHero({
  title,
  subtitle,
  badges = [],
  primaryAction,
  secondaryAction,
}: {
  title: string
  subtitle: string
  badges?: string[]
  primaryAction?: React.ReactNode
  secondaryAction?: React.ReactNode
}) {
  return (
    <div style={heroStyle}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <span style={heroEyebrowStyle}>{title}</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={heroSubtitleStyle}>{subtitle}</p>
        </div>
        {badges.length ? (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {badges.map((badge) => (
              <span key={badge} style={heroBadgeStyle}>{badge}</span>
            ))}
          </div>
        ) : null}
      </div>

      {(primaryAction || secondaryAction) ? (
        <div style={heroActionsStyle}>
          {secondaryAction}
          {primaryAction}
        </div>
      ) : null}
    </div>
  )
}

export function SummaryChip({ children }: { children: React.ReactNode }) {
  return <span style={summaryChipStyle}>{children}</span>
}

export function ActionIconButton({
  children,
  label,
  variant,
  onClick,
}: {
  children: React.ReactNode
  label: string
  variant: 'secondary' | 'danger'
  onClick: () => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <Button
      type="button"
      title={label}
      aria-label={label}
      variant={variant}
      size="sm"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...actionIconButtonBaseStyle,
        ...(hovered ? actionIconButtonHoverStyle[variant] : null),
      } as React.CSSProperties}
    >
      {children}
    </Button>
  )
}

export function SortableHeader({
  label,
  active,
  direction,
  onClick,
  align = 'left',
}: {
  label: string
  active?: boolean
  direction?: 'asc' | 'desc'
  onClick?: () => void
  align?: 'left' | 'right' | 'center'
}) {
  return (
    <th
      onClick={onClick}
      style={tableHeaderCellStyle(onClick, align)}
      title={onClick ? 'Ordenar' : undefined}
      aria-sort={active ? (direction === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <span>{label}</span>{' '}
      {active ? <span aria-hidden>{direction === 'asc' ? '▲' : '▼'}</span> : null}
    </th>
  )
}

export function ManagementModal({
  eyebrow,
  title,
  description,
  error,
  maxWidth = 520,
  onClose,
  children,
}: {
  eyebrow: string
  title: string
  description?: string
  error?: string | null
  maxWidth?: number
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div style={modalBackdropStyle} role="dialog" aria-modal="true" onClick={onClose}>
      <div onClick={(event) => event.stopPropagation()} style={{ ...modalCardStyle, maxWidth }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={modalEyebrowStyle}>{eyebrow}</span>
          <h3 style={{ margin: 0, fontSize: 24, lineHeight: 1.1, color: TEXT_PRIMARY }}>{title}</h3>
          {description ? <p style={modalDescriptionStyle}>{description}</p> : null}
        </div>

        {error ? <div style={modalErrorStyle}>{error}</div> : null}
        {children}
      </div>
    </div>
  )
}

export function DeleteConfirmModal({
  title,
  description,
  itemLabel,
  loading,
  error,
  confirmLabel,
  onCancel,
  onConfirm,
}: {
  title: string
  description: string
  itemLabel: string
  loading: boolean
  error: string | null
  confirmLabel: string
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <ManagementModal
      eyebrow="Confirmação"
      title={title}
      description={`${description} ${itemLabel}`}
      error={error}
      maxWidth={560}
      onClose={() => {
        if (loading) return
        onCancel()
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <Button variant="secondary" onClick={onCancel} disabled={loading}>Cancelar</Button>
        <Button variant="danger" onClick={onConfirm} disabled={loading} loading={loading}>
          {loading ? 'A eliminar…' : confirmLabel}
        </Button>
      </div>
    </ManagementModal>
  )
}

export function PageSectionCard({
  title,
  subtitle,
  extra,
  children,
}: {
  title: string
  subtitle: string
  extra?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Card
      title={title}
      subtitle={subtitle}
      extra={extra}
      style={sectionCardStyle}
    >
      {children}
    </Card>
  )
}

export function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5V19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M5 12H19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export function ArrowRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12H19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M13 6L19 12L13 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function PencilIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 20L7.8 19.2L18.4 8.6C19.2 7.8 19.2 6.6 18.4 5.8L18.2 5.6C17.4 4.8 16.2 4.8 15.4 5.6L4.8 16.2L4 20Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.8 7.2L16.8 10.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 7H19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M9 7V5.5C9 4.7 9.7 4 10.5 4H13.5C14.3 4 15 4.7 15 5.5V7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8 10V17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 10V17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M16 10V17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M6 7L7 19C7 19.6 7.4 20 8 20H16C16.6 20 17 19.6 17 19L18 7" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  )
}

export const stackedFieldStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
}

export const fieldLabelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: '#6f4b1f',
}

export const inputStyle: React.CSSProperties = {
  minHeight: 46,
  borderRadius: RADIUS.md,
  border: `1px solid ${BORDER_COLOR}`,
  padding: '0 14px',
  background: 'rgba(255,255,255,0.96)',
  color: TEXT_PRIMARY,
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.75)',
}

export const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: 110,
  padding: '12px 14px',
  resize: 'vertical',
}

export const filtersGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 14,
}

export const summaryRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap',
}

export const tableWrapStyle: React.CSSProperties = {
  overflowX: 'auto',
  borderRadius: 18,
  border: `1px solid rgba(222, 226, 236, 0.9)`,
  background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(250,250,252,0.96) 100%)',
}

export const bodyCellStyle: React.CSSProperties = {
  padding: '16px 14px',
  borderBottom: '1px solid rgba(229, 231, 235, 0.9)',
  color: '#334155',
  verticalAlign: 'top',
}

export const emptyTableCellStyle: React.CSSProperties = {
  ...bodyCellStyle,
  textAlign: 'center',
  color: TEXT_SECONDARY,
  padding: '30px 14px',
}

export const actionCellStyle: React.CSSProperties = {
  ...bodyCellStyle,
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
}

export const noticeBannerStyle: React.CSSProperties = {
  padding: '12px 14px',
  borderRadius: 16,
  border: '1px solid rgba(245, 158, 11, 0.22)',
  background: 'linear-gradient(180deg, rgba(255,247,237,0.96) 0%, rgba(255,237,213,0.92) 100%)',
  color: '#9a3412',
  boxShadow: '0 10px 24px rgba(180, 83, 9, 0.10)',
}

const heroStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 18,
  flexWrap: 'wrap',
  padding: 24,
  borderRadius: 28,
  border: `1px solid rgba(245, 158, 11, 0.16)`,
  background: 'linear-gradient(135deg, #fff8ef 0%, #fff3df 46%, #fde6ca 100%)',
  boxShadow: '0 24px 48px rgba(194, 65, 12, 0.10)',
}

const heroEyebrowStyle: React.CSSProperties = {
  alignSelf: 'flex-start',
  display: 'inline-flex',
  padding: '6px 12px',
  borderRadius: 999,
  background: 'rgba(255,255,255,0.72)',
  border: `1px solid rgba(234, 88, 12, 0.14)`,
  color: '#9a3412',
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
}

const heroSubtitleStyle: React.CSSProperties = {
  margin: 0,
  maxWidth: 720,
  color: '#7c4b17',
  fontSize: 15,
  lineHeight: 1.6,
}

const heroBadgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  minHeight: 34,
  padding: '0 14px',
  borderRadius: 999,
  background: 'rgba(255,255,255,0.82)',
  border: `1px solid rgba(154, 52, 18, 0.12)`,
  color: '#7c2d12',
  fontWeight: 700,
}

const heroActionsStyle: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  alignItems: 'flex-start',
  flexWrap: 'wrap',
}

const summaryChipStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  minHeight: 34,
  padding: '0 14px',
  borderRadius: 999,
  background: 'linear-gradient(180deg, #fffaf2 0%, #f6ecde 100%)',
  border: '1px solid rgba(101, 74, 32, 0.12)',
  color: '#8d4a17',
  fontSize: 13,
  fontWeight: 700,
}

const actionIconButtonBaseStyle: React.CSSProperties = {
  width: 40,
  minWidth: 40,
  height: 40,
  minHeight: 40,
  padding: 0,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 14,
  transition: 'transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease, color 0.18s ease',
}

const actionIconButtonHoverStyle: Record<'secondary' | 'danger', React.CSSProperties> = {
  secondary: {
    transform: 'translateY(-1px)',
    background: PRIMARY_LIGHT,
    color: PRIMARY_COLOR,
    boxShadow: SHADOW.md,
  },
  danger: {
    transform: 'translateY(-1px)',
    background: 'rgba(254, 226, 226, 0.92)',
    color: SEMANTIC_COLORS.error,
    boxShadow: SHADOW.md,
  },
}

const sectionCardStyle: React.CSSProperties = {
  borderRadius: 24,
  border: `1px solid rgba(245, 158, 11, 0.08)`,
  background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(250,250,252,0.98) 100%)',
  boxShadow: '0 18px 36px rgba(15, 23, 42, 0.06)',
}

const modalBackdropStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 50,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 16,
  background: 'rgba(15, 23, 42, 0.45)',
  backdropFilter: 'blur(6px)',
}

const modalCardStyle: React.CSSProperties = {
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: 18,
  padding: 24,
  borderRadius: 24,
  background: 'linear-gradient(180deg, #ffffff 0%, #fffaf5 100%)',
  border: `1px solid ${PRIMARY_BORDER}`,
  boxShadow: '0 32px 60px rgba(15, 23, 42, 0.22)',
}

const modalEyebrowStyle: React.CSSProperties = {
  alignSelf: 'flex-start',
  display: 'inline-flex',
  minHeight: 30,
  alignItems: 'center',
  padding: '0 12px',
  borderRadius: 999,
  background: PRIMARY_LIGHT,
  color: '#b45309',
  fontWeight: 800,
  fontSize: 12,
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
}

const modalDescriptionStyle: React.CSSProperties = {
  margin: 0,
  color: TEXT_SECONDARY,
  lineHeight: 1.6,
}

const modalErrorStyle: React.CSSProperties = {
  padding: '12px 14px',
  borderRadius: 16,
  border: '1px solid rgba(220, 38, 38, 0.18)',
  background: 'rgba(254, 226, 226, 0.92)',
  color: '#991b1b',
}

const tableHeaderCellStyle = (clickable?: (() => void) | undefined, align: 'left' | 'right' | 'center' = 'left'): React.CSSProperties => ({
  padding: '14px 14px',
  borderBottom: '1px solid rgba(229, 231, 235, 0.95)',
  background: 'rgba(248, 250, 252, 0.9)',
  color: '#6b7280',
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  textAlign: align,
  cursor: clickable ? 'pointer' : 'default',
  whiteSpace: 'nowrap',
})
