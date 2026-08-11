import {
  AlertTriangle,
  Building2,
  FileSpreadsheet,
  GraduationCap,
  LayoutDashboard,
  ScrollText,
  ShieldCheck,
  Sprout,
  Users,
  type LucideIcon,
} from 'lucide-react'
import type { Permission } from '@/types/api'
import { ROLES, type Role } from '@/types'
import type { User } from '@/types'
import { ROUTES } from './routes'

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
  roles: Role[]
  /** L'utilisateur doit posséder AU MOINS UNE de ces permissions. */
  requiredPermissions?: Permission[]
  /** Certains écrans changent de nom selon qui les consulte. */
  labelFor?: Partial<Record<Role, string>>
}

export interface NavSection {
  title: string
  items: NavItem[]
}

const ALL_ROLES: Role[] = Object.values(ROLES)

export const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Pilotage',
    items: [
      {
        label: 'Tableau de bord',
        to: ROUTES.dashboard,
        icon: LayoutDashboard,
        roles: ALL_ROLES,
      },
    ],
  },
  {
    title: 'Données agricoles',
    items: [
      {
        label: 'Importer un fichier',
        to: ROUTES.import,
        icon: FileSpreadsheet,
        roles: [ROLES.RESPONSABLE, ROLES.TECHNICIEN],
        requiredPermissions: ['DATA_WRITE'],
      },
      {
        label: 'Classification',
        to: ROUTES.classification,
        icon: Sprout,
        roles: [ROLES.RESPONSABLE, ROLES.ADMIN],
        requiredPermissions: ['DATA_READ', 'DATA_WRITE'],
      },
      {
        label: 'Producteurs',
        to: ROUTES.producers,
        icon: Users,
        roles: [
          ROLES.PRODUCTEUR,
          ROLES.TECHNICIEN,
          ROLES.AGRONOME,
          ROLES.RESPONSABLE,
        ],
        requiredPermissions: ['DATA_READ'],
        labelFor: { producteur: 'Mon profil' },
      },
    ],
  },
  {
    title: 'Sécurité',
    items: [
      {
        label: 'Vérifier un message',
        to: ROUTES.fraudGuard,
        icon: ShieldCheck,
        roles: ALL_ROLES,
      },
      {
        label: 'Formation sécurité',
        to: ROUTES.training,
        icon: GraduationCap,
        roles: ALL_ROLES,
      },
      {
        label: 'Alertes',
        to: ROUTES.alerts,
        icon: AlertTriangle,
        roles: [ROLES.RESPONSABLE, ROLES.ADMIN],
        requiredPermissions: ['SECURITY_VIEW', 'SECURITY_MANAGE'],
      },
      {
        label: "Journal d'activité",
        to: ROUTES.auditLogs,
        icon: ScrollText,
        roles: [ROLES.RESPONSABLE, ROLES.ADMIN],
        requiredPermissions: ['AUDIT_VIEW'],
      },
    ],
  },
  {
    title: 'Organisation',
    items: [
      {
        label: 'Utilisateurs',
        to: ROUTES.users,
        icon: Users,
        roles: [ROLES.RESPONSABLE, ROLES.ADMIN],
        requiredPermissions: ['USER_MANAGE'],
      },
      {
        label: 'Mon organisation',
        to: ROUTES.organization,
        icon: Building2,
        roles: [ROLES.RESPONSABLE, ROLES.ADMIN],
        requiredPermissions: ['USER_MANAGE'],
      },
    ],
  },
]

export function canAccessNavItem(user: User, item: NavItem): boolean {
  if (!item.roles.includes(user.role)) return false
  if (!item.requiredPermissions?.length) return true
  return item.requiredPermissions.some((permission) =>
    user.permissions.includes(permission),
  )
}

export function getNavigationForUser(user: User): NavSection[] {
  const role = user.role
  return NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items
      .filter((item) => canAccessNavItem(user, item))
      .map((item) => ({ ...item, label: item.labelFor?.[role] ?? item.label })),
  })).filter((section) => section.items.length > 0)
}
