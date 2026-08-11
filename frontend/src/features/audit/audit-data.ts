import { api } from '@/lib/api'
import type { AuditLogView } from '@/types/api'
import type { RiskLevel } from '@/types'

/**
 * Journal d'activité réel chargé depuis `GET /audit/recent`
 * (50 dernières actions de l'organisation, ordre antéchronologique).
 *
 * Le backend fournit des codes techniques (action, résultat, niveau de
 * risque) : tout est traduit ici en phrases lisibles, sans vocabulaire
 * technique, conformément à la charte du produit.
 */

export type AuditAction =
  | 'connexion'
  | 'export'
  | 'modification'
  | 'analyse'
  | 'import'
  | 'partage'
  | 'consultation'
  | 'droits'

export type AuditOutcome = 'allowed' | 'blocked' | 'watched'

export interface AuditEntry {
  id: string
  action: AuditAction
  /** Phrase complète, lisible telle quelle : « Un fichier a été importé ». */
  description: string
  resource: string
  day: string
  time: string
  createdAt: Date
  outcome: AuditOutcome
  level: RiskLevel
  /** Précision facultative affichée dans la fiche de détail. */
  note?: string
}

export const ACTION_LABELS: Record<AuditAction, string> = {
  connexion: 'Connexion',
  export: 'Export de données',
  modification: 'Modification',
  analyse: 'Analyse automatique',
  import: 'Import de fichier',
  partage: 'Partage',
  consultation: 'Consultation',
  droits: 'Droits d’accès',
}

export const OUTCOME_LABELS: Record<AuditOutcome, string> = {
  allowed: 'Autorisé',
  blocked: 'Bloqué',
  watched: 'À surveiller',
}

export const LEVEL_LABELS: Record<RiskLevel, string> = {
  low: 'Normal',
  medium: 'À surveiller',
  high: 'Inhabituel',
  critical: 'Très inhabituel',
}

// ---------------------------------------------------------------------------
// Mapping API → UI
// ---------------------------------------------------------------------------

interface ActionInfo {
  action: AuditAction
  description: string
  resource: string
}

/** Codes d'action émis par le backend → phrase lisible. */
const ACTION_MAP: Record<string, ActionInfo> = {
  LOGIN_FAILED: {
    action: 'connexion',
    description: 'Une tentative de connexion a échoué',
    resource: 'Compte de la coopérative',
  },
  FILE_UPLOAD: {
    action: 'import',
    description: 'Un fichier a été importé',
    resource: 'Fichier importé',
  },
  FILE_DELETE: {
    action: 'import',
    description: 'Un fichier importé a été supprimé',
    resource: 'Fichier importé',
  },
  FILE_DOWNLOAD: {
    action: 'export',
    description: 'Un fichier a été téléchargé',
    resource: 'Fichier importé',
  },
  DATA_CLASSIFY: {
    action: 'analyse',
    description: 'Un fichier a été analysé et ses colonnes classées',
    resource: 'Classification des données',
  },
  DATA_RECLASSIFY: {
    action: 'modification',
    description: 'Une catégorie de données a été corrigée à la main',
    resource: 'Classification des données',
  },
  SECURITY_ANALYZE_MESSAGE: {
    action: 'analyse',
    description: 'Un message suspect a été vérifié',
    resource: 'Vérification de message',
  },
  DATA_SHARE_CREATE: {
    action: 'partage',
    description: 'Un partage sécurisé a été créé',
    resource: 'Partage de données',
  },
  DATA_SHARE_REVOKE: {
    action: 'partage',
    description: 'Un partage de données a été retiré',
    resource: 'Partage de données',
  },
  DATA_SHARE_ACCESS: {
    action: 'partage',
    description: 'Un partenaire a ouvert un lien de partage',
    resource: 'Partage de données',
  },
  USER_INVITE: {
    action: 'droits',
    description: 'Un nouveau membre a été invité',
    resource: 'Comptes des membres',
  },
  USER_UPDATE: {
    action: 'droits',
    description: 'Le rôle ou l’accès d’un membre a été modifié',
    resource: 'Comptes des membres',
  },
  PRODUCER_CREATE: {
    action: 'modification',
    description: 'Un producteur a été ajouté',
    resource: 'Fiches producteurs',
  },
  PRODUCER_UPDATE: {
    action: 'modification',
    description: 'Une fiche producteur a été mise à jour',
    resource: 'Fiches producteurs',
  },
  PRODUCER_DELETE: {
    action: 'modification',
    description: 'Un producteur a été retiré de la liste',
    resource: 'Fiches producteurs',
  },
  FARM_CREATE: {
    action: 'modification',
    description: 'Une exploitation a été ajoutée',
    resource: 'Exploitations',
  },
  FARM_UPDATE: {
    action: 'modification',
    description: 'Une exploitation a été mise à jour',
    resource: 'Exploitations',
  },
  FARM_DELETE: {
    action: 'modification',
    description: 'Une exploitation a été retirée',
    resource: 'Exploitations',
  },
}

function toOutcome(result: string): AuditOutcome {
  switch (result.toUpperCase()) {
    case 'FAILURE':
      return 'blocked'
    case 'DEGRADED':
      return 'watched'
    default:
      return 'allowed'
  }
}

function toLevel(level: string | null): RiskLevel {
  switch ((level ?? '').toUpperCase()) {
    case 'CRITICAL':
      return 'critical'
    case 'HIGH':
      return 'high'
    case 'MEDIUM':
      return 'medium'
    default:
      return 'low'
  }
}

function dayLabel(date: Date): string {
  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const diffDays = Math.round(
    (startOfDay(new Date()) - startOfDay(date)) / 86_400_000,
  )
  if (diffDays === 0) return "Aujourd'hui"
  if (diffDays === 1) return 'Hier'
  const label = date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function noteFor(view: AuditLogView, outcome: AuditOutcome): string | undefined {
  if (view.action === 'LOGIN_FAILED') {
    return 'Personne n’est entré : le mot de passe fourni était incorrect ou le compte était protégé. En cas de tentatives répétées, le compte se verrouille automatiquement.'
  }
  if (outcome === 'watched') {
    return 'L’analyse automatique complète n’était pas disponible à ce moment-là : des règles simplifiées ont été utilisées. Le résultat reste fiable mais mérite un second regard.'
  }
  return undefined
}

export function toEntry(view: AuditLogView): AuditEntry {
  const info: ActionInfo = ACTION_MAP[view.action] ?? {
    action: 'consultation',
    description: 'Une action a été enregistrée sur la plateforme',
    resource: view.resourceType,
  }
  const createdAt = new Date(view.createdAt)
  const outcome = toOutcome(view.result)
  return {
    id: view.id,
    action: info.action,
    description: info.description,
    resource: info.resource,
    day: dayLabel(createdAt),
    time: createdAt.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    createdAt,
    outcome,
    level: toLevel(view.riskLevel),
    note: noteFor(view, outcome),
  }
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

export async function fetchAuditEntries(): Promise<AuditEntry[]> {
  const views = await api.get<AuditLogView[]>('/audit/recent')
  return views.map(toEntry)
}

// ---------------------------------------------------------------------------
// Utilitaires
// ---------------------------------------------------------------------------

/** Regroupe les entrées par journée en conservant l'ordre du journal. */
export function groupByDay(entries: AuditEntry[]) {
  const groups: { day: string; entries: AuditEntry[] }[] = []
  for (const entry of entries) {
    const last = groups[groups.length - 1]
    if (last && last.day === entry.day) last.entries.push(entry)
    else groups.push({ day: entry.day, entries: [entry] })
  }
  return groups
}

