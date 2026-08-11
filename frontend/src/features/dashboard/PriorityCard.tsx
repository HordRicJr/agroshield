import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight, Check, ChevronDown, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ROUTES } from '@/config/routes'
import { cn } from '@/lib/utils'
import type { PriorityItem } from './dashboard-model'

export function PriorityCard({
  item,
  onResolve,
  isResolving = false,
}: {
  item: PriorityItem
  onResolve?: (id: string) => void
  isResolving?: boolean
}) {
  const [showWhy, setShowWhy] = useState(false)
  const navigate = useNavigate()

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="overflow-hidden rounded-2xl border-2 border-risk-critical/25 bg-surface shadow-card"
    >
      <div className="flex items-center gap-2 bg-risk-critical/8 px-5 py-2.5">
        <span className="size-2 rounded-full bg-risk-critical" aria-hidden />
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-risk-critical">
          À regarder en premier
        </span>
      </div>

      <div className="p-5 sm:p-6">
        <h2 className="font-display text-xl font-semibold leading-snug sm:text-[22px]">
          {item.title}
        </h2>

        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-muted">
          {item.plain}
        </p>

        <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
          <Button size="lg" onClick={() => navigate(ROUTES.alerts)}>
            <ArrowRight className="size-4" aria-hidden />
            {item.primaryAction}
          </Button>
          {onResolve && (
            <Button
              variant="secondary"
              size="lg"
              onClick={() => onResolve(item.id)}
              isLoading={isResolving}
            >
              {!isResolving && <Check className="size-4" aria-hidden />}
              {item.secondaryAction}
            </Button>
          )}
        </div>
      </div>

      <div className="border-t border-line">
        <button
          type="button"
          onClick={() => setShowWhy((open) => !open)}
          aria-expanded={showWhy}
          className="flex w-full items-center gap-2 px-5 py-3 text-[13px] font-medium text-ai-900 transition-colors hover:bg-ai-50"
        >
          <Sparkles className="size-3.5 shrink-0" aria-hidden />
          Pourquoi vous voyez ce message
          <ChevronDown
            className={cn(
              'ml-auto size-4 transition-transform',
              showWhy && 'rotate-180',
            )}
            aria-hidden
          />
        </button>

        <AnimatePresence initial={false}>
          {showWhy && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
              className="overflow-hidden"
            >
              <div className="bg-ai-50 px-5 py-4">
                <ul className="space-y-2">
                  {item.reasons.map((reason) => (
                    <li
                      key={reason}
                      className="flex items-start gap-2.5 text-sm leading-snug text-ai-900"
                    >
                      <span className="mt-1.75 size-1.5 shrink-0 rounded-full bg-ai-900/40" />
                      {reason}
                    </li>
                  ))}
                </ul>
                {item.person && item.role && (
                  <p className="mt-3 text-[13px] leading-snug text-ai-900/65">
                    Compte concerné : {item.person}, {item.role.toLowerCase()}.
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.section>
  )
}
