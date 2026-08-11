import { api, API_URL } from '@/lib/api'
import type { CreateShareRequest, CreateShareResponse, ShareSummaryView } from '@/types/api'

/**
 * Fiche organisation et partages sécurisés, chargés depuis l'API
 * (`GET /shares`, `POST /shares`, `DELETE /shares/{id}`).
 */

export type { ShareSummaryView }

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

export function fetchShares(): Promise<ShareSummaryView[]> {
  return api.get<ShareSummaryView[]>('/shares')
}

export function createShare(request: CreateShareRequest): Promise<CreateShareResponse> {
  return api.post<CreateShareResponse>('/shares', request)
}

export function revokeShare(shareId: string) {
  return api.delete<unknown>(`/shares/${shareId}`)
}

/** URL publique complète (métadonnées + colonnes autorisées uniquement — jamais le fichier). */
export function publicShareUrl(publicPath: string): string {
  const apiRoot = API_URL.replace(/\/api\/v1$/, '')
  return `${apiRoot}${publicPath}`
}

// ---------------------------------------------------------------------------
// Utilitaires
// ---------------------------------------------------------------------------

export type ShareState = 'active' | 'expired' | 'revoked'

export function shareState(share: ShareSummaryView): ShareState {
  if (share.revokedAt) return 'revoked'
  if (new Date(share.expiresAt).getTime() <= Date.now()) return 'expired'
  return 'active'
}

export const SHARE_STATE_LABELS: Record<ShareState, string> = {
  active: 'Actif',
  expired: 'Expiré',
  revoked: 'Arrêté',
}

/** Actifs d'abord (les plus proches de l'expiration en premier). */
export function sortShares(list: ShareSummaryView[]) {
  const order: Record<ShareState, number> = { active: 0, expired: 1, revoked: 2 }
  return [...list].sort(
    (a, b) =>
      order[shareState(a)] - order[shareState(b)] ||
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** « Se termine dans 2 h », « Se termine demain »… */
export function expiresInWords(iso: string): string {
  const diffMs = new Date(iso).getTime() - Date.now()
  if (diffMs <= 0) return 'Terminé'
  const minutes = Math.round(diffMs / 60_000)
  if (minutes < 60) return `Se termine dans ${minutes} min`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `Se termine dans ${hours} h`
  const days = Math.round(hours / 24)
  return `Se termine dans ${days} jour${days > 1 ? 's' : ''}`
}

