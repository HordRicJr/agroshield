import { Link } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { EmptyState } from '@/components/common/EmptyState'
import { ROUTES } from '@/config/routes'

export function ForbiddenPage() {
  return (
    <div className="grid min-h-dvh place-items-center px-5">
      <EmptyState
        icon={Lock}
        title="Cette page ne vous est pas accessible"
        description="Votre compte ne dispose pas des autorisations nécessaires. Contactez le responsable de votre coopérative si vous pensez qu'il s'agit d'une erreur."
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
