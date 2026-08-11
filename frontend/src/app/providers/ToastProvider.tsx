import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { ToastContext, type Toast, type ToastLevel } from './toast-context'
import { Toaster } from '@/components/ui/Toaster'

/** Durée d'affichage : plus le niveau est grave, plus le message reste. */
const DURATIONS: Record<ToastLevel, number> = {
  info: 4_000,
  medium: 6_000,
  high: 8_000,
  critical: 10_000,
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(1)

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const notify = useCallback(
    (level: ToastLevel, message: string) => {
      const id = nextId.current++
      setToasts((current) => [...current.slice(-3), { id, level, message }])
      window.setTimeout(() => dismiss(id), DURATIONS[level])
    },
    [dismiss],
  )

  const value = useMemo(
    () => ({ toasts, notify, dismiss }),
    [toasts, notify, dismiss],
  )

  return (
    <ToastContext value={value}>
      {children}
      <Toaster toasts={toasts} onDismiss={dismiss} />
    </ToastContext>
  )
}

