import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { EmptyState } from '@/components/common/EmptyState'
import { ROUTES } from '@/config/routes'

export function NotFoundPage() {
  return (
    <div className="grid min-h-dvh place-items-center px-5">
      <EmptyState
        icon={Compass}
        title="Page introuvable"
        description="Le lien que vous avez suivi n'existe plus ou a été déplacé."
        action={
          <Link
            to={ROUTES.dashboard}
            className="inline-flex h-11 items-center rounded-xl bg-brand-900 px-4 font-medium text-white hover:bg-brand-600"
          >
            Revenir à l'accueil
          </Link>
        }
      />
    </div>
  )
}
