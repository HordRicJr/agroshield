export const ROLES = {
  PRODUCTEUR: 'producteur',
  TECHNICIEN: 'technicien',
  AGRONOME: 'agronome',
  RESPONSABLE: 'responsable',
  ADMIN: 'admin',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

export const ROLE_LABELS: Record<Role, string> = {
  producteur: 'Producteur',
  technicien: 'Technicien',
  agronome: 'Agronome',
  responsable: 'Responsable de coopérative',
  admin: 'Administrateur',
}

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

import type { ApiRole, Permission } from './api'

/** Rôles backend (MAJUSCULES) → rôles UI (minuscules). */
export const API_ROLE_TO_UI: Record<ApiRole, Role> = {
  PRODUCTEUR: 'producteur',
  TECHNICIEN: 'technicien',
  AGRONOME: 'agronome',
  RESPONSABLE: 'responsable',
  RESPONSABLE_SECURITE: 'responsable',
  ADMIN: 'admin',
}

export function toUiRole(apiRoles: ApiRole[]): Role {
  // Le rôle le plus « élevé » gagne (admin > responsable > agronome > technicien > producteur).
  const priority: Role[] = ['admin', 'responsable', 'agronome', 'technicien', 'producteur']
  const uiRoles = apiRoles.map((r) => API_ROLE_TO_UI[r]).filter(Boolean)
  return priority.find((r) => uiRoles.includes(r)) ?? 'producteur'
}

export interface User {
  id: string
  fullName: string
  email: string
  role: Role
  organizationId: string
  organizationName: string
  mfaEnabled: boolean
  permissions: Permission[]
}
