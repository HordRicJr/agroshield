import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  Banknote,
  CheckCircle2,
  ChevronDown,
  Lock,
  Sparkles,
  Sprout,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { ColumnDetail } from './ColumnDetail'
import {
  CATEGORY_HELP,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  countByCategory,
  formatNumber,
} from './import-data'
import type { AnalysisResult, CategoryId } from './import-data'

const CATEGORY_ICONS: Record<CategoryId, LucideIcon> = {
  personnel: Users,
  agricole: Sprout,
  financier: Banknote,
  sensible: Lock,
}

/**
 * Le nombre de colonnes sensibles est une information, pas une alerte :
 * le ton reste identique quel que soit le total.
 */
function aiSentence(sensitiveCount: number) {
  if (sensitiveCount === 0) {
    return 'Aucune information sensible n’a été trouvée dans ce fichier : il peut être partagé sans précaution particulière.'
  }
  return `L’IA a identifié automatiquement ${sensitiveCount} information${
    sensitiveCount > 1 ? 's' : ''
  } sensible${sensitiveCount > 1 ? 's' : ''} pour ${
    sensitiveCount > 1 ? 'les' : 'la'
  } protéger.`
}

export function SummaryStep({
  result,
  canCorrect,
  isSaving,
  onCorrect,
  onConfirm,
  onCancel,
}: {
  result: AnalysisResult
  canCorrect: boolean
  isSaving: boolean
  onCorrect: (name: string, category: CategoryId) => void
  onConfirm: () => void
  onCancel: () => void
}) {
  const [showDetail, setShowDetail] = useState(false)
  const counts = countByCategory(result.columns)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.28 }}
      className="space-y-4"
    >
      <div className="flex items-start gap-3.5 rounded-2xl border border-brand-600/25 bg-brand-50 p-5">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-900 text-white">
          <CheckCircle2 className="size-6" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-lg font-semibold text-brand-900">
            Analyse terminée — {formatNumber(result.rows)} lignes analysées
          </h2>
          <p className="mt-0.5 truncate text-[13px] text-brand-900/65">
            {result.fileName}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {CATEGORY_ORDER.map((category, index) => {
          const Icon = CATEGORY_ICONS[category]
          const count = counts[category]
          return (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: index * 0.06 }}
              className={cn(
                'rounded-2xl border bg-surface p-4 shadow-card sm:p-5',
                count === 0 ? 'border-line opacity-60' : 'border-line',
              )}
            >
              <span
                className={cn(
                  'grid size-10 place-items-center rounded-xl',
                  category === 'sensible'
                    ? 'bg-brand-900 text-white'
                    : 'bg-brand-50 text-brand-600',
                )}
              >
                <Icon className="size-5" aria-hidden />
              </span>
              <p className="mt-3.5 font-display text-3xl font-bold leading-none tabular-nums text-brand-900">
                {count}
              </p>
              <p className="mt-1.5 text-sm font-medium leading-snug">
                {CATEGORY_LABELS[category]}
              </p>
              <p className="mt-1 text-[13px] leading-snug text-ink-muted">
                {count === 0 ? 'Rien de ce type' : CATEGORY_HELP[category]}
              </p>
            </motion.div>
          )
        })}
      </div>

      <div className="rounded-2xl border border-ai-900/15 bg-ai-50 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 size-5 shrink-0 text-ai-900" aria-hidden />
          <div>
            <p className="text-sm leading-relaxed text-ai-900">
              {aiSentence(counts.sensible)}
            </p>
            {result.degraded && (
              <p className="mt-1.5 text-[13px] leading-snug text-ai-900/65">
                Analyse simplifiée : le service d’analyse avancée était
                indisponible, le tri repose sur les noms de colonnes. Vérifiez
                les catégories avant de confirmer.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
        <button
          type="button"
          onClick={() => setShowDetail((open) => !open)}
          aria-expanded={showDetail}
          className="flex w-full items-center justify-center gap-1.5 px-5 py-3.5 text-[13px] font-medium text-ink-muted transition-colors hover:bg-canvas hover:text-brand-900"
        >
          {showDetail ? 'Masquer le détail' : 'Voir le détail par colonne'}
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
              transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
              className="overflow-hidden"
            >
              <ColumnDetail
                columns={result.columns}
                canCorrect={canCorrect}
                onCorrect={onCorrect}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-col gap-2.5 pt-1 sm:flex-row-reverse sm:justify-start">
        <Button size="lg" onClick={onConfirm} isLoading={isSaving}>
          Confirmer et enregistrer
        </Button>
        <Button size="lg" variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
      </div>
    </motion.div>
  )
}
