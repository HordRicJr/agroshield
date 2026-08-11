import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowRight, Check, ShieldCheck } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { ROUTES } from '@/config/routes'
import { cn } from '@/lib/utils'
import type { MemberView } from './dashboard-model'

export function MemberDashboard({ view }: { view: MemberView }) {
  const todo = view.tasks.filter((task) => !task.done)

  return (
    <div className="space-y-5">
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden rounded-2xl border border-brand-600/25 bg-brand-50 p-6 sm:p-8"
      >
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:gap-6 sm:text-left">
          <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-brand-900 text-white">
            <ShieldCheck className="size-8" aria-hidden />
          </span>
          <div>
            <h2 className="font-display text-2xl font-semibold text-brand-900">
              {view.headline}
            </h2>
            <p className="mt-1.5 max-w-md text-[15px] leading-relaxed text-brand-900/70">
              {view.plain}
            </p>
            <p className="mt-2 text-[13px] text-brand-900/50">
              {view.lastCheck}
            </p>
          </div>
        </div>
      </motion.section>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.08 }}
      >
        <Link
          to={ROUTES.fraudGuard}
          className="group flex items-center gap-4 rounded-2xl border border-line bg-surface p-5 shadow-card transition-colors hover:border-brand-600 sm:p-6"
        >
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-lg font-semibold">
              Vous avez reçu un message bizarre ?
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-ink-muted">
              Recopiez-le ici, nous vous dirons en une phrase s’il faut s’en
              méfier.
            </p>
          </div>
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-900 text-white transition-transform group-hover:translate-x-0.5">
            <ArrowRight className="size-5" aria-hidden />
          </span>
        </Link>
      </motion.div>

      <Card>
        <CardHeader
          title="Pour être encore mieux protégé"
          description={
            todo.length > 0
              ? `${todo.length} choses simples à faire, une seule fois.`
              : 'Vous avez tout fait, bravo.'
          }
        />
        <CardBody>
          <ul className="space-y-2.5">
            {view.tasks.map((task, index) => (
              <motion.li
                key={task.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: index * 0.07 }}
              >
                <div
                  className={cn(
                    'flex items-start gap-3.5 rounded-xl border p-3.5',
                    task.done
                      ? 'border-transparent bg-canvas'
                      : 'border-line bg-surface',
                  )}
                >
                  <span
                    className={cn(
                      'mt-0.5 grid size-6 shrink-0 place-items-center rounded-full',
                      task.done
                        ? 'bg-risk-low/15 text-risk-low'
                        : 'border-2 border-line',
                    )}
                    aria-hidden
                  >
                    {task.done && <Check className="size-3.5" />}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        'text-sm font-medium',
                        task.done && 'text-ink-muted line-through',
                      )}
                    >
                      {task.title}
                    </p>
                    <p className="mt-0.5 text-[13px] leading-snug text-ink-muted">
                      {task.helper}
                    </p>
                  </div>

                  {!task.done && (
                    <button
                      type="button"
                      className="shrink-0 self-center rounded-lg px-3 py-1.5 text-[13px] font-medium text-brand-900 transition-colors hover:bg-brand-50"
                    >
                      Faire
                    </button>
                  )}
                </div>
              </motion.li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </div>
  )
}
