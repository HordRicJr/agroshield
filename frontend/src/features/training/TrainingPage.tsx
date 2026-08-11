import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  BookOpen,
  Check,
  ChevronDown,
  CloudOff,
  GraduationCap,
  Loader2,
} from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/lib/utils'
import {
  completeModule,
  completionFor,
  fetchModules,
  fetchMyResults,
  isCompleted,
  moduleContent,
} from './training-data'
import type { TrainingModuleView, TrainingResultView } from '@/types/api'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
  })
}

function ModuleCard({
  module,
  result,
  open,
  onToggle,
  onComplete,
  isCompleting,
}: {
  module: TrainingModuleView
  result: TrainingResultView | undefined
  open: boolean
  onToggle: () => void
  onComplete: () => void
  isCompleting: boolean
}) {
  const done = Boolean(result)

  return (
    <motion.li
      layout
      className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card"
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3.5 p-4 text-left sm:p-5"
      >
        <span
          className={cn(
            'grid size-11 shrink-0 place-items-center rounded-xl',
            done ? 'bg-brand-900 text-white' : 'bg-brand-50 text-brand-600',
          )}
        >
          {done ? (
            <Check className="size-5" aria-hidden />
          ) : (
            <BookOpen className="size-5" aria-hidden />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{module.title}</p>
          <p className="mt-0.5 text-[13px] text-ink-muted">
            {done && result?.completedAt
              ? `Terminé le ${formatDate(result.completedAt)}`
              : 'Pas encore lu'}
          </p>
        </div>
        <ChevronDown
          className={cn(
            'size-4 shrink-0 text-ink-muted transition-transform',
            open && 'rotate-180',
          )}
          aria-hidden
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-2.5 border-t border-line px-4 pb-4 pt-4 sm:px-5">
              {moduleContent(module).map((paragraph, index) => (
                <p key={index} className="text-sm leading-relaxed text-ink-muted">
                  {paragraph}
                </p>
              ))}
              <div className="pt-1.5">
                {done ? (
                  <p className="flex items-center gap-1.5 text-[13px] font-medium text-brand-900">
                    <Check className="size-4" aria-hidden />
                    Module déjà marqué comme lu
                  </p>
                ) : (
                  <Button size="sm" onClick={onComplete} isLoading={isCompleting}>
                    <Check className="size-4" aria-hidden />
                    Marquer comme lu
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  )
}

export default function TrainingPage() {
  const queryClient = useQueryClient()
  const { notify } = useToast()
  const [openId, setOpenId] = useState<string | null>(null)

  const modulesQuery = useQuery({ queryKey: ['training', 'modules'], queryFn: fetchModules })
  const resultsQuery = useQuery({ queryKey: ['training', 'results', 'me'], queryFn: fetchMyResults })

  const completeMutation = useMutation({
    mutationFn: (moduleId: string) => completeModule(moduleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training', 'results', 'me'] })
      notify('info', 'Module marqué comme lu — merci !')
    },
    onError: () => {
      notify('high', 'Impossible d’enregistrer votre lecture. Réessayez.')
    },
  })

  const modules = modulesQuery.data ?? []
  const results = resultsQuery.data ?? []
  const completedCount = modules.filter((m) => isCompleted(m.id, results)).length

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Formation sécurité"
        description={
          modulesQuery.isSuccess
            ? `${completedCount} sur ${modules.length} module${modules.length > 1 ? 's' : ''} lu${completedCount > 1 ? 's' : ''}.`
            : 'Chargement des modules…'
        }
      />

      {modulesQuery.isPending && (
        <div className="rounded-2xl border border-line bg-surface px-6 py-14 text-center shadow-card">
          <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-ai-50 text-ai-900">
            <Loader2 className="size-7 animate-spin" aria-hidden />
          </span>
          <h2 className="mt-5 font-display text-xl font-semibold">Chargement…</h2>
        </div>
      )}

      {modulesQuery.isError && (
        <div className="rounded-2xl border border-line bg-surface px-6 py-14 text-center shadow-card">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-risk-medium/15 text-risk-high">
            <CloudOff className="size-6" aria-hidden />
          </span>
          <h2 className="mt-4 font-display text-xl font-semibold">
            Impossible de charger les modules
          </h2>
          <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-ink-muted">
            Vérifiez votre connexion internet, puis réessayez.
          </p>
          <Button size="lg" className="mt-6" onClick={() => modulesQuery.refetch()}>
            Réessayer
          </Button>
        </div>
      )}

      {modulesQuery.isSuccess &&
        (modules.length === 0 ? (
          <div className="rounded-2xl border border-line bg-surface shadow-card">
            <EmptyState
              icon={GraduationCap}
              title="Aucun module pour le moment"
              description="Le responsable sécurité n’a pas encore publié de module de sensibilisation."
            />
          </div>
        ) : (
          <ul className="space-y-3">
            {modules.map((module) => (
              <ModuleCard
                key={module.id}
                module={module}
                result={completionFor(module.id, results)}
                open={openId === module.id}
                onToggle={() => setOpenId((current) => (current === module.id ? null : module.id))}
                onComplete={() => completeMutation.mutate(module.id)}
                isCompleting={completeMutation.isPending && completeMutation.variables === module.id}
              />
            ))}
          </ul>
        ))}
    </div>
  )
}
