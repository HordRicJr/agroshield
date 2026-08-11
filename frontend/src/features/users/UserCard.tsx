import { motion } from 'motion/react'
import { ChevronRight, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  ROLE_LABELS,
  STATUS_LABELS,
  initials,
  type Member,
} from './users-data'

const STATUS_BADGE: Record<Member['status'], string> = {
  active: 'bg-brand-50 text-brand-900',
  disabled: 'bg-canvas text-ink-disabled',
}

export function UserCard({
  member,
  index,
  isSelf,
  isActive,
  onSelect,
}: {
  member: Member
  index: number
  isSelf: boolean
  isActive: boolean
  onSelect: () => void
}) {
  const disabled = member.status === 'disabled'

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      aria-current={isActive ? 'true' : undefined}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, delay: Math.min(index, 8) * 0.035 }}
      className={cn(
        'flex w-full items-center gap-3.5 rounded-2xl border bg-surface p-4 text-left shadow-card transition-colors',
        isActive ? 'border-brand-600' : 'border-line hover:border-brand-600',
        disabled && 'opacity-65',
      )}
    >
      <span
        className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-50 font-display text-sm font-bold text-brand-900"
        aria-hidden
      >
        {initials(member.fullName)}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-display text-[16px] font-semibold leading-snug">
            {member.fullName}
          </span>
          {isSelf && (
            <span className="rounded-full bg-canvas px-2 py-0.5 text-[11px] font-medium text-ink-muted">
              Vous
            </span>
          )}
        </span>

        <span className="mt-0.5 block text-[13px] text-ink-muted">
          {ROLE_LABELS[member.role]}
        </span>

        <span className="mt-2 flex flex-wrap items-center gap-1.5">
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold',
              STATUS_BADGE[member.status],
            )}
          >
            {STATUS_LABELS[member.status]}
          </span>

          {member.mfaEnabled && (
            <span className="inline-flex items-center gap-1 rounded-full bg-risk-low/12 px-2.5 py-1 text-[11px] font-semibold text-risk-low">
              <ShieldCheck className="size-3" aria-hidden />
              Double vérification
            </span>
          )}
        </span>
      </span>

      <ChevronRight className="size-5 shrink-0 text-ink-disabled" aria-hidden />
    </motion.button>
  )
}

