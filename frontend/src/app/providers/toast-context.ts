import { createContext } from 'react'

/** Niveaux alignés sur la famille de couleurs « signal » du design system. */
export type ToastLevel = 'info' | 'medium' | 'high' | 'critical'

export interface Toast {
  id: number
  level: ToastLevel
  message: string
}

export interface ToastContextValue {
  toasts: Toast[]
  /** Affiche un message éphémère (auto-fermé, plus long si critique). */
  notify: (level: ToastLevel, message: string) => void
  dismiss: (id: number) => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)

