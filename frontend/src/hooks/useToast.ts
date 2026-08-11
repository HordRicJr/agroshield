import { useContext } from 'react'
import { ToastContext } from '@/app/providers/toast-context'

/** Messages éphémères 4 niveaux (info / moyen / élevé / critique). */
export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast doit être utilisé sous <ToastProvider>')
  }
  return context
}

