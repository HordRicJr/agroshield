import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, Check, Sparkles, UserCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  type CategoryId,
  type Field,
} from './classification-data'

export function FieldList({
  category,
  fields,
  onBack,
  onReassign,
}: {
  category: CategoryId
  fields: Field[]
  onBack: () => void
  onReassign: (fieldName: string, next: CategoryId) => void
}) {
  const [openField, setOpenField] = useState<string | null>(null)

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.26 }}
      className="space-y-4"
    >
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm font-medium text-ink-muted transition-colors hover:text-brand-900"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Toutes les catégories
      </button>

      <div>
        <h2 className="font-display text-xl font-semibold">
          {CATEGORY_LABELS[category]}
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          {fields.length} champ{fields.length > 1 ? 's' : ''} dans cette
          catégorie
        </p>
      </div>

      <div className="rounded-2xl border border-ai-900/15 bg-ai-50 p-4">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 size-5 shrink-0 text-ai-900" aria-hidden />
          <p className="text-sm leading-relaxed text-ai-900">
            Ces catégories ont été proposées automatiquement par l’IA. Vous
            pouvez les corriger à tout moment.
          </p>
        </div>
      </div>

      <ul className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
        {fields.map((field) => {
          const isOpen = openField === field.name
          return (
            <li
              key={field.name}
              className="border-b border-line last:border-b-0"
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{field.name}</p>
                  <p className="mt-0.5 truncate text-[13px] text-ink-disabled">
                    Exemple : {field.example}
                  </p>
                </div>

                {field.uncertain && !field.reviewed && (
                  <span className="shrink-0 rounded-full bg-risk-medium/20 px-2.5 py-1 text-[11px] font-semibold text-risk-high">
                    À vérifier
                  </span>
                )}

                <span
                  className={cn(
                    'inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold',
                    field.reviewed
                      ? 'bg-brand-50 text-brand-900'
                      : 'bg-ai-50 text-ai-900',
                  )}
                >
                  {field.reviewed ? (
                    <>
                      <UserCheck className="size-3" aria-hidden />
                      Vérifié par un humain
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-3" aria-hidden />
                      Proposé par l’IA
                    </>
                  )}
                </span>

                <button
                  type="button"
                  onClick={() => setOpenField(isOpen ? null : field.name)}
                  aria-expanded={isOpen}
                  className="shrink-0 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-ink-muted transition-colors hover:bg-canvas hover:text-brand-900"
                >
                  {isOpen ? 'Fermer' : 'Corriger'}
                </button>
              </div>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.24, ease: [0.32, 0.72, 0, 1] }}
                    className="overflow-hidden bg-canvas"
                  >
                    <div className="px-4 py-3.5">
                      <p className="mb-2.5 text-[13px] text-ink-muted">
                        À quelle catégorie ce champ appartient-il ?
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {CATEGORY_ORDER.map((option) => {
                          const isCurrent = option === field.category
                          return (
                            <button
                              key={option}
                              type="button"
                              onClick={() => {
                                onReassign(field.name, option)
                                setOpenField(null)
                              }}
                              className={cn(
                                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] transition-colors',
                                isCurrent
                                  ? 'border-brand-900 bg-brand-900 text-white'
                                  : 'border-line bg-surface text-ink-muted hover:border-brand-600 hover:text-brand-900',
                              )}
                            >
                              {isCurrent && (
                                <Check className="size-3.5" aria-hidden />
                              )}
                              {CATEGORY_LABELS[option]}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          )
        })}
      </ul>
    </motion.div>
  )
}
