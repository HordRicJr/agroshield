import { api } from '@/lib/api'
import type {
  CreateFarmRequest,
  CreateProducerRequest,
  FarmView,
  ProducerView,
} from '@/types/api'

/**
 * Producteurs et exploitations réels chargés depuis l'API
 * (`GET/POST /producers`, `GET/POST /farms`).
 */

export type { FarmView, ProducerView }

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

export function fetchProducers(): Promise<ProducerView[]> {
  return api.get<ProducerView[]>('/producers')
}

export function fetchFarms(): Promise<FarmView[]> {
  return api.get<FarmView[]>('/farms')
}

export function createProducer(request: CreateProducerRequest): Promise<ProducerView> {
  return api.post<ProducerView>('/producers', request)
}

export function createFarm(request: CreateFarmRequest): Promise<FarmView> {
  return api.post<FarmView>('/farms', request)
}

// ---------------------------------------------------------------------------
// Utilitaires
// ---------------------------------------------------------------------------

export const PAGE_SIZE = 6

export function searchProducers(list: ProducerView[], query: string) {
  const needle = query.trim().toLowerCase()
  if (!needle) return list
  return list.filter(
    (producer) =>
      producer.displayName.toLowerCase().includes(needle) ||
      producer.code.toLowerCase().includes(needle),
  )
}

export function farmsOf(farms: FarmView[], producerId: string) {
  return farms.filter((farm) => farm.producerId === producerId)
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/** Code producteur proposé automatiquement à partir du nom saisi. */
export function suggestCode(displayName: string, existing: ProducerView[]) {
  const base = displayName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toUpperCase()
    .slice(0, 24)
  if (!base) return ''
  const taken = new Set(existing.map((producer) => producer.code.toUpperCase()))
  if (!taken.has(base)) return base
  for (let i = 2; i < 100; i++) {
    const candidate = `${base}-${i}`
    if (!taken.has(candidate)) return candidate
  }
  return `${base}-${Date.now() % 1000}`
}

