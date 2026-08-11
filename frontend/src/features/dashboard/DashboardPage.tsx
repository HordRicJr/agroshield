import { ShieldCheck } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { ROLES } from '@/types'
import { acknowledgeAlert } from '@/features/alerts/alerts-data'
import { ConnectionError } from './ConnectionError'
import { DashboardSkeleton } from './DashboardSkeleton'
import { MemberDashboard } from './MemberDashboard'
import { PriorityCard } from './PriorityCard'
import { ProtectionCard } from './ProtectionCard'
import { RecentAlerts } from './RecentAlerts'
import { useDashboardData } from './useDashboardData'

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Bonjour'
  if (hour < 18) return 'Bon après-midi'
  return 'Bonsoir'
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { notify } = useToast()
  const queryClient = useQueryClient()
  const { state, data, refetch } = useDashboardData()

  const firstName = user?.fullName.split(' ')[0] ?? ''
  const isManager =
    user?.role === ROLES.RESPONSABLE || user?.role === ROLES.ADMIN

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
        'Impossible de marquer cette alerte comme traitée pour le moment.',
      )
    },
  })

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-semibold">
          {greeting()}, {firstName}
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          {isManager
            ? `Voici ce qui compte aujourd’hui pour ${user?.organizationName}.`
            : 'Voici l’état de votre compte aujourd’hui.'}
        </p>
      </header>

      {state === 'loading' && <DashboardSkeleton />}

      {state === 'error' && <ConnectionError onRetry={() => refetch()} />}

      {(state === 'ready' || state === 'empty') &&
        data &&
        (isManager ? (
          <div className="space-y-5">
            {data.priority ? (
              <PriorityCard
                item={data.priority}
                onResolve={(id) => acknowledgeMutation.mutate(id)}
                isResolving={acknowledgeMutation.isPending}
              />
            ) : (
              <section className="rounded-2xl border border-brand-600/25 bg-brand-50 p-6 sm:p-8">
                <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:gap-6 sm:text-left">
                  <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-brand-900 text-white">
                    <ShieldCheck className="size-8" aria-hidden />
                  </span>
                  <div>
                    <h2 className="font-display text-2xl font-semibold text-brand-900">
                      Rien à signaler aujourd’hui
                    </h2>
                    <p className="mt-1.5 max-w-md text-[15px] leading-relaxed text-brand-900/70">
                      Aucune situation ne demande votre attention. Nous
                      continuons à surveiller vos données en arrière-plan.
                    </p>
                  </div>
                </div>
              </section>
            )}

            <ProtectionCard
              value={data.protection.value}
              previous={data.protection.previous}
              updatedAt={data.protection.updatedAt}
              categories={data.protection.categories}
            />

            {data.alerts.length > 0 && (
              <RecentAlerts alerts={data.alerts.slice(0, 3)} />
            )}
          </div>
        ) : (
          <MemberDashboard view={data.member} />
        ))}
    </div>
  )
}
