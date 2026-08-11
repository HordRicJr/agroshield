import { motion } from 'motion/react'
import { PageHeader } from '@/components/common/PageHeader'
import { Card } from '@/components/ui/Card'

/**
 * Écran encore à construire. On montre ce que la page contiendra plutôt
 * qu'un simple message « bientôt disponible ».
 */
export function PlaceholderPage({
  title,
  description,
  step,
  upcoming,
}: {
  title: string
  description: string
  step: number
  upcoming: string[]
}) {
  return (
    <>
      <PageHeader title={title} description={description} />

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:gap-10 sm:p-8">
          <div className="shrink-0">
            <p className="font-display text-[64px] font-bold leading-none text-brand-50">
              {String(step).padStart(2, '0')}
            </p>
            <p className="-mt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-disabled">
              Étape de la roadmap
            </p>
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-medium">Ce que contiendra cet écran</h2>
            <ul className="mt-4 space-y-3">
              {upcoming.map((item, index) => (
                <motion.li
                  key={item}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.07 }}
                  className="flex items-start gap-3 text-sm"
                >
                  <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-brand-600" />
                  <span className="text-ink-muted">{item}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-dashed border-line bg-canvas px-6 py-3.5 sm:px-8">
          <p className="text-[13px] text-ink-muted">
            Interface en cours de conception — le serveur n’est pas encore
            branché, les écrans arrivent dans l’ordre de la roadmap.
          </p>
        </div>
      </Card>
    </>
  )
}
