import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import {
  Building2,
  ChevronRight,
  Gauge,
  Link2,
  Link2Off,
  Sprout,
  Users,
} from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/Button'
import { ROUTES } from '@/config/routes'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { fetchMembers } from '@/features/users/users-data'
import { fetchProducers } from '@/features/producers/producers-data'
import { fetchDashboardSummary } from '@/features/dashboard/useDashboardData'
import { cn } from '@/lib/utils'
import {
  expiresInWords,
  fetchShares,
  formatDateTime,
  revokeShare,
  SHARE_STATE_LABELS,
  shareState,
  sortShares,
  type ShareState,
  type ShareSummaryView,
} from './organization-data'

export default function OrganizationPage() {
  const { user } = useAuth()

  const membersQuery = useQuery({ queryKey: ['users'], queryFn: fetchMembers })
  const producersQuery = useQuery({
    queryKey: ['producers'],
    queryFn: fetchProducers,
  })
  const dashboardQuery = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: fetchDashboardSummary,
  })

  const orgName = user?.organizationName ?? 'Votre organisation'

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Mon organisation" />

      <section className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-5 shadow-card">
        <span
          className="grid size-14 shrink-0 place-items-center rounded-2xl bg-brand-900 text-white"
          aria-hidden
        >
          <Building2 className="size-7" />
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-xl font-semibold leading-snug">
            {orgName}
          </h2>
          <p className="mt-1 inline-flex rounded-full bg-brand-50 px-2.5 py-1 text-[12px] font-medium text-brand-900">
            Organisation agricole
          </p>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="mb-2.5 font-display text-[13px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
          Vue d’ensemble
        </h2>
        <ul className="grid gap-3 sm:grid-cols-3">
          <Shortcut
            to={ROUTES.producers}
            icon={Sprout}
            value={
              producersQuery.data
                ? producersQuery.data.length.toLocaleString('fr-FR')
                : '…'
            }
            label="Producteurs suivis"
          />
          <Shortcut
            to={ROUTES.users}
            icon={Users}
            value={membersQuery.data ? String(membersQuery.data.length) : '…'}
            label="Utilisateurs"
          />
          <Shortcut
            to={ROUTES.dashboard}
            icon={Gauge}
            value={
              dashboardQuery.data ? `${dashboardQuery.data.cyberScore}/100` : '…'
            }
            label="Niveau de protection"
          />
        </ul>
      </section>

      <SharesSection />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Partages sécurisés
// ---------------------------------------------------------------------------

const STATE_BADGE: Record<ShareState, string> = {
  active: 'bg-brand-50 text-brand-900',
  expired: 'bg-canvas text-ink-muted',
  revoked: 'bg-canvas text-ink-disabled',
}

function SharesSection() {
  const queryClient = useQueryClient()
  const { notify } = useToast()
  const [error, setError] = useState<string | null>(null)

  const sharesQuery = useQuery({ queryKey: ['shares'], queryFn: fetchShares })

  const revoke = useMutation({
    mutationFn: (shareId: string) => revokeShare(shareId),
    onSuccess: () => {
      setError(null)
      queryClient.invalidateQueries({ queryKey: ['shares'] })
      notify('info', 'Le partage a été arrêté. Le lien ne fonctionne plus.')
    },
    onError: () =>
      setError(
        'Le partage n’a pas pu être arrêté. Vérifiez votre connexion et réessayez.',
      ),
  })

  const shares = useMemo(
    () => sortShares(sharesQuery.data ?? []),
    [sharesQuery.data],
  )

  return (
    <section className="mt-8">
      <h2 className="font-display text-[13px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
        Partages de fichiers
      </h2>
      <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">
        Les liens de partage donnent accès à certaines colonnes d’un fichier,
        pour une durée limitée. Vous pouvez les arrêter à tout moment.
      </p>

      {sharesQuery.isPending ? (
        <div role="status" aria-live="polite" className="mt-4 space-y-3">
          <span className="sr-only">Chargement des partages…</span>
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className="h-24 animate-pulse rounded-2xl border border-line bg-surface shadow-card"
            />
          ))}
        </div>
      ) : sharesQuery.isError ? (
        <div className="mt-4 rounded-2xl border border-line bg-surface p-5 text-sm leading-relaxed text-ink-muted shadow-card">
          Impossible de charger les partages pour le moment.{' '}
          <button
            type="button"
            onClick={() => sharesQuery.refetch()}
            className="font-medium text-brand-600 underline underline-offset-4"
          >
            Réessayer
          </button>
        </div>
      ) : shares.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-line bg-surface shadow-card">
          <EmptyState
            icon={Link2}
            title="Aucun partage en cours"
            description="Quand vous partagerez un fichier avec un partenaire, le lien apparaîtra ici et vous pourrez l’arrêter à tout moment."
          />
        </div>
      ) : (
        <>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 rounded-xl border border-risk-critical/25 bg-risk-critical/8 p-3.5 text-[13px] leading-relaxed text-risk-critical"
            >
              {error}
            </motion.p>
          )}

          <ul className="mt-4 space-y-3">
            {shares.map((share) => (
              <ShareCard
                key={share.shareId}
                share={share}
                revoking={
                  revoke.isPending && revoke.variables === share.shareId
                }
                onRevoke={() => revoke.mutate(share.shareId)}
              />
            ))}
          </ul>
        </>
      )}
    </section>
  )
}

function ShareCard({
  share,
  revoking,
  onRevoke,
}: {
  share: ShareSummaryView
  revoking: boolean
  onRevoke: () => void
}) {
  const state = shareState(share)
  const active = state === 'active'

  return (
    <li
      className={cn(
        'rounded-2xl border border-line bg-surface p-4 shadow-card',
        !active && 'opacity-70',
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2">
            <span className="font-display text-[15px] font-semibold leading-snug">
              {share.label || 'Fichier partagé'}
            </span>
            <span
              className={cn(
                'rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
                STATE_BADGE[state],
              )}
            >
              {SHARE_STATE_LABELS[state]}
            </span>
          </p>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">
            {share.allowedColumns.length} colonne
            {share.allowedColumns.length > 1 ? 's' : ''} visible
            {share.allowedColumns.length > 1 ? 's' : ''} :{' '}
            {share.allowedColumns.join(', ')}
          </p>
          <p className="mt-1 text-[13px] text-ink-muted">
            {active
              ? expiresInWords(share.expiresAt)
              : state === 'revoked'
                ? `Arrêté le ${formatDateTime(share.revokedAt as string)}`
                : `Expiré le ${formatDateTime(share.expiresAt)}`}
            {' · '}Créé le {formatDateTime(share.createdAt)}
          </p>
        </div>

        {active && (
          <Button
            size="sm"
            variant="secondary"
            disabled={revoking}
            onClick={onRevoke}
            className="shrink-0 text-risk-critical hover:bg-risk-critical/8"
          >
            <Link2Off className="size-3.5" aria-hidden />
            {revoking ? 'Arrêt…' : 'Arrêter le partage'}
          </Button>
        )}
      </div>
    </li>
  )
}

// ---------------------------------------------------------------------------

function Shortcut({
  to,
  icon: Icon,
  value,
  label,
}: {
  to: string
  icon: typeof Users
  value: string
  label: string
}) {
  return (
    <li>
      <Link
        to={to}
        className="flex h-full items-center gap-3 rounded-2xl border border-line bg-surface p-4 shadow-card transition-colors hover:border-brand-600 sm:flex-col sm:items-start sm:gap-2"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-900">
          <Icon className="size-4.5" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-xl font-bold tabular-nums text-brand-900">
            {value}
          </span>
          <span className="mt-0.5 block text-[13px] leading-snug text-ink-muted">
            {label}
          </span>
        </span>
        <ChevronRight
          className="size-4 shrink-0 text-ink-disabled sm:hidden"
          aria-hidden
        />
      </Link>
    </li>
  )
}



