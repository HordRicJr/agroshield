import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CloudOff, Loader2, ShieldCheck } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/lib/utils'
import { AlertCard } from './AlertCard'
import { AlertDetail } from './AlertDetail'
import { acknowledgeAlert, fetchAlerts, type SecurityAlert } from './alerts-data'

type Filter = 'all' | 'critical' | 'done'

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Toutes' },
  { value: 'critical', label: 'Critiques' },
  { value: 'done', label: 'Traitées' },
]

function summarise(list: SecurityAlert[]) {
  const critical = list.filter(
    (alert) => alert.level === 'critical' && alert.status !== 'done',
  ).length
  const open = list.filter((alert) => alert.status !== 'done').length

  if (open === 0) return 'Rien à traiter pour le moment.'

  const parts: string[] = []
  if (critical > 0) {
    parts.push(`${critical} alerte${critical > 1 ? 's' : ''} critique${critical > 1 ? 's' : ''}`)
  }
  parts.push(`${open} à traiter`)
  return `${parts.join(', ')}.`
}

export default function AlertsPage() {
  const queryClient = useQueryClient()
  const { notify } = useToast()
  const [filter, setFilter] = useState<Filter>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const query = useQuery({
    queryKey: ['alerts'],
    queryFn: fetchAlerts,
    refetchInterval: 60_000,
  })

  const acknowledgeMutation = useMutation({
    mutationFn: acknowledgeAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      notify('info', 'Alerte marquée comme traitée.')
    },
    onError: () => {
      notify(
        'high',
        'L’alerte n’a pas pu être marquée comme traitée. Réessayez dans un instant.',
      )
    },
  })

  const list = query.data ?? []
  const openCount = list.filter((alert) => alert.status !== 'done').length

  const visible = list.filter((alert) => {
    if (filter === 'critical') {
      return alert.level === 'critical' && alert.status !== 'done'
    }
    if (filter === 'done') return alert.status === 'done'
    return true
  })

  const selected = list.find((alert) => alert.id === selectedId) ?? null

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Alertes"
        description={query.isSuccess ? summarise(list) : 'Chargement des alertes…'}
      />

      {query.isPending && (
        <div className="rounded-2xl border border-line bg-surface px-6 py-14 text-center shadow-card">
          <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-ai-50 text-ai-900">
            <Loader2 className="size-7 animate-spin" aria-hidden />
          </span>
          <h2 className="mt-5 font-display text-xl font-semibold">
            Chargement des alertes…
          </h2>
        </div>
      )}

      {query.isError && (
        <div className="rounded-2xl border border-line bg-surface px-6 py-14 text-center shadow-card">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-risk-medium/15 text-risk-high">
            <CloudOff className="size-6" aria-hidden />
          </span>
          <h2 className="mt-4 font-display text-xl font-semibold">
            Impossible de charger les alertes
          </h2>
          <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-ink-muted">
            Vérifiez votre connexion internet, puis réessayez.
          </p>
          <Button size="lg" className="mt-6" onClick={() => query.refetch()}>
            Réessayer
          </Button>
        </div>
      )}

      {query.isSuccess &&
        (openCount === 0 && filter === 'all' && list.length === 0 ? (
          <div className="rounded-2xl border border-brand-600/25 bg-brand-50 px-6 py-14 text-center">
            <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-brand-900 text-white">
              <ShieldCheck className="size-8" aria-hidden />
            </span>
            <h2 className="mt-5 font-display text-xl font-semibold text-brand-900">
              Aucune alerte en cours, tout est sous contrôle
            </h2>
            <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-brand-900/70">
              Nous continuons à surveiller les accès et les partages de données
              en arrière-plan. Vous serez prévenu dès qu’il se passe quelque
              chose.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
              {FILTERS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setFilter(item.value)}
                  aria-pressed={filter === item.value}
                  className={cn(
                    'shrink-0 rounded-full border px-4 py-2 text-sm transition-colors',
                    filter === item.value
                      ? 'border-brand-900 bg-brand-900 text-white'
                      : 'border-line bg-surface text-ink-muted hover:border-brand-600 hover:text-brand-900',
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {visible.length === 0 ? (
              <div className="rounded-2xl border border-line bg-surface shadow-card">
                <EmptyState
                  icon={ShieldCheck}
                  title="Rien dans cette catégorie"
                  description="Choisissez un autre filtre pour voir les alertes existantes."
                />
              </div>
            ) : (
              <ul className="space-y-3">
                <AnimatePresence initial={false} mode="popLayout">
                  {visible.map((alert, index) => (
                    <motion.li
                      key={alert.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      transition={{ duration: 0.24 }}
                    >
                      <AlertCard
                        alert={alert}
                        index={index}
                        isActive={alert.id === selectedId}
                        onSelect={() => setSelectedId(alert.id)}
                      />
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            )}
          </>
        ))}

      <AlertDetail
        alert={selected}
        onClose={() => setSelectedId(null)}
        onResolve={(id) => {
          acknowledgeMutation.mutate(id)
          setSelectedId(null)
        }}
      />
    </div>
  )
}
