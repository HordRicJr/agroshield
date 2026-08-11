import { api } from '@/lib/api'
import type { AlertView, IncidentView } from '@/types/api'
import type { RiskLevel } from '@/types'

/**
 * Alertes réelles chargées depuis l'API (alertes + incidents liés).
 */

export type AlertStatus = 'new' | 'progress' | 'done'

export type AlertIcon =
  | 'export'
  | 'login'
  | 'phishing'
  | 'share'
  | 'device'
  | 'rights'

export interface AlertFactor {
  label: string
  detail: string
  weight: number
}

export interface SecurityAlert {
  id: string
  icon: AlertIcon
  level: RiskLevel
  status: AlertStatus
  title: string
  subject: string
  when: string
  summary: string
  factors: AlertFactor[]
  closedBy?: string
}

export const LEVEL_LABELS: Record<RiskLevel, string> = {
  low: 'Faible',
  medium: 'Moyen',
  high: 'Élevé',
  critical: 'Critique',
}

export const STATUS_LABELS: Record<AlertStatus, string> = {
  new: 'Nouvelle',
  progress: 'En cours',
  done: 'Traitée',
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

const INCIDENT_TYPE_LABELS: Record<string, string> = {
  SUSPICIOUS_MESSAGE: 'Message suspect analysé',
}

const INCIDENT_TYPE_ICONS: Record<string, AlertIcon> = {
  SUSPICIOUS_MESSAGE: 'phishing',
}

function toLevel(level: string): RiskLevel {
  switch (level.toUpperCase()) {
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

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const minutes = Math.round(diffMs / 60_000)
  if (minutes < 1) return 'à l’instant'
  if (minutes < 60) return `il y a ${minutes} min`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `il y a ${hours} h`
  const days = Math.round(hours / 24)
  return days === 1 ? 'hier' : `il y a ${days} jours`
}

function toSecurityAlert(
  alert: AlertView,
  incidents: Map<string, IncidentView>,
): SecurityAlert {
  const incident = alert.incidentId ? incidents.get(alert.incidentId) : undefined
  return {
    id: alert.id,
    icon: (incident && INCIDENT_TYPE_ICONS[incident.type]) ?? 'login',
    level: toLevel(alert.level),
    status: alert.acknowledgedAt ? 'done' : 'new',
    title: alert.message,
    subject:
      (incident && (INCIDENT_TYPE_LABELS[incident.type] ?? incident.type)) ??
      'Événement de sécurité',
    when: relativeTime(alert.createdAt),
    summary: incident?.description ?? alert.message,
    factors: [],
  }
}

export async function fetchAlerts(): Promise<SecurityAlert[]> {
  const [alerts, incidents] = await Promise.all([
    api.get<AlertView[]>('/alerts'),
    api.get<IncidentView[]>('/incidents').catch(() => [] as IncidentView[]),
  ])
  const incidentMap = new Map(incidents.map((incident) => [incident.id, incident]))
  return sortAlerts(alerts.map((alert) => toSecurityAlert(alert, incidentMap)))
}

export function acknowledgeAlert(id: string): Promise<AlertView> {
  return api.post<AlertView>(`/alerts/${id}/acknowledge`)
}

// ---------------------------------------------------------------------------
// Tri
// ---------------------------------------------------------------------------

const RANK: Record<RiskLevel, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
}

const STATUS_RANK: Record<AlertStatus, number> = {
  new: 0,
  progress: 1,
  done: 2,
}

export function sortAlerts(list: SecurityAlert[]) {
  return [...list].sort((a, b) => {
    if (STATUS_RANK[a.status] !== STATUS_RANK[b.status]) {
      return STATUS_RANK[a.status] - STATUS_RANK[b.status]
    }
    return RANK[a.level] - RANK[b.level]
  })
}
