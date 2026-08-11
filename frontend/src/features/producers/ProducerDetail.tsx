import { useState } from 'react'
import { motion } from 'motion/react'
import { ArrowLeft, Plus, Tractor, Wheat } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/Button'
import { ApiError } from '@/lib/api'
import {
  createFarm,
  formatDate,
  type FarmView,
  type ProducerView,
} from './producers-data'

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line py-2.5 last:border-b-0">
      <dt className="shrink-0 text-[13px] text-ink-muted">{label}</dt>
      <dd className="text-right text-sm font-medium">{value}</dd>
    </div>
  )
}

export function ProducerDetail({
  producer,
  farms,
  canEdit,
  onBack,
}: {
  producer: ProducerView
  farms: FarmView[]
  canEdit: boolean
  onBack: () => void
}) {
  const queryClient = useQueryClient()
  const [isAdding, setIsAdding] = useState(false)
  const [farmName, setFarmName] = useState('')
  const [error, setError] = useState('')

  const addFarm = useMutation({
    mutationFn: () =>
      createFarm({ name: farmName.trim(), producerId: producer.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farms'] })
      setFarmName('')
      setIsAdding(false)
      setError('')
    },
    onError: (err) => {
      setError(
        err instanceof ApiError && !err.isNetworkError
          ? err.message
          : 'L’exploitation n’a pas pu être enregistrée. Réessayez dans un instant.',
      )
    },
  })

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
        Tous les producteurs
      </button>

      <header className="flex items-start gap-4 rounded-2xl border border-brand-600/20 bg-brand-50 p-5">
        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-brand-900 text-white">
          <Wheat className="size-6" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-xl font-semibold leading-tight text-brand-900">
            {producer.displayName}
          </h2>
          <p className="mt-1 text-[13px] text-brand-900/60">
            Dossier {producer.code} · créé le {formatDate(producer.createdAt)}
          </p>
        </div>
      </header>

      <section className="rounded-2xl border border-line bg-surface p-4 shadow-card sm:p-5">
        <h3 className="font-display text-base font-semibold">Informations</h3>
        <dl className="mt-2">
          <Row label="Nom" value={producer.displayName} />
          <Row label="Code du dossier" value={producer.code} />
          <Row label="Enregistré le" value={formatDate(producer.createdAt)} />
        </dl>
      </section>

      <section className="rounded-2xl border border-line bg-surface p-4 shadow-card sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-display text-base font-semibold">
            Exploitations
          </h3>
          {canEdit && !isAdding && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsAdding(true)}
            >
              <Plus className="size-3.5" aria-hidden />
              Ajouter
            </Button>
          )}
        </div>

        {farms.length === 0 && !isAdding ? (
          <p className="mt-3 text-sm text-ink-disabled">
            Aucune exploitation enregistrée pour ce producteur.
          </p>
        ) : (
          <ul className="mt-2">
            {farms.map((farm) => (
              <li
                key={farm.id}
                className="flex items-center gap-3 border-b border-line py-2.5 last:border-b-0"
              >
                <Tractor
                  className="size-4 shrink-0 text-brand-600"
                  aria-hidden
                />
                <span className="min-w-0 flex-1 text-sm font-medium">
                  {farm.name}
                </span>
                <span className="shrink-0 text-[13px] text-ink-muted">
                  depuis le {formatDate(farm.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}

        {isAdding && (
          <form
            className="mt-3 space-y-2.5 border-t border-line pt-3"
            onSubmit={(event) => {
              event.preventDefault()
              if (!farmName.trim()) return
              addFarm.mutate()
            }}
          >
            <label
              htmlFor="farm-name"
              className="block text-[13px] font-medium text-ink-muted"
            >
              Nom de l’exploitation
            </label>
            <input
              id="farm-name"
              type="text"
              value={farmName}
              maxLength={255}
              autoFocus
              onChange={(event) => setFarmName(event.target.value)}
              placeholder="Ex. : Parcelle de Kpalimé"
              className="h-11 w-full rounded-xl border border-line bg-surface px-4 text-sm outline-none transition-colors placeholder:text-ink-disabled focus:border-brand-600"
            />
            {error && <p className="text-[13px] text-risk-critical">{error}</p>}
            <div className="flex gap-2">
              <Button
                type="submit"
                size="sm"
                disabled={!farmName.trim() || addFarm.isPending}
              >
                {addFarm.isPending ? 'Enregistrement…' : 'Enregistrer'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setIsAdding(false)
                  setFarmName('')
                  setError('')
                }}
              >
                Annuler
              </Button>
            </div>
          </form>
        )}
      </section>
    </motion.div>
  )
}

