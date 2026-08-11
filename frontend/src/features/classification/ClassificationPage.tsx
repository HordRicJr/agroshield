import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CloudOff, FileSpreadsheet, Loader2, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/Button'
import { buttonStyles } from '@/components/ui/button-styles'
import { ROUTES } from '@/config/routes'
import { useAuth } from '@/hooks/useAuth'
import { CategoryCard } from './CategoryCard'
import { FieldList } from './FieldList'
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  countIn,
  countUncertain,
  fetchClassifications,
  formatNumber,
  reclassify,
  toField,
  type CategoryId,
  type Correction,
} from './classification-data'

export default function ClassificationPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [corrections, setCorrections] = useState<Correction[]>([])
  const [openCategory, setOpenCategory] = useState<CategoryId | null>(null)

  const query = useQuery({
    queryKey: ['classifications'],
    queryFn: fetchClassifications,
  })

  const reclassifyMutation = useMutation({
    mutationFn: ({ id, category }: { id: string; category: CategoryId }) =>
      reclassify(id, category),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classifications'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  const fields = (query.data ?? []).map(toField)
  const uncertainTotal = CATEGORY_ORDER.reduce(
    (total, category) => total + countUncertain(fields, category),
    0,
  )

  function handleReassign(fieldName: string, next: CategoryId) {
    const field = fields.find((item) => item.name === fieldName)
    if (!field || field.category === next) return

    reclassifyMutation.mutate({ id: field.id, category: next })
    setCorrections((current) => [
      {
        field: fieldName,
        from: field.category,
        to: next,
        author: user?.fullName ?? 'Vous',
        date: "aujourd'hui",
      },
      ...current,
    ])
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Classification des données"
        description={
          query.isPending
            ? 'Chargement de vos données classées…'
            : fields.length === 0
              ? 'Aucun fichier n’a encore été analysé.'
              : `${formatNumber(fields.length)} champ${fields.length > 1 ? 's' : ''} protégé${fields.length > 1 ? 's' : ''}, réparti${fields.length > 1 ? 's' : ''} en ${CATEGORY_ORDER.length} catégories.`
        }
      />

      {query.isPending && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-line bg-surface px-6 py-14 text-center shadow-card"
        >
          <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-ai-50 text-ai-900">
            <Loader2 className="size-7 animate-spin" aria-hidden />
          </span>
          <h2 className="mt-5 font-display text-xl font-semibold">
            Chargement de vos données…
          </h2>
          <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-ink-muted">
            Les catégories s’afficheront ici dans quelques instants.
          </p>
        </motion.div>
      )}

      {query.isError && (
        <div className="rounded-2xl border border-line bg-surface px-6 py-14 text-center shadow-card">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-risk-medium/15 text-risk-high">
            <CloudOff className="size-6" aria-hidden />
          </span>
          <h2 className="mt-4 font-display text-xl font-semibold">
            Impossible de charger vos données
          </h2>
          <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-ink-muted">
            Vérifiez votre connexion internet, puis réessayez.
          </p>
          <Button size="lg" className="mt-6" onClick={() => query.refetch()}>
            Réessayer
          </Button>
        </div>
      )}

      {query.isSuccess && fields.length === 0 && (
        <div className="rounded-2xl border border-line bg-surface shadow-card">
          <EmptyState
            icon={FileSpreadsheet}
            title="Aucune donnée classée pour le moment"
            description="Importez un premier fichier Excel ou CSV : nous trierons automatiquement son contenu par catégorie."
            action={
              <Link to={ROUTES.import} className={buttonStyles({ size: 'lg' })}>
                Importer un fichier
              </Link>
            }
          />
        </div>
      )}

      {query.isSuccess && fields.length > 0 && (
        <AnimatePresence mode="wait">
          {openCategory ? (
            <FieldList
              key={openCategory}
              category={openCategory}
              fields={fields.filter((field) => field.category === openCategory)}
              onBack={() => setOpenCategory(null)}
              onReassign={handleReassign}
            />
          ) : (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.24 }}
              className="space-y-5"
            >
              {uncertainTotal === 0 ? (
                <div className="flex items-start gap-3 rounded-2xl border border-brand-600/25 bg-brand-50 p-4">
                  <ShieldCheck
                    className="mt-0.5 size-5 shrink-0 text-brand-900"
                    aria-hidden
                  />
                  <p className="text-sm leading-relaxed text-brand-900">
                    Toutes vos données sont classées. Rien ne demande votre
                    attention.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-ink-muted">
                  {uncertainTotal} champ{uncertainTotal > 1 ? 's' : ''} mérite
                  {uncertainTotal > 1 ? 'nt' : ''} un coup d’œil : ouvrez la
                  catégorie concernée pour confirmer ou corriger.
                </p>
              )}

              <div className="grid grid-cols-2 gap-3">
                {CATEGORY_ORDER.map((category, index) => (
                  <CategoryCard
                    key={category}
                    category={category}
                    count={countIn(fields, category)}
                    uncertain={countUncertain(fields, category)}
                    index={index}
                    onSelect={() => setOpenCategory(category)}
                  />
                ))}
              </div>

              {corrections.length > 0 && (
                <section className="border-t border-line pt-4">
                  <h2 className="text-[13px] font-medium text-ink-muted">
                    Corrections faites à la main
                  </h2>
                  <ul className="mt-2.5 space-y-1.5">
                    {corrections.slice(0, 4).map((correction, index) => (
                      <li
                        key={`${correction.field}-${index}`}
                        className="text-[13px] leading-snug text-ink-disabled"
                      >
                        <span className="text-ink-muted">
                          {correction.field}
                        </span>{' '}
                        déplacé vers {CATEGORY_LABELS[correction.to]} — modifié
                        par {correction.author}, le {correction.date}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  )
}
