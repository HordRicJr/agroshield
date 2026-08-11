/**
 * Client HTTP AgroShield — enveloppe `{ success, data, error, meta }` du backend.
 *
 * - Injecte `Authorization: Bearer <accessToken>` automatiquement
 * - Sur 401 : un seul refresh en vol (les requêtes concurrentes attendent),
 *   puis rejeu de la requête ; échec → purge session + événement `auth:expired`
 * - Erreurs typées `ApiError` (code backend + message affichable)
 */

import type { ApiEnvelope, TokenResponse } from '@/types/api'

export const API_URL: string =
  import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8080/api/v1'

const REFRESH_TOKEN_KEY = 'agroshield.refreshToken'

// ---------------------------------------------------------------------------
// Erreur typée
// ---------------------------------------------------------------------------

export class ApiError extends Error {
  readonly code: string
  readonly status: number
  readonly details?: Record<string, unknown> | null

  constructor(
    code: string,
    message: string,
    status: number,
    details?: Record<string, unknown> | null,
  ) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
    this.details = details
  }

  /** Erreur réseau (backend injoignable) — à distinguer d'un refus métier. */
  get isNetworkError(): boolean {
    return this.code === 'NETWORK_ERROR'
  }
}

// ---------------------------------------------------------------------------
// Gestion des tokens (access en mémoire, refresh en localStorage)
// ---------------------------------------------------------------------------

let accessToken: string | null = null

export const tokenStore = {
  getAccessToken: () => accessToken,
  setAccessToken(token: string | null) {
    accessToken = token
  },
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  setRefreshToken(token: string | null) {
    if (token) {
      localStorage.setItem(REFRESH_TOKEN_KEY, token)
    } else {
      localStorage.removeItem(REFRESH_TOKEN_KEY)
    }
  },
  clear() {
    accessToken = null
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  },
}

/** Émis quand la session ne peut plus être restaurée (refresh échoué). */
export const AUTH_EXPIRED_EVENT = 'agroshield:auth-expired'

/** Émis quand le serveur devient injoignable / répond à nouveau. */
export const NETWORK_DOWN_EVENT = 'agroshield:network-down'
export const NETWORK_UP_EVENT = 'agroshield:network-up'

let networkDown = false

function notifyNetworkDown() {
  if (networkDown) return
  networkDown = true
  window.dispatchEvent(new CustomEvent(NETWORK_DOWN_EVENT))
}

function notifyNetworkUp() {
  if (!networkDown) return
  networkDown = false
  window.dispatchEvent(new CustomEvent(NETWORK_UP_EVENT))
}

function notifyAuthExpired() {
  tokenStore.clear()
  window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT))
}

// ---------------------------------------------------------------------------
// Refresh — un seul en vol à la fois
// ---------------------------------------------------------------------------

let refreshInFlight: Promise<boolean> | null = null

async function tryRefresh(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight

  refreshInFlight = (async () => {
    const refreshToken = tokenStore.getRefreshToken()
    if (!refreshToken) return false
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })
      if (!res.ok) return false
      const envelope = (await res.json()) as ApiEnvelope<TokenResponse>
      if (!envelope.success || !envelope.data) return false
      tokenStore.setAccessToken(envelope.data.accessToken)
      tokenStore.setRefreshToken(envelope.data.refreshToken)
      return true
    } catch {
      return false
    } finally {
      refreshInFlight = null
    }
  })()

  return refreshInFlight
}

// ---------------------------------------------------------------------------
// Fetch principal
// ---------------------------------------------------------------------------

export interface ApiFetchOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  /** Désactive l'injection du Bearer (endpoints publics). */
  anonymous?: boolean
  /** Interne : empêche une seconde tentative de refresh. */
  skipRefresh?: boolean
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { body, anonymous, skipRefresh, headers, ...rest } = options

  const isFormData = body instanceof FormData
  const finalHeaders = new Headers(headers)
  if (!isFormData && body !== undefined) {
    finalHeaders.set('Content-Type', 'application/json')
  }
  const token = tokenStore.getAccessToken()
  if (!anonymous && token) {
    finalHeaders.set('Authorization', `Bearer ${token}`)
  }

  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...rest,
      headers: finalHeaders,
      body: isFormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    notifyNetworkDown()
    throw new ApiError(
      'NETWORK_ERROR',
      'Impossible de joindre le serveur. Vérifiez votre connexion.',
      0,
    )
  }

  notifyNetworkUp()

  // 401 → refresh puis rejeu (une seule fois)
  if (response.status === 401 && !anonymous && !skipRefresh) {
    const refreshed = await tryRefresh()
    if (refreshed) {
      return apiFetch<T>(path, { ...options, skipRefresh: true })
    }
    notifyAuthExpired()
  }

  let envelope: ApiEnvelope<T> | null = null
  try {
    envelope = (await response.json()) as ApiEnvelope<T>
  } catch {
    // Réponse sans corps JSON (rare) — on tombe sur l'erreur générique plus bas.
  }

  if (response.ok && envelope?.success) {
    return envelope.data as T
  }

  // Réponses sans corps (204 No Content — ex : logout)
  if (response.ok && envelope === null) {
    return undefined as T
  }

  const code = envelope?.error?.code ?? `HTTP_${response.status}`
  const message =
    envelope?.error?.message ??
    (response.status === 403
      ? "Vous n'avez pas les droits nécessaires pour cette action."
      : 'Une erreur inattendue est survenue.')
  throw new ApiError(code, message, response.status, envelope?.error?.details)
}

// ---------------------------------------------------------------------------
// Raccourcis
// ---------------------------------------------------------------------------

export const api = {
  get: <T>(path: string, options?: ApiFetchOptions) =>
    apiFetch<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: ApiFetchOptions) =>
    apiFetch<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, options?: ApiFetchOptions) =>
    apiFetch<T>(path, { ...options, method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown, options?: ApiFetchOptions) =>
    apiFetch<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: ApiFetchOptions) =>
    apiFetch<T>(path, { ...options, method: 'DELETE' }),
}




