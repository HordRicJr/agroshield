import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  ChevronLeft,
  ChevronRight,
  CloudOff,
  Plus,
  Search,
  SearchX,
  Users,
} from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { ApiError } from '@/lib/api'
import { cn } from '@/lib/utils'
import { ProducerCard } from './ProducerCard'
import { ProducerDetail } from './ProducerDetail'
import {
  createProducer,
  farmsOf,
  fetchFarms,
  fetchProducers,
  PAGE_SIZE,
  searchProducers,
  suggestCode,
} from './producers-data'

export default function ProducersPage() {
  const { hasPermission } = useAuth()
  const queryClient = useQueryClient()
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [createError, setCreateError] = useState('')

  const canEdit = hasPermission('DATA_WRITE')

  const producersQuery = useQuery({
    queryKey: ['producers'],
    queryFn: fetchProducers,
  })
  const farmsQuery = useQuery({
    queryKey: ['farms'],
    queryFn: fetchFarms,
  })

  const producers = useMemo(
    () => producersQuery.data ?? [],
    [producersQuery.data],
  )
  const farms = farmsQuery.data ?? []

  const create = useMutation({
    mutationFn: () =>
      createProducer({
        code: suggestCode(newName.trim(), producers),
        displayName: newName.trim(),
      }),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['producers'] })
      setNewName('')
      setIsCreating(false)
      setCreateError('')
      setSelectedId(created.id)
    },
    onError: (err) => {
      setCreateError(
        err instanceof ApiError && !err.isNetworkError
          ? err.message
          : 'Le producteur n’a pas pu être enregistré. Réessayez dans un instant.',
      )
    },
  })

  const found = useMemo(
    () => searchProducers(producers, query),
    [producers, query],
  )
  const pageCount = Math.max(1, Math.ceil(found.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount - 1)
  const visible = found.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE)
  const selected = producers.find((producer) => producer.id === selectedId) ?? null

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Producteurs"
        description="Les producteurs et exploitations rattachés à votre coopérative."
      />

      {producersQuery.isPending ? (
        <LoadingList />
      ) : producersQuery.isError ? (
        <div className="rounded-2xl border border-line bg-surface px-6 py-14 text-center shadow-card">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-risk-medium/15 text-risk-high">
            <CloudOff className="size-6" aria-hidden />
          </span>
          <h2 className="mt-4 font-display text-xl font-semibold">
            Impossible de charger les producteurs
          </h2>
          <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-ink-muted">
            Vérifiez votre connexion internet, puis réessayez.
          </p>
          <Button
            size="lg"
            className="mt-6"
            onClick={() => producersQuery.refetch()}
          >
            Réessayer
          </Button>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {selected ? (
            <ProducerDetail
              key={selected.id}
              producer={selected}
              farms={farmsOf(farms, selected.id)}
              canEdit={canEdit}
              onBack={() => setSelectedId(null)}
            />
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.24 }}
              className="space-y-4"
            >
              {(producers.length > 0 || isCreating) && (
                <div className="flex gap-2.5">
                  {producers.length > 0 && (
                    <div className="relative flex-1">
                      <Search
                        className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-disabled"
                        aria-hidden
                      />
                      <input
                        type="search"
                        value={query}
                        onChange={(event) => {
                          setQuery(event.target.value)
                          setPage(0)
                        }}
                        placeholder="Chercher un nom ou un code"
                        aria-label="Chercher un producteur par nom ou par code"
                        className="h-12 w-full rounded-xl border border-line bg-surface pl-11 pr-4 text-sm outline-none transition-colors placeholder:text-ink-disabled focus:border-brand-600"
                      />
                    </div>
                  )}
                  {canEdit && !isCreating && (
                    <Button
                      size="lg"
                      className="shrink-0"
                      onClick={() => setIsCreating(true)}
                    >
                      <Plus className="size-4" aria-hidden />
                      Ajouter
                    </Button>
                  )}
                </div>
              )}

              {isCreating && (
                <form
                  className="space-y-2.5 rounded-2xl border border-line bg-surface p-4 shadow-card sm:p-5"
                  onSubmit={(event) => {
                    event.preventDefault()
                    if (!newName.trim()) return
                    create.mutate()
                  }}
                >
                  <label
                    htmlFor="producer-name"
                    className="block text-[13px] font-medium text-ink-muted"
                  >
                    Nom complet du producteur
                  </label>
                  <input
                    id="producer-name"
                    type="text"
                    value={newName}
                    maxLength={255}
                    autoFocus
                    onChange={(event) => setNewName(event.target.value)}
                    placeholder="Ex. : Yao Mensah"
                    className="h-11 w-full rounded-xl border border-line bg-surface px-4 text-sm outline-none transition-colors placeholder:text-ink-disabled focus:border-brand-600"
                  />
                  {createError && (
                    <p className="text-[13px] text-risk-critical">
                      {createError}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      size="sm"
                      disabled={!newName.trim() || create.isPending}
                    >
                      {create.isPending ? 'Enregistrement…' : 'Enregistrer'}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setIsCreating(false)
                        setNewName('')
                        setCreateError('')
                      }}
                    >
                      Annuler
                    </Button>
                  </div>
                </form>
              )}

              {producers.length === 0 && !isCreating ? (
                <div className="rounded-2xl border border-line bg-surface shadow-card">
                  <EmptyState
                    icon={Users}
                    title="Aucun producteur enregistré"
                    description="Ajoutez votre premier producteur ou importez un fichier : les dossiers apparaîtront ici."
                    action={
                      canEdit ? (
                        <Button onClick={() => setIsCreating(true)}>
                          <Plus className="size-4" aria-hidden />
                          Ajouter un producteur
                        </Button>
                      ) : undefined
                    }
                  />
                </div>
              ) : found.length === 0 && producers.length > 0 ? (
                <div className="rounded-2xl border border-line bg-surface shadow-card">
                  <EmptyState
                    icon={SearchX}
                    title="Aucun résultat"
                    description={`Aucun producteur ne correspond à « ${query.trim()} ». Vérifiez l’orthographe ou essayez un code de dossier.`}
                  />
                </div>
              ) : (
                <>
                  <ul className="space-y-3">
                    {visible.map((producer, index) => (
                      <li key={producer.id}>
                        <ProducerCard
                          producer={producer}
                          farms={farmsOf(farms, producer.id)}
                          index={index}
                          onSelect={() => setSelectedId(producer.id)}
                        />
                      </li>
                    ))}
                  </ul>

                  {pageCount > 1 && (
                    <nav
                      className="flex items-center justify-between gap-3 pt-1"
                      aria-label="Pages de résultats"
                    >
                      <button
                        type="button"
                        onClick={() => setPage(safePage - 1)}
                        disabled={safePage === 0}
                        className={cn(
                          'flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                          safePage === 0
                            ? 'cursor-not-allowed text-ink-disabled'
                            : 'text-brand-900 hover:bg-brand-50',
                        )}
                      >
                        <ChevronLeft className="size-4" aria-hidden />
                        Précédent
                      </button>

                      <span className="text-[13px] text-ink-muted">
                        Page {safePage + 1} sur {pageCount}
                      </span>

                      <button
                        type="button"
                        onClick={() => setPage(safePage + 1)}
                        disabled={safePage >= pageCount - 1}
                        className={cn(
                          'flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                          safePage >= pageCount - 1
                            ? 'cursor-not-allowed text-ink-disabled'
                            : 'text-brand-900 hover:bg-brand-50',
                        )}
                      >
                        Suivant
                        <ChevronRight className="size-4" aria-hidden />
                      </button>
                    </nav>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  )
}

function LoadingList() {
  return (
    <div role="status" aria-live="polite" className="space-y-3">
      <span className="sr-only">Chargement des producteurs…</span>
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-3.5 rounded-2xl border border-line bg-surface p-4 shadow-card"
        >
          <span className="size-11 shrink-0 animate-pulse rounded-xl bg-canvas" />
          <span className="min-w-0 flex-1 space-y-2">
            <span
              className="block h-4 animate-pulse rounded bg-canvas"
              style={{ width: `${58 - (index % 3) * 10}%` }}
            />
            <span className="block h-3 w-40 animate-pulse rounded bg-canvas" />
          </span>
        </div>
      ))}
    </div>
  )
}

