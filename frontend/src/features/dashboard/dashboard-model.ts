import type { RiskLevel } from '@/types'
import type { AlertView, DashboardSummary } from '@/types/api'

/**
 * Modèle d'affichage du tableau de bord + mapping depuis l'API.
 * Tout le vocabulaire reste compréhensible par un non-technicien.
 */

export interface ScoreCategory {
  label: string
  helper: string
  advice: string
  value: number
}

export interface DashboardAlert {
  id: string
  level: RiskLevel
  title: string
  status: 'todo' | 'done'
  when: string
}

export interface PriorityItem {
  id: string
  level: RiskLevel
  title: string
  person?: string
  role?: string
  plain: string
  reasons: string[]
  primaryAction: string
  secondaryAction: string
}

export interface MemberTask {
  id: string
  title: string
  helper: string
  done: boolean
}

export interface MemberView {
  isSafe: boolean
  headline: string
  plain: string
  lastCheck: string
  tasks: MemberTask[]
}

export interface DashboardData {
  protection: {
    value: number
    previous: number
    updatedAt: string
    categories: ScoreCategory[]
  }
  priority: PriorityItem | null
  alerts: DashboardAlert[]
  member: MemberView
  isEmpty: boolean
}

// ---------------------------------------------------------------------------
// Mapping API → UI
// ---------------------------------------------------------------------------

const CATEGORY_TEXT: Record<string, { helper: string; advice: (score: number) => string }> = {
  authentication: {
    helper: 'Solidité et vérification en deux étapes',
    advice: (s) =>
      s >= 80
        ? 'Les comptes sont bien protégés.'
        : 'Encouragez les membres à activer la vérification en deux étapes.',
  },
  access: {
    helper: 'Autorisations des membres',
    advice: (s) =>
      s >= 80
        ? 'Les autorisations sont bien réparties.'
        : 'Des situations en cours demandent une vérification des accès.',
  },
  data: {
    helper: 'Informations sensibles des producteurs',
    advice: (s) =>
      s >= 80
        ? 'Les informations sensibles sont sous contrôle.'
        : 'Des colonnes sensibles attendent votre validation.',
  },
  alerts: {
    helper: 'Rapidité de réaction',
    advice: (s) =>
      s >= 80
        ? 'Les alertes sont traitées rapidement.'
        : 'Des alertes attendent d’être traitées.',
  },
  incidents: {
    helper: 'Situations en cours',
    advice: (s) =>
      s >= 80
        ? 'Aucune situation grave en cours.'
        : 'Des situations sont encore ouvertes — traitez-les dès que possible.',
  },
  vigilance: {
    helper: 'Activité inhabituelle sur 7 jours',
    advice: (s) =>
      s >= 80
        ? 'Rien d’inhabituel repéré cette semaine.'
        : 'Plusieurs comportements inhabituels ont été repérés cette semaine.',
  },
}

export function apiLevelToUi(level: string): RiskLevel {
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

export function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const minutes = Math.round(diffMs / 60_000)
  if (minutes < 1) return 'à l’instant'
  if (minutes < 60) return `il y a ${minutes} min`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `il y a ${hours} h`
  const days = Math.round(hours / 24)
  return days === 1 ? 'hier' : `il y a ${days} jours`
}

function toAlert(alert: AlertView): DashboardAlert {
  return {
    id: alert.id,
    level: apiLevelToUi(alert.level),
    title: alert.message,
    status: alert.acknowledgedAt ? 'done' : 'todo',
    when: relativeTime(alert.createdAt),
  }
}

function toPriority(summary: DashboardSummary): PriorityItem | null {
  const urgent = summary.recentAlerts.find(
    (alert) =>
      !alert.acknowledgedAt &&
      (alert.level === 'CRITICAL' || alert.level === 'HIGH'),
  )
  if (!urgent) return null
  return {
    id: urgent.id,
    level: apiLevelToUi(urgent.level),
    title: urgent.message,
    plain:
      'Une situation inhabituelle a été repérée. Ce n’est pas forcément grave : vérifiez avant d’agir.',
    reasons: [
      `Niveau estimé : ${urgent.level === 'CRITICAL' ? 'critique' : 'élevé'}.`,
      `Signalée ${relativeTime(urgent.createdAt)}.`,
    ],
    primaryAction: 'Voir le détail',
    secondaryAction: 'Marquer comme traité',
  }
}

function toMemberView(summary: DashboardSummary): MemberView {
  const isSafe = summary.criticalOpenIncidents === 0
  return {
    isSafe,
    headline: isSafe ? 'Votre compte est protégé' : 'Vérifiez votre compte',
    plain: isSafe
      ? 'Rien d’inhabituel n’a été repéré sur votre compte. Vous pouvez travailler tranquillement.'
      : 'Une activité inhabituelle a été repérée. Suivez les recommandations ci-dessous.',
    lastCheck: 'Vérifié à l’instant',
    tasks: [
      {
        id: 'task-mfa',
        title: 'Activer la vérification par SMS',
        helper: 'Un code vous sera envoyé à chaque connexion depuis un nouvel appareil.',
        done: false,
      },
      {
        id: 'task-phishing',
        title: 'Apprendre à reconnaître un faux message',
        helper: 'Utilisez « Vérifier un message » au moindre doute.',
        done: false,
      },
      {
        id: 'task-password',
        title: 'Choisir un mot de passe solide',
        helper: 'Votre mot de passe respecte les règles de sécurité.',
        done: true,
      },
    ],
  }
}

export function mapSummary(summary: DashboardSummary): DashboardData {
  const categories: ScoreCategory[] = summary.categories.map((category) => {
    const text = CATEGORY_TEXT[category.key]
    return {
      label: category.label,
      helper: text?.helper ?? '',
      advice: text?.advice(category.score) ?? '',
      value: category.score,
    }
  })

  const alerts = summary.recentAlerts.map(toAlert)

  return {
    protection: {
      value: summary.cyberScore,
      previous: summary.cyberScore,
      updatedAt: 'mis à jour à l’instant',
      categories,
    },
    priority: toPriority(summary),
    alerts,
    member: toMemberView(summary),
    isEmpty:
      alerts.length === 0 &&
      summary.openIncidents === 0 &&
      summary.threatsDetected7d === 0,
  }
}


