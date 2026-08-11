import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  AlarmClock,
  Banknote,
  Check,
  ChevronDown,
  Eye,
  Link2,
  ShieldCheck,
  ShieldQuestion,
  Sparkles,
  UserRoundCheck,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import {
  HEADLINES,
  SUBHEADS,
  type Analysis,
  type Level,
  type SignalIcon,
} from './fraud-analysis'

const SIGNAL_ICONS: Record<SignalIcon, LucideIcon> = {
  urgency: AlarmClock,
  money: Banknote,
  beneficiary: UserRoundCheck,
  link: Link2,
  secret: Eye,
  unknown: ShieldQuestion,
}

const BANNER: Record<Level, string> = {
  low: 'border-risk-low/30 bg-risk-low/10',
  medium: 'border-risk-medium/45 bg-risk-medium/12',
  high: 'border-risk-critical/30 bg-risk-critical/8',
}

const CHIP: Record<Level, string> = {
  low: 'bg-risk-low text-white',
  medium: 'bg-risk-medium text-white',
  high: 'bg-risk-critical text-white',
}

const BAR: Record<Level, string> = {
  low: 'bg-risk-low',
  medium: 'bg-risk-medium',
  high: 'bg-risk-critical',
}

export function ResultView({
  analysis,
  decision,
  onDismiss,
  onReport,
  onRestart,
}: {
  analysis: Analysis
  decision: 'none' | 'dismissed' | 'reported'
  onDismiss: () => void
  onReport: () => void
  onRestart: () => void
}) {
  const [showScore, setShowScore] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.28 }}
      className="space-y-4"
    >
      <div
        className={cn('rounded-2xl border-2 p-5 sm:p-6', BANNER[analysis.level])}
      >
        <span
          className={cn(
            'grid size-12 place-items-center rounded-xl',
            CHIP[analysis.level],
          )}
        >
          {analysis.level === 'low' ? (
            <ShieldCheck className="size-6" aria-hidden />
          ) : (
            <ShieldQuestion className="size-6" aria-hidden />
          )}
        </span>
        <h2 className="mt-4 font-display text-2xl font-semibold leading-tight">
          {HEADLINES[analysis.level]}
        </h2>
        <p className="mt-1.5 text-[15px] leading-relaxed text-ink-muted">
          {SUBHEADS[analysis.level]}
        </p>
        {analysis.degraded && (
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-surface/70 px-2.5 py-1.5 text-[13px] text-ink-muted">
            <ShieldQuestion className="size-3.5 shrink-0" aria-hidden />
            Analyse simplifiée — le service d’analyse avancée était
            indisponible, des règles de sécurité locales ont été utilisées.
          </p>
        )}
      </div>

      {analysis.extractedText && (
        <section className="rounded-2xl border border-line bg-surface p-4 shadow-card">
          <h3 className="mb-1.5 text-[13px] font-medium text-ink-muted">
            Texte lu dans l’image
          </h3>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-muted">
            {analysis.extractedText}
          </p>
        </section>
      )}

      {analysis.signals.length > 0 && (
        <section>
          <h3 className="mb-2.5 text-[13px] font-medium text-ink-muted">
            Ce que nous avons repéré
          </h3>
          <ul className="space-y-2">
            {analysis.signals.map((signal, index) => {
              const Icon = SIGNAL_ICONS[signal.icon]
              return (
                <motion.li
                  key={signal.label}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.08 + index * 0.07 }}
                  className="flex items-start gap-3 rounded-2xl border border-line bg-surface p-4 shadow-card"
                >
                  <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-canvas text-ink-muted">
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <div>
                    <p className="text-sm font-medium">{signal.label}</p>
                    <p className="mt-0.5 text-[13px] leading-snug text-ink-muted">
                      {signal.detail}
                    </p>
                  </div>
                </motion.li>
              )
            })}
          </ul>
        </section>
      )}

      <div className="rounded-2xl border border-ai-900/15 bg-ai-50 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 size-5 shrink-0 text-ai-900" aria-hidden />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ai-900/60">
              Ce que nous conseillons
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-ai-900">
              {analysis.recommendation}
            </p>
          </div>
        </div>
      </div>

      {analysis.signals.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          <button
            type="button"
            onClick={() => setShowScore((open) => !open)}
            aria-expanded={showScore}
            className="flex w-full items-center justify-center gap-1.5 px-5 py-3 text-[13px] font-medium text-ink-muted transition-colors hover:bg-canvas hover:text-brand-900"
          >
            {showScore ? 'Masquer le détail' : 'Voir le détail'}
            <ChevronDown
              className={cn(
                'size-4 transition-transform',
                showScore && 'rotate-180',
              )}
              aria-hidden
            />
          </button>

          <AnimatePresence initial={false}>
            {showScore && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.26, ease: [0.32, 0.72, 0, 1] }}
                className="overflow-hidden"
              >
                <div className="border-t border-line px-5 py-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-sm">Niveau de risque estimé</p>
                    <p className="shrink-0 font-display text-lg font-bold tabular-nums">
                      {analysis.score}
                      <span className="text-[13px] font-medium text-ink-muted">
                        /100
                      </span>
                    </p>
                  </div>
                  <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-canvas">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${analysis.score}%` }}
                      transition={{ duration: 0.5 }}
                      className={cn(
                        'h-full rounded-full',
                        BAR[analysis.level],
                      )}
                    />
                  </div>
                  <ul className="mt-3.5 space-y-1.5">
                    {analysis.signals.map((signal) => (
                      <li
                        key={signal.label}
                        className="flex items-baseline justify-between gap-3 text-[13px] text-ink-muted"
                      >
                        <span>{signal.label}</span>
                        <span className="shrink-0 font-display font-semibold tabular-nums">
                          +{signal.weight}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-[13px] leading-snug text-ink-disabled">
                    Ce chiffre est une estimation, pas une preuve. Il aide
                    seulement à situer le niveau de prudence.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {decision === 'none' ? (
        <div className="flex flex-col gap-2.5 pt-1">
          {analysis.level !== 'low' && (
            <Button size="lg" variant="danger" onClick={onReport}>
              Signaler au responsable sécurité
            </Button>
          )}
          <Button size="lg" variant="secondary" onClick={onDismiss}>
            Ce n’est pas un risque
          </Button>
          <Button size="lg" variant="ghost" onClick={onRestart}>
            Vérifier un autre message
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3 rounded-2xl border border-brand-600/25 bg-brand-50 p-4">
          <p className="flex items-start gap-2.5 text-sm leading-relaxed text-brand-900">
            <Check className="mt-0.5 size-4 shrink-0" aria-hidden />
            {decision === 'reported'
              ? 'Le responsable sécurité a été prévenu. Il vous recontactera si besoin.'
              : 'Merci, c’est noté. Votre retour nous aide à mieux repérer les vraies arnaques.'}
          </p>
          <Button size="lg" variant="secondary" onClick={onRestart}>
            Vérifier un autre message
          </Button>
        </div>
      )}
    </motion.div>
  )
}
