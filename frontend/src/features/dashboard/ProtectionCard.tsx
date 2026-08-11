import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronDown } from 'lucide-react'
import { useCountUp } from '@/hooks/useCountUp'
import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/utils'
import type { ScoreCategory } from './dashboard-model'

const RADIUS = 72
const CIRCUMFERENCE = Math.PI * RADIUS

function verdict(value: number) {
  if (value >= 85) return 'Votre coopérative est bien protégée.'
  if (value >= 70) return 'Votre coopérative est bien protégée dans l’ensemble.'
  if (value >= 50) return 'Votre protection est moyenne.'
  return 'Votre protection est insuffisante.'
}

function toneOf(value: number) {
  if (value >= 80) return { bar: 'bg-risk-low', text: 'text-risk-low' }
  if (value >= 65) return { bar: 'bg-risk-medium', text: 'text-risk-high' }
  return { bar: 'bg-risk-high', text: 'text-risk-high' }
}

export function ProtectionCard({
  value,
  previous,
  updatedAt,
  categories,
}: {
  value: number
  previous: number
  updatedAt: string
  categories: ScoreCategory[]
}) {
  const animated = useCountUp(value)
  const [showDetail, setShowDetail] = useState(false)
  const delta = value - previous
  const weakest = [...categories].sort((a, b) => a.value - b.value).slice(0, 2)

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col items-center gap-5 p-5 text-center sm:flex-row sm:items-center sm:gap-8 sm:p-6 sm:text-left">
        <div className="relative h-37.5 w-49 shrink-0">
          <svg
            viewBox="0 0 184 104"
            className="absolute inset-x-0 top-0 w-full"
            role="img"
            aria-label={`Niveau de protection : ${value} sur 100`}
          >
            <path
              d={`M ${92 - RADIUS} 92 A ${RADIUS} ${RADIUS} 0 0 1 ${92 + RADIUS} 92`}
              fill="none"
              stroke="var(--color-line)"
              strokeWidth={12}
              strokeLinecap="round"
            />
            <motion.path
              d={`M ${92 - RADIUS} 92 A ${RADIUS} ${RADIUS} 0 0 1 ${92 + RADIUS} 92`}
              fill="none"
              stroke="var(--color-brand-600)"
              strokeWidth={12}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              initial={{ strokeDashoffset: CIRCUMFERENCE }}
              animate={{ strokeDashoffset: CIRCUMFERENCE * (1 - value / 100) }}
              transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            />
          </svg>

          <div className="absolute inset-x-0 top-11 flex items-start justify-center gap-1 text-brand-900">
            <span className="font-display text-[48px] font-bold leading-none tabular-nums">
              {animated}
            </span>
            <span className="mt-1 font-display text-[17px] font-semibold leading-none text-ink-disabled">
              /100
            </span>
          </div>

          <p className="absolute inset-x-0 bottom-0 text-center text-[13px] font-medium text-ink-muted">
            Niveau de protection
          </p>
        </div>

        <div className="min-w-0">
          <h2 className="font-display text-xl font-semibold leading-snug">
            {verdict(value)}
          </h2>
          <p className="mt-1.5 text-sm text-ink-muted">
            <span
              className={cn(
                'font-medium',
                delta >= 0 ? 'text-risk-low' : 'text-risk-high',
              )}
            >
              {delta === 0
                ? 'Stable'
                : delta > 0
                  ? `En hausse de ${delta} points`
                  : `En baisse de ${Math.abs(delta)} points`}
            </span>{' '}
            cette semaine · {updatedAt}
          </p>

          <div className="mt-4">
            <p className="text-[13px] font-medium text-ink-muted">
              Pour progresser :
            </p>
            <ul className="mt-1.5 space-y-1.5">
              {weakest.map((category) => (
                <li
                  key={category.label}
                  className="flex items-start gap-2.5 text-sm"
                >
                  <span className="mt-1.75 size-1.5 shrink-0 rounded-full bg-risk-medium" />
                  <span className="text-ink-muted">{category.advice}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-line">
        <button
          type="button"
          onClick={() => setShowDetail((open) => !open)}
          aria-expanded={showDetail}
          className="flex w-full items-center justify-center gap-1.5 px-5 py-3 text-[13px] font-medium text-ink-muted transition-colors hover:bg-canvas hover:text-brand-900"
        >
          {showDetail ? 'Masquer le détail' : 'Voir le détail par domaine'}
          <ChevronDown
            className={cn(
              'size-4 transition-transform',
              showDetail && 'rotate-180',
            )}
            aria-hidden
          />
        </button>

        <AnimatePresence initial={false}>
          {showDetail && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
              className="overflow-hidden"
            >
              <ul className="grid gap-x-8 gap-y-4 border-t border-line p-5 sm:grid-cols-2">
                {categories.map((category) => {
                  const tone = toneOf(category.value)
                  return (
                    <li key={category.label}>
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-sm font-medium">
                          {category.label}
                        </span>
                        <span
                          className={cn(
                            'shrink-0 font-display text-sm font-semibold tabular-nums',
                            tone.text,
                          )}
                        >
                          {category.value}
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-canvas">
                        <div
                          className={cn('h-full rounded-full', tone.bar)}
                          style={{ width: `${category.value}%` }}
                        />
                      </div>
                      <p className="mt-1.5 text-[13px] leading-snug text-ink-muted">
                        {category.helper}
                      </p>
                    </li>
                  )
                })}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  )
}
