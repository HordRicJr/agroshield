import { api } from '@/lib/api'
import type {
  ApiRole,
  InviteUserRequest,
  MemberView,
  UpdateMemberRequest,
} from '@/types/api'

/**
 * Membres réels de l'organisation, chargés depuis l'API
 * (`GET/POST/PATCH /users` — réservé aux comptes qui gèrent l'équipe).
 */

export type MemberStatus = 'active' | 'disabled'

export interface Member {
  id: string
  fullName: string
  email: string
  role: ApiRole
  status: MemberStatus
  mfaEnabled: boolean
  /** Date d'arrivée dans l'organisation (ISO). */
  joinedAt: string
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

function toMember(view: MemberView): Member {
  return {
    id: view.userId,
    fullName: view.fullName,
    email: view.email,
    role: view.roleCode,
    status: view.status === 'DISABLED' ? 'disabled' : 'active',
    mfaEnabled: view.mfaEnabled,
    joinedAt: view.joinedAt,
  }
}

export async function fetchMembers(): Promise<Member[]> {
  const views = await api.get<MemberView[]>('/users')
  return views.map(toMember)
}

export async function inviteMember(request: InviteUserRequest): Promise<Member> {
  const view = await api.post<MemberView>('/users', request)
  return toMember(view)
}

export async function updateMember(
  userId: string,
  request: UpdateMemberRequest,
): Promise<Member> {
  const view = await api.patch<MemberView>(`/users/${userId}`, request)
  return toMember(view)
}

// ---------------------------------------------------------------------------
// Rôles — libellés sans vocabulaire technique
// ---------------------------------------------------------------------------

export interface RoleOption {
  value: ApiRole
  label: string
  description: string
}

/** Décrit ce que chaque rôle peut faire, sans vocabulaire technique. */
export const ROLE_OPTIONS: RoleOption[] = [
  {
    value: 'PRODUCTEUR',
    label: 'Producteur',
    description: 'Voit uniquement sa propre fiche et ses productions.',
  },
  {
    value: 'TECHNICIEN',
    label: 'Technicien agricole',
    description:
      'Voit les producteurs et leurs cultures, sans accès aux montants.',
  },
  {
    value: 'AGRONOME',
    label: 'Agronome',
    description:
      'Suit les cultures et les rendements de plusieurs zones, sans accès aux montants.',
  },
  {
    value: 'RESPONSABLE',
    label: 'Responsable de coopérative',
    description:
      'Accès complet aux producteurs, aux paiements et aux alertes de sécurité.',
  },
  {
    value: 'RESPONSABLE_SECURITE',
    label: 'Responsable sécurité',
    description:
      'Surveille les alertes, les incidents et le journal d’activité.',
  },
  {
    value: 'ADMIN',
    label: 'Administrateur',
    description: 'Accès complet, et peut aussi inviter ou retirer des membres.',
  },
]

export const ROLE_LABELS = ROLE_OPTIONS.reduce(
  (acc, option) => {
    acc[option.value] = option.label
    return acc
  },
  {} as Record<ApiRole, string>,
)

export const STATUS_LABELS: Record<MemberStatus, string> = {
  active: 'Actif',
  disabled: 'Désactivé',
}

// ---------------------------------------------------------------------------
// Utilitaires
// ---------------------------------------------------------------------------

/** Actifs d'abord, comptes désactivés en fin de liste. */
const STATUS_ORDER: Record<MemberStatus, number> = {
  active: 0,
  disabled: 1,
}

export function sortMembers(list: Member[]) {
  return [...list].sort(
    (a, b) =>
      STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
      a.fullName.localeCompare(b.fullName, 'fr'),
  )
}

export function initials(fullName: string) {
  return fullName
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

export function formatJoinedAt(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Mot de passe temporaire lisible (à transmettre de vive voix ou par SMS).
 * Alphabet sans caractères ambigus (0/O, 1/l/I…).
 */
export function generateTemporaryPassword(): string {
  const alphabet = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789'
  const bytes = new Uint32Array(12)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (n) => alphabet[n % alphabet.length]).join('')
}

