import { AnimatePresence, motion } from 'motion/react'
import {
  AlertTriangle,
  Info,
  ShieldAlert,
  TriangleAlert,
  X,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Toast, ToastLevel } from '@/app/providers/toast-context'

const STYLES: Record<
  ToastLevel,
  { icon: LucideIcon; container: string; iconColor: string }
> = {
  info: {
    icon: Info,
    container: 'border-brand-600/25 bg-brand-50 text-brand-900',
    iconColor: 'text-brand-600',
  },
  medium: {
    icon: AlertTriangle,
    container: 'border-risk-medium/40 bg-risk-medium/10 text-ink',
    iconColor: 'text-risk-high',
  },
  high: {
    icon: TriangleAlert,
    container: 'border-risk-high/35 bg-risk-high/10 text-ink',
    iconColor: 'text-risk-high',
  },
  critical: {
    icon: ShieldAlert,
    container: 'border-risk-critical/35 bg-risk-critical/10 text-ink',
    iconColor: 'text-risk-critical',
  },
}

/** Pile de messages éphémères, en bas de l'écran (au-dessus du contenu). */
export function Toaster({
  toasts,
  onDismiss,
}: {
  toasts: Toast[]
  onDismiss: (id: number) => void
}) {
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4"
    >
      <AnimatePresence initial={false}>
        {toasts.map((toast) => {
          const style = STYLES[toast.level]
          const Icon = style.icon
          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.22 }}
              role="status"
              className={cn(
                'pointer-events-auto flex w-full max-w-md items-start gap-2.5 rounded-2xl border p-4 shadow-card backdrop-blur',
                style.container,
              )}
            >
              <Icon
                className={cn('mt-0.5 size-4 shrink-0', style.iconColor)}
                aria-hidden
              />
              <p className="min-w-0 flex-1 text-sm leading-relaxed">
                {toast.message}
              </p>
              <button
                type="button"
                onClick={() => onDismiss(toast.id)}
                aria-label="Fermer le message"
                className="shrink-0 rounded-lg p-1 text-ink-muted transition-colors hover:bg-black/5 hover:text-ink"
              >
                <X className="size-4" aria-hidden />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

