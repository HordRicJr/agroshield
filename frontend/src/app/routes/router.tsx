import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { LoginPage } from '@/features/auth/LoginPage'
import { RegisterPage } from '@/features/auth/RegisterPage'
import { ForbiddenPage } from '@/pages/ForbiddenPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { PlaceholderPage } from '@/pages/PlaceholderPage'
import { ROUTES } from '@/config/routes'
import { ProtectedRoute } from './ProtectedRoute'
import {
  AlertsPage,
  AuditLogPage,
  ClassificationPage,
  DashboardPage,
  FraudGuardPage,
  ImportPage,
  OrganizationPage,
  ProducersPage,
  ProfilePage,
  TrainingPage,
  UsersPage,
} from './lazy-pages'

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: ROUTES.login, element: <LoginPage /> },
      { path: ROUTES.register, element: <RegisterPage /> },
      {
        path: ROUTES.mfa,
        element: (
          <PlaceholderPage
            title="Vérification en deux étapes"
            description="Un code à 6 chiffres est envoyé sur votre téléphone."
            step={2}
            upcoming={[
              'Saisie du code à 6 chiffres, chiffre par chiffre',
              'Renvoi du code après 30 secondes',
              'Message clair si le code est expiré ou incorrect',
            ]}
          />
        ),
      },
      {
        path: ROUTES.forgotPassword,
        element: (
          <PlaceholderPage
            title="Mot de passe oublié"
            description="Récupérez l’accès à votre compte."
            step={2}
            upcoming={[
              'Envoi d’un lien de réinitialisation par email ou SMS',
              'Choix d’un nouveau mot de passe avec indicateur de solidité',
              'Déconnexion automatique des autres appareils',
            ]}
          />
        ),
      },
    ],
  },
  {
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to={ROUTES.dashboard} replace /> },
      {
        path: ROUTES.dashboard,
        element: <DashboardPage />,
      },
      { path: ROUTES.fraudGuard, element: <FraudGuardPage /> },
      { path: ROUTES.training, element: <TrainingPage /> },
      {
        path: ROUTES.auditLogs,
        element: (
          <ProtectedRoute requiredPermissions={['AUDIT_VIEW']}>
            <AuditLogPage />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.import,
        element: (
          <ProtectedRoute requiredPermissions={['DATA_WRITE']}>
            <ImportPage />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.classification,
        element: (
          <ProtectedRoute requiredPermissions={['DATA_READ', 'DATA_WRITE']}>
            <ClassificationPage />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.producers,
        element: (
          <ProtectedRoute requiredPermissions={['DATA_READ']}>
            <ProducersPage />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.alerts,
        element: (
          <ProtectedRoute requiredPermissions={['SECURITY_VIEW', 'SECURITY_MANAGE']}>
            <AlertsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.users,
        element: (
          <ProtectedRoute requiredPermissions={['USER_MANAGE']}>
            <UsersPage />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.organization,
        element: (
          <ProtectedRoute requiredPermissions={['USER_MANAGE']}>
            <OrganizationPage />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.profile,
        element: <ProfilePage />,
      },
      {
        path: ROUTES.securitySettings,
        element: (
          <PlaceholderPage
            title="Sécurité du compte"
            description="Double vérification et appareils connectés."
            step={8}
            upcoming={[
              'Activation de la vérification par SMS',
              'Liste des appareils connectés avec lieu et date',
              'Déconnexion à distance d’un appareil perdu',
            ]}
          />
        ),
      },
    ],
  },
  { path: ROUTES.forbidden, element: <ForbiddenPage /> },
  { path: '*', element: <NotFoundPage /> },
])
