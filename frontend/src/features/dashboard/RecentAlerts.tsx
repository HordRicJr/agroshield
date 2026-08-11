import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { Check, ChevronRight, ShieldCheck } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { EmptyState } from '@/components/common/EmptyState'
import { ROUTES } from '@/config/routes'
import { cn } from '@/lib/utils'
import type { DashboardAlert } from './dashboard-model'
import type { RiskLevel } from '@/types'

const RAIL: Record<RiskLevel, string> = {
  low: 'bg-risk-low',
  medium: 'bg-risk-medium',
  high: 'bg-risk-high',
  critical: 'bg-risk-critical',
}

export function RecentAlerts({ alerts }: { alerts: DashboardAlert[] }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader
        title="Le reste peut attendre"
        description="Aucune de ces situations n’est urgente."
        action={
          <Link
            to={ROUTES.alerts}
            className="flex shrink-0 items-center gap-1 text-[13px] font-medium text-brand-600 hover:underline"
          >
            Tout voir
            <ChevronRight className="size-4" aria-hidden />
          </Link>
        }
      />

      {alerts.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="Aucune autre alerte"
          description="Rien d’autre ne demande votre attention aujourd’hui."
        />
      ) : (
        <ul className="divide-y divide-line">
          {alerts.map((alert, index) => (
            <motion.li
              key={alert.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: index * 0.06 }}
            >
              <Link
                to={ROUTES.alerts}
                className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-canvas"
              >
                <span
                  className={cn(
                    'size-2 shrink-0 rounded-full',
                    alert.status === 'done' ? 'bg-line' : RAIL[alert.level],
                  )}
                  aria-hidden
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm leading-snug">
                    {alert.title}
                  </span>
                  <span className="mt-0.5 block text-[13px] text-ink-disabled">
                    {alert.when}
                  </span>
                </span>
                {alert.status === 'done' ? (
                  <span className="flex shrink-0 items-center gap-1 text-[13px] text-ink-muted">
                    <Check className="size-3.5 text-risk-low" aria-hidden />
                    Traité
                  </span>
                ) : (
                  <ChevronRight
                    className="size-4 shrink-0 text-ink-disabled"
                    aria-hidden
                  />
                )}
              </Link>
            </motion.li>
          ))}
        </ul>
      )}
    </Card>
  )
}
