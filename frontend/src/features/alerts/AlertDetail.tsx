import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  Check,
  ChevronDown,
  Send,
  ShieldAlert,
  Smartphone,
  Sparkles,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { ALERT_ICONS } from './alert-icons'
import { LEVEL_LABELS, type SecurityAlert } from './alerts-data'
import type { RiskLevel } from '@/types'

const HEAD: Record<RiskLevel, string> = {
  low: 'bg-risk-low/10 border-risk-low/25',
  medium: 'bg-risk-medium/12 border-risk-medium/35',
  high: 'bg-risk-high/8 border-risk-high/30',
  critical: 'bg-risk-critical/8 border-risk-critical/30',
}

const CHIP: Record<RiskLevel, string> = {
  low: 'bg-risk-low/15 text-risk-low',
  medium: 'bg-risk-medium/25 text-risk-high',
  high: 'bg-risk-high/15 text-risk-high',
  critical: 'bg-risk-critical text-white',
}

export function AlertDetail({
  alert,
  onClose,
  onResolve,
}: {
  alert: SecurityAlert | null
  onClose: () => void
  onResolve: (id: string) => void
}) {
  useEffect(() => {
    if (!alert) return
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [alert, onClose])

  return (
    <AnimatePresence>
      {alert && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-ink/35 backdrop-blur-[2px]"
            aria-hidden
          />
          <AlertPanel
            key={alert.id}
            alert={alert}
            onClose={onClose}
            onResolve={onResolve}
          />
        </>
      )}
    </AnimatePresence>
  )
}

/** Monté avec une clé par alerte : l'état local repart de zéro à chaque ouverture. */
function AlertPanel({
  alert,
  onClose,
  onResolve,
}: {
  alert: SecurityAlert
  onClose: () => void
  onResolve: (id: string) => void
}) {
  const [showWeights, setShowWeights] = useState(false)
  const [sideEffect, setSideEffect] = useState<string | null>(null)

  const severe = alert.level === 'critical' || alert.level === 'high'

  return (
    <motion.div
      role="dialog"
            aria-modal="true"
            aria-label={`Détail de l’alerte : ${alert.title}`}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
            className={cn(
              'fixed inset-x-0 bottom-0 z-50 flex max-h-[88vh] flex-col rounded-t-3xl bg-surface',
              'sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-[460px] sm:rounded-none sm:rounded-l-3xl',
            )}
          >
            <header
              className={cn('flex items-start gap-3 border-b p-5', HEAD[alert.level])}
            >
              <span
                className={cn(
                  'grid size-11 shrink-0 place-items-center rounded-xl',
                  CHIP[alert.level],
                )}
              >
                {(() => {
                  const Icon = ALERT_ICONS[alert.icon]
                  return <Icon className="size-5" aria-hidden />
                })()}
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-muted">
                  Niveau {LEVEL_LABELS[alert.level].toLowerCase()}
                </p>
                <h2 className="mt-1 font-display text-lg font-semibold leading-snug">
                  {alert.title}
                </h2>
                <p className="mt-1 text-[13px] text-ink-muted">
                  {alert.subject} · {alert.when}
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Fermer le détail"
                className="-mr-1.5 -mt-1 grid size-9 shrink-0 place-items-center rounded-lg text-ink-muted transition-colors hover:bg-surface/60 hover:text-ink"
              >
                <X className="size-5" aria-hidden />
              </button>
            </header>

            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
              <section>
                <h3 className="text-[13px] font-medium text-ink-muted">
                  Ce qui s’est passé
                </h3>
                <p className="mt-1.5 text-[15px] leading-relaxed">
                  {alert.summary}
                </p>
              </section>

              {alert.factors.length > 0 && (
                <section className="overflow-hidden rounded-2xl border border-ai-900/15 bg-ai-50">
                  <div className="flex items-start gap-3 p-4">
                    <Sparkles
                      className="mt-0.5 size-5 shrink-0 text-ai-900"
                      aria-hidden
                    />
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ai-900/60">
                        Pourquoi le système a signalé cela
                      </p>
                      <ul className="mt-2 space-y-2.5">
                        {alert.factors.map((factor) => (
                          <li key={factor.label}>
                            <p className="text-sm font-medium text-ai-900">
                              {factor.label}
                            </p>
                            <p className="mt-0.5 text-[13px] leading-snug text-ai-900/70">
                              {factor.detail}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowWeights((open) => !open)}
                    aria-expanded={showWeights}
                    className="flex w-full items-center justify-center gap-1.5 border-t border-ai-900/10 px-4 py-2.5 text-[13px] font-medium text-ai-900/70 transition-colors hover:bg-ai-900/5"
                  >
                    {showWeights ? 'Masquer le détail' : 'Voir le détail'}
                    <ChevronDown
                      className={cn(
                        'size-4 transition-transform',
                        showWeights && 'rotate-180',
                      )}
                      aria-hidden
                    />
                  </button>

                  <AnimatePresence initial={false}>
                    {showWeights && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.26, ease: [0.32, 0.72, 0, 1] }}
                        className="overflow-hidden"
                      >
                        <ul className="space-y-1.5 border-t border-ai-900/10 px-4 py-3">
                          {alert.factors.map((factor) => (
                            <li
                              key={factor.label}
                              className="flex items-baseline justify-between gap-3 text-[13px] text-ai-900/75"
                            >
                              <span>{factor.label}</span>
                              <span className="shrink-0 font-display font-semibold tabular-nums">
                                +{factor.weight}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </section>
              )}

              {alert.status === 'done' && (
                <div className="flex items-start gap-3 rounded-2xl border border-line bg-canvas p-4">
                  <Check
                    className="mt-0.5 size-4 shrink-0 text-risk-low"
                    aria-hidden
                  />
                  <p className="text-[13px] leading-relaxed text-ink-muted">
                    Alerte déjà traitée
                    {alert.closedBy ? ` par ${alert.closedBy}` : ''}. Aucune
                    action n’est nécessaire de votre part.
                  </p>
                </div>
              )}

              {sideEffect && (
                <motion.p
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2.5 rounded-2xl border border-brand-600/25 bg-brand-50 p-4 text-sm leading-relaxed text-brand-900"
                >
                  <Check className="mt-0.5 size-4 shrink-0" aria-hidden />
                  {sideEffect}
                </motion.p>
              )}
            </div>

            {alert.status !== 'done' && (
              <footer className="space-y-2.5 border-t border-line px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                <Button
                  size="lg"
                  className="w-full"
                  onClick={() => onResolve(alert.id)}
                >
                  <Check className="size-4" aria-hidden />
                  Marquer comme traitée
                </Button>

                <div className="grid gap-2.5 sm:grid-cols-2">
                  {severe && (
                    <Button
                      variant="secondary"
                      onClick={() =>
                        setSideEffect(
                          'L’accès de cette personne est suspendu. Elle pourra se reconnecter dès que vous l’aurez confirmé.',
                        )
                      }
                    >
                      <ShieldAlert className="size-4" aria-hidden />
                      Suspendre l’accès
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    onClick={() =>
                      setSideEffect(
                        'Un code de vérification sera demandé à cette personne à sa prochaine connexion.',
                      )
                    }
                  >
                    <Smartphone className="size-4" aria-hidden />
                    Demander un code
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() =>
                      setSideEffect(
                        'Un autre responsable a été prévenu et voit désormais cette alerte.',
                      )
                    }
                  >
                    <Send className="size-4" aria-hidden />
                    Prévenir un collègue
                  </Button>
                </div>
              </footer>
            )}
    </motion.div>
  )
}
