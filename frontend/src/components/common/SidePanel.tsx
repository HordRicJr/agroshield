import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Feuille remontante sur mobile, panneau latéral sur écran large.
 * Fermeture par le fond, la croix ou la touche Échap.
 */
export function SidePanel({
  open,
  onClose,
  label,
  header,
  footer,
  headerClassName,
  children,
}: {
  open: boolean
  onClose: () => void
  label: string
  header: ReactNode
  footer?: ReactNode
  headerClassName?: string
  children: ReactNode
}) {
  useEffect(() => {
    if (!open) return
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-ink/35 backdrop-blur-[2px]"
            aria-hidden
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={label}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
            className={cn(
              'fixed inset-x-0 bottom-0 z-50 flex max-h-[88vh] flex-col rounded-t-3xl bg-surface',
              'sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-[440px] sm:rounded-none sm:rounded-l-3xl',
            )}
          >
            <header
              className={cn(
                'flex items-start gap-3 border-b border-line p-5',
                headerClassName,
              )}
            >
              <div className="min-w-0 flex-1">{header}</div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fermer"
                className="-mr-1.5 -mt-1 grid size-9 shrink-0 place-items-center rounded-lg text-ink-muted transition-colors hover:bg-canvas hover:text-ink"
              >
                <X className="size-5" aria-hidden />
              </button>
            </header>

            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
              {children}
            </div>

            {footer && (
              <footer className="space-y-2.5 border-t border-line px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                {footer}
              </footer>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
