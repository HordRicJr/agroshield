import { lazy } from 'react'

/** Pages chargées à la demande pour alléger le premier téléchargement. */

export const DashboardPage = lazy(
  () => import('@/features/dashboard/DashboardPage'),
)

export const ImportPage = lazy(() => import('@/features/import/ImportPage'))


export const ClassificationPage = lazy(
  () => import('@/features/classification/ClassificationPage'),
)

export const ProducersPage = lazy(
  () => import('@/features/producers/ProducersPage'),
)

export const AlertsPage = lazy(() => import('@/features/alerts/AlertsPage'))

export const FraudGuardPage = lazy(
  () => import('@/features/fraud-guard/FraudGuardPage'),
)

export const TrainingPage = lazy(() => import('@/features/training/TrainingPage'))

export const OrganizationPage = lazy(
  () => import('@/features/organization/OrganizationPage'),
)

export const UsersPage = lazy(() => import('@/features/users/UsersPage'))

export const AuditLogPage = lazy(() => import('@/features/audit/AuditLogPage'))

export const ProfilePage = lazy(() => import('@/features/auth/ProfilePage'))

