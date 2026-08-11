import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { DashboardSummary } from '@/types/api'
import { mapSummary, type DashboardData } from './dashboard-model'

export type DashboardState = 'ready' | 'loading' | 'empty' | 'error'

/** Réutilisé par la page Organisation (même queryKey, même cache). */
export function fetchDashboardSummary(): Promise<DashboardSummary> {
  return api.get<DashboardSummary>('/dashboard/summary')
}

export function useDashboardData(): {
  state: DashboardState
  data: DashboardData | null
  refetch: () => void
} {
  const query = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: fetchDashboardSummary,
    refetchInterval: 60_000,
  })

  if (query.isPending) {
    return { state: 'loading', data: null, refetch: query.refetch }
  }
  if (query.isError) {
    return { state: 'error', data: null, refetch: query.refetch }
  }
  const data = mapSummary(query.data)
  return {
    state: data.isEmpty ? 'empty' : 'ready',
    data,
    refetch: query.refetch,
  }
}
