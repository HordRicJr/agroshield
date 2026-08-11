import { useEffect } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Lock, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ACTION_ICONS } from './audit-icons'
import {
  ACTION_LABELS,
  LEVEL_LABELS,
  OUTCOME_LABELS,
  type AuditEntry,
} from './audit-data'

const HEAD: Record<AuditEntry['level'], string> = {
  low: 'bg-canvas border-line',
  medium: 'bg-risk-medium/10 border-risk-medium/30',
  high: 'bg-risk-high/8 border-risk-high/30',
  critical: 'bg-risk-critical/8 border-risk-critical/30',
}

const CHIP: Record<AuditEntry['level'], string> = {
  low: 'bg-surface text-ink-muted',
  medium: 'bg-risk-medium/20 text-risk-high',
  high: 'bg-risk-high/12 text-risk-high',
  critical: 'bg-risk-critical text-white',
}

const OUTCOME_TEXT: Record<AuditEntry['outcome'], string> = {
  allowed: 'text-risk-low',
  blocked: 'text-risk-critical',
  watched: 'text-risk-high',
}

export function AuditDetail({
  entry,
  onClose,
}: {
  entry: AuditEntry | null
  onClose: () => void
}) {
  useEffect(() => {
    if (!entry) return
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [entry, onClose])

  return (
    <AnimatePresence>
      {entry && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-ink/35 backdrop-blur-[2px]"
            aria-hidden
          />

          <motion.div
            key={entry.id}
            role="dialog"
            aria-modal="true"
            aria-label={`Détail : ${entry.description}`}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
            className={cn(
              'fixed inset-x-0 bottom-0 z-50 flex max-h-[88vh] flex-col rounded-t-3xl bg-surface',
              'sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-[440px] sm:rounded-none sm:rounded-l-3xl',
            )}
          >
            <header
              className={cn(
                'flex items-start gap-3 border-b p-5',
                HEAD[entry.level],
              )}
            >
              <span
                className={cn(
                  'grid size-11 shrink-0 place-items-center rounded-xl',
                  CHIP[entry.level],
                )}
              >
                {(() => {
                  const Icon = ACTION_ICONS[entry.action]
                  return <Icon className="size-5" aria-hidden />
                })()}
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-muted">
                  {ACTION_LABELS[entry.action]}
                </p>
                <h2 className="mt-1 font-display text-lg font-semibold leading-snug">
                  {entry.description}
                </h2>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Fermer le détail"
                className="-mr-1.5 -mt-1 grid size-9 shrink-0 place-items-center rounded-lg text-ink-muted transition-colors hover:bg-surface/70 hover:text-ink"
              >
                <X className="size-5" aria-hidden />
              </button>
            </header>

            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
              <dl className="divide-y divide-line overflow-hidden rounded-2xl border border-line">
                <Line label="Quoi" value={ACTION_LABELS[entry.action]} />
                <Line
                  label="Quand"
                  value={`${entry.day} à ${entry.time}`}
                />
                <Line label="Concerne" value={entry.resource} />
                <Line
                  label="Résultat"
                  value={OUTCOME_LABELS[entry.outcome]}
                  valueClassName={cn('font-medium', OUTCOME_TEXT[entry.outcome])}
                />
                <Line
                  label="Niveau"
                  value={LEVEL_LABELS[entry.level]}
                  valueClassName={
                    entry.level === 'low' ? undefined : 'font-medium'
                  }
                />
              </dl>

              {entry.note && (
                <p className="rounded-2xl border border-line bg-canvas p-4 text-sm leading-relaxed text-ink-muted">
                  {entry.note}
                </p>
              )}

              <p className="flex items-start gap-2.5 text-[13px] leading-relaxed text-ink-muted">
                <Lock className="mt-0.5 size-4 shrink-0" aria-hidden />
                Cette entrée fait partie du journal officiel et ne peut pas être
                modifiée.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function Line({
  label,
  value,
  valueClassName,
}: {
  label: string
  value: string
  valueClassName?: string
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 px-4 py-3">
      <dt className="shrink-0 text-[13px] text-ink-muted">{label}</dt>
      <dd className={cn('text-right text-sm', valueClassName)}>{value}</dd>
    </div>
  )
}
