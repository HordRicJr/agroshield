import { motion } from 'motion/react'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ACTION_ICONS } from './audit-icons'
import { OUTCOME_LABELS, type AuditEntry } from './audit-data'

const OUTCOME_BADGE: Record<AuditEntry['outcome'], string> = {
  allowed: 'bg-risk-low/12 text-risk-low',
  blocked: 'bg-risk-critical/12 text-risk-critical',
  watched: 'bg-risk-medium/20 text-risk-high',
}

const CHIP: Record<AuditEntry['level'], string> = {
  low: 'bg-canvas text-ink-muted',
  medium: 'bg-risk-medium/18 text-risk-high',
  high: 'bg-risk-high/12 text-risk-high',
  critical: 'bg-risk-critical/12 text-risk-critical',
}

export function AuditRow({
  entry,
  index,
  isActive,
  onSelect,
}: {
  entry: AuditEntry
  index: number
  isActive: boolean
  onSelect: () => void
}) {
  const Icon = ACTION_ICONS[entry.action]
  const notable = entry.level !== 'low'

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      aria-current={isActive ? 'true' : undefined}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: Math.min(index, 8) * 0.03 }}
      className={cn(
        'relative flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-canvas',
        isActive && 'bg-canvas',
      )}
    >
      {notable && (
        <span
          className={cn(
            'absolute inset-y-1.5 left-0 w-[3px] rounded-full',
            entry.level === 'critical'
              ? 'bg-risk-critical'
              : entry.level === 'high'
                ? 'bg-risk-high'
                : 'bg-risk-medium',
          )}
          aria-hidden
        />
      )}

      <span
        className={cn(
          'mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl',
          CHIP[entry.level],
        )}
      >
        <Icon className="size-4.5" aria-hidden />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-medium leading-snug">
          {entry.description}
        </span>

        <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[13px] text-ink-muted">
          <span className="tabular-nums">
            {entry.day} · {entry.time}
          </span>
          {(notable || entry.outcome !== 'allowed') && (
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                OUTCOME_BADGE[entry.outcome],
              )}
            >
              {OUTCOME_LABELS[entry.outcome]}
            </span>
          )}
        </span>
      </span>

      <ChevronRight
        className="mt-2 size-4.5 shrink-0 text-ink-disabled"
        aria-hidden
      />
    </motion.button>
  )
}
