import { motion } from 'motion/react'
import { Check, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ALERT_ICONS } from './alert-icons'
import { LEVEL_LABELS, STATUS_LABELS, type SecurityAlert } from './alerts-data'
import type { RiskLevel } from '@/types'

const BADGE: Record<RiskLevel, string> = {
  low: 'bg-risk-low/12 text-risk-low',
  medium: 'bg-risk-medium/20 text-risk-high',
  high: 'bg-risk-high/12 text-risk-high',
  critical: 'bg-risk-critical/12 text-risk-critical',
}

const CHIP: Record<RiskLevel, string> = {
  low: 'bg-risk-low/12 text-risk-low',
  medium: 'bg-risk-medium/20 text-risk-high',
  high: 'bg-risk-high/12 text-risk-high',
  critical: 'bg-risk-critical text-white',
}

const RAIL: Record<RiskLevel, string> = {
  low: 'bg-risk-low',
  medium: 'bg-risk-medium',
  high: 'bg-risk-high',
  critical: 'bg-risk-critical',
}

export function AlertCard({
  alert,
  index,
  isActive,
  onSelect,
}: {
  alert: SecurityAlert
  index: number
  isActive: boolean
  onSelect: () => void
}) {
  const Icon = ALERT_ICONS[alert.icon]
  const isDone = alert.status === 'done'

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      aria-current={isActive ? 'true' : undefined}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, delay: index * 0.04 }}
      className={cn(
        'relative flex w-full items-start gap-3.5 overflow-hidden rounded-2xl border bg-surface p-4 text-left shadow-card transition-colors',
        isActive ? 'border-brand-600' : 'border-line hover:border-brand-600',
        isDone && 'opacity-70',
      )}
    >
      {!isDone && (
        <span
          className={cn('absolute inset-y-0 left-0 w-1', RAIL[alert.level])}
          aria-hidden
        />
      )}

      <span
        className={cn(
          'mt-0.5 grid size-10 shrink-0 place-items-center rounded-xl',
          isDone ? 'bg-canvas text-ink-disabled' : CHIP[alert.level],
        )}
      >
        <Icon className="size-5" aria-hidden />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          {!isDone && (
            <span
              className={cn(
                'rounded-full px-2.5 py-1 text-[11px] font-semibold',
                BADGE[alert.level],
              )}
            >
              {LEVEL_LABELS[alert.level]}
            </span>
          )}
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold',
              isDone
                ? 'bg-brand-50 text-brand-900'
                : alert.status === 'progress'
                  ? 'bg-canvas text-ink-muted'
                  : 'bg-brand-900 text-white',
            )}
          >
            {isDone && <Check className="size-3" aria-hidden />}
            {STATUS_LABELS[alert.status]}
          </span>
        </span>

        <span className="mt-2 block font-display text-[17px] font-semibold leading-snug">
          {alert.title}
        </span>

        <span className="mt-1 block text-[13px] text-ink-muted">
          {alert.subject} · {alert.when}
        </span>
      </span>

      <ChevronRight
        className="mt-2 size-5 shrink-0 text-ink-disabled"
        aria-hidden
      />
    </motion.button>
  )
}
