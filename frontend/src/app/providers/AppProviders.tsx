import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { ApiError } from '@/lib/api'
import { SidebarProvider } from './SidebarProvider'
import { ToastProvider } from './ToastProvider'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) => {
        // Pas de retry sur les refus métier (401/403/404) — seulement réseau/5xx.
        if (error instanceof ApiError && error.status > 0 && error.status < 500) {
          return false
        }
        return failureCount < 2
      },
    },
  },
})

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <SidebarProvider>{children}</SidebarProvider>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
