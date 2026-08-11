import { motion } from 'motion/react'
import {
  Banknote,
  ChevronRight,
  Lock,
  Sprout,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  CATEGORY_HELP,
  CATEGORY_LABELS,
  type CategoryId,
} from './classification-data'

const ICONS: Record<CategoryId, LucideIcon> = {
  personnel: Users,
  agricole: Sprout,
  financier: Banknote,
  sensible: Lock,
}

/** Fonds doux : vert brume pour les catégories courantes, bleu brume ailleurs. */
const SURFACE: Record<CategoryId, string> = {
  personnel: 'bg-brand-50 border-brand-600/20',
  agricole: 'bg-brand-50 border-brand-600/20',
  financier: 'bg-ai-50 border-ai-900/15',
  sensible: 'bg-ai-50 border-ai-900/15',
}

const ICON_CHIP: Record<CategoryId, string> = {
  personnel: 'bg-brand-900 text-white',
  agricole: 'bg-brand-900 text-white',
  financier: 'bg-ai-900 text-white',
  sensible: 'bg-ai-900 text-white',
}

const TEXT: Record<CategoryId, string> = {
  personnel: 'text-brand-900',
  agricole: 'text-brand-900',
  financier: 'text-ai-900',
  sensible: 'text-ai-900',
}

export function CategoryCard({
  category,
  count,
  uncertain,
  index,
  onSelect,
}: {
  category: CategoryId
  count: number
  uncertain: number
  index: number
  onSelect: () => void
}) {
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: index * 0.06 }}
      className={cn(
        'group flex flex-col rounded-2xl border p-4 text-left transition-shadow hover:shadow-card sm:p-5',
        SURFACE[category],
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            'grid size-10 place-items-center rounded-xl',
            ICON_CHIP[category],
          )}
        >
          {(() => {
            const Icon = ICONS[category]
            return <Icon className="size-5" aria-hidden />
          })()}
        </span>

        {uncertain > 0 && (
          <span className="rounded-full bg-risk-medium/20 px-2.5 py-1 text-[11px] font-semibold text-risk-high">
            {uncertain} à vérifier
          </span>
        )}
      </div>

      <p
        className={cn(
          'mt-3.5 font-display text-3xl font-bold leading-none tabular-nums',
          TEXT[category],
        )}
      >
        {count}
      </p>
      <p className="mt-1.5 text-sm font-medium leading-snug">
        {CATEGORY_LABELS[category]}
      </p>
      <p className="mt-1 text-[13px] leading-snug text-ink-muted">
        {CATEGORY_HELP[category]}
      </p>

      <span
        className={cn(
          'mt-3.5 flex items-center gap-1 text-[13px] font-medium',
          TEXT[category],
        )}
      >
        Voir les champs
        <ChevronRight
          className="size-4 transition-transform group-hover:translate-x-0.5"
          aria-hidden
        />
      </span>
    </motion.button>
  )
}
