import { cn } from '@/lib/utils'
import type { RiskLevel } from '@/types'

const RISK_STYLES: Record<RiskLevel, { label: string; className: string }> = {
  low: { label: 'Faible', className: 'bg-risk-low/12 text-risk-low' },
  medium: { label: 'Moyen', className: 'bg-risk-medium/15 text-risk-high' },
  high: { label: 'Élevé', className: 'bg-risk-high/12 text-risk-high' },
  critical: {
    label: 'Critique',
    className: 'bg-risk-critical/12 text-risk-critical',
  },
}

export function RiskBadge({
  level,
  label,
  className,
}: {
  level: RiskLevel
  label?: string
  className?: string
}) {
  const risk = RISK_STYLES[level]
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide',
        risk.className,
        className,
      )}
    >
      {label ?? risk.label}
    </span>
  )
}
