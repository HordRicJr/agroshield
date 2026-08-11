import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  ChevronLeft,
  ChevronRight,
  CloudOff,
  History,
  RotateCcw,
  Search,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { AuditSelect } from './AuditSelect'
import { AuditRow } from './AuditRow'
import { AuditDetail } from './AuditDetail'
import {
  ACTION_LABELS,
  fetchAuditEntries,
  groupByDay,
  type AuditAction,
  type AuditEntry,
} from './audit-data'

type Period = 'all' | 'today' | 'yesterday' | 'week'

const PER_PAGE = 6

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: 'all', label: 'Depuis le début' },
  { value: 'today', label: "Aujourd'hui" },
  { value: 'yesterday', label: 'Hier' },
  { value: 'week', label: 'Les 7 derniers jours' },
]

const ACTION_OPTIONS = [
  { value: 'all', label: 'Toutes les actions' },
  ...(Object.keys(ACTION_LABELS) as AuditAction[]).map((action) => ({
    value: action,
    label: ACTION_LABELS[action],
  })),
]

function matchesPeriod(entry: AuditEntry, period: Period) {
  if (period === 'all') return true
  if (period === 'today') return entry.day === "Aujourd'hui"
  if (period === 'yesterday') return entry.day === 'Hier'
  return Date.now() - entry.createdAt.getTime() <= 7 * 86_400_000
}

export default function AuditLogPage() {
  const [action, setAction] = useState('all')
  const [period, setPeriod] = useState<Period>('all')
  const [page, setPage] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const query = useQuery({
    queryKey: ['audit', 'recent'],
    queryFn: fetchAuditEntries,
    refetchInterval: 60_000,
  })

  const entries = useMemo(() => query.data ?? [], [query.data])
  const hasFilters = action !== 'all' || period !== 'all'

  const filtered = useMemo(
    () =>
      entries.filter(
        (entry) =>
          (action === 'all' || entry.action === action) &&
          matchesPeriod(entry, period),
      ),
    [entries, action, period],
  )

  const pageCount = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const current = Math.min(page, pageCount - 1)
  const visible = filtered.slice(current * PER_PAGE, current * PER_PAGE + PER_PAGE)
  const groups = groupByDay(visible)

  const selected = filtered.find((entry) => entry.id === selectedId) ?? null

  function resetFilters() {
    setAction('all')
    setPeriod('all')
    setPage(0)
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Journal d’activité"
        description="Historique de toutes les actions importantes effectuées sur la plateforme."
      />

      {query.isSuccess && entries.length > 0 && (
        <div className="mb-5 rounded-2xl border border-line bg-surface p-4 shadow-card">
          <div className="flex flex-col gap-3 sm:flex-row">
            <AuditSelect
              label="Type d’action"
              value={action}
              options={ACTION_OPTIONS}
              onChange={(value) => {
                setAction(value)
                setPage(0)
              }}
            />
            <AuditSelect
              label="Période"
              value={period}
              options={PERIOD_OPTIONS}
              onChange={(value) => {
                setPeriod(value as Period)
                setPage(0)
              }}
            />
          </div>

          {hasFilters && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
              <p className="text-[13px] text-ink-muted">
                {filtered.length === 0
                  ? 'Aucune action ne correspond'
                  : `${filtered.length} action${filtered.length > 1 ? 's' : ''} trouvée${filtered.length > 1 ? 's' : ''}`}
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 text-[13px] font-medium text-brand-600 transition-colors hover:text-brand-900"
              >
                <RotateCcw className="size-3.5" aria-hidden />
                Tout afficher
              </button>
            </div>
          )}
        </div>
      )}

      {query.isPending ? (
        <LoadingList />
      ) : query.isError ? (
        <div className="rounded-2xl border border-line bg-surface px-6 py-14 text-center shadow-card">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-risk-medium/15 text-risk-high">
            <CloudOff className="size-6" aria-hidden />
          </span>
          <h2 className="mt-4 font-display text-xl font-semibold">
            Impossible de charger le journal
          </h2>
          <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-ink-muted">
            Vérifiez votre connexion internet, puis réessayez.
          </p>
          <Button size="lg" className="mt-6" onClick={() => query.refetch()}>
            Réessayer
          </Button>
        </div>
      ) : entries.length === 0 ? (
        <div className="rounded-2xl border border-line bg-surface shadow-card">
          <EmptyState
            icon={History}
            title="Le journal est encore vide"
            description="Dès que les membres de votre coopérative se connecteront et travailleront sur les données, chaque action importante apparaîtra ici."
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-line bg-surface shadow-card">
          <EmptyState
            icon={Search}
            title="Aucune action ne correspond"
            description="Essayez un autre type d’action ou une période plus large."
            action={
              <Button variant="secondary" onClick={resetFilters}>
                <RotateCcw className="size-4" aria-hidden />
                Tout afficher
              </Button>
            }
          />
        </div>
      ) : (
        <>
          <div className="space-y-5">
            {groups.map((group) => (
              <section key={group.day}>
                <h2 className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-disabled">
                  {group.day}
                </h2>
                <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
                  <ul className="divide-y divide-line">
                    <AnimatePresence initial={false} mode="popLayout">
                      {group.entries.map((entry, index) => (
                        <motion.li key={entry.id} layout>
                          <AuditRow
                            entry={entry}
                            index={index}
                            isActive={entry.id === selectedId}
                            onSelect={() => setSelectedId(entry.id)}
                          />
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </ul>
                </div>
              </section>
            ))}
          </div>

          {pageCount > 1 && (
            <nav
              aria-label="Pages du journal"
              className="mt-6 flex items-center justify-between gap-3"
            >
              <PageButton
                onClick={() => setPage(current - 1)}
                disabled={current === 0}
                label="Précédent"
              >
                <ChevronLeft className="size-4" aria-hidden />
                Précédent
              </PageButton>

              <p className="text-[13px] tabular-nums text-ink-muted">
                Page {current + 1} sur {pageCount}
              </p>

              <PageButton
                onClick={() => setPage(current + 1)}
                disabled={current >= pageCount - 1}
                label="Suivant"
              >
                Suivant
                <ChevronRight className="size-4" aria-hidden />
              </PageButton>
            </nav>
          )}
        </>
      )}

      <AuditDetail entry={selected} onClose={() => setSelectedId(null)} />
    </div>
  )
}

function PageButton({
  onClick,
  disabled,
  label,
  children,
}: {
  onClick: () => void
  disabled: boolean
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors',
        disabled
          ? 'cursor-not-allowed border-line text-ink-disabled'
          : 'border-line bg-surface text-brand-900 hover:border-brand-600',
      )}
    >
      {children}
    </button>
  )
}

function LoadingList() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card"
    >
      <span className="sr-only">Chargement du journal…</span>
      <ul className="divide-y divide-line">
        {Array.from({ length: 6 }).map((_, index) => (
          <li key={index} className="flex items-start gap-3 px-4 py-4">
            <span className="size-9 shrink-0 animate-pulse rounded-xl bg-canvas" />
            <span className="min-w-0 flex-1 space-y-2">
              <span
                className="block h-3.5 animate-pulse rounded bg-canvas"
                style={{ width: `${72 - (index % 3) * 12}%` }}
              />
              <span className="block h-3 w-32 animate-pulse rounded bg-canvas" />
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

