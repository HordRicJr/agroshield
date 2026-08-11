import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { ROUTES } from '@/config/routes'
import type { Permission } from '@/types/api'
import type { Role } from '@/types'

export function ProtectedRoute({
  children,
  allowedRoles,
  requiredPermissions,
}: {
  children: ReactNode
  allowedRoles?: Role[]
  /** L'utilisateur doit posséder AU MOINS UNE de ces permissions. */
  requiredPermissions?: Permission[]
}) {
  const { user, status, hasPermission } = useAuth()
  const location = useLocation()

  // Session en cours de restauration (refresh token présent) : ne pas
  // rediriger vers /connexion avant d'avoir la réponse du serveur.
  if (status === 'restoring') {
    return (
      <div className="grid min-h-dvh place-items-center bg-canvas">
        <div className="flex flex-col items-center gap-3 text-ink-muted">
          <span className="size-8 animate-spin rounded-full border-2 border-line border-t-brand-600" />
          <p className="text-sm">Reconnexion en cours…</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to={ROUTES.login} state={{ from: location }} replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={ROUTES.forbidden} replace />
  }

  if (requiredPermissions && !requiredPermissions.some(hasPermission)) {
    return <Navigate to={ROUTES.forbidden} replace />
  }

  return children
}
