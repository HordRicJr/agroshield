import { CloudOff, RotateCw } from 'lucide-react'
import { Card, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export function ConnectionError({ onRetry }: { onRetry: () => void }) {
  return (
    <Card>
      <CardBody className="flex flex-col items-center px-6 py-16 text-center">
        <span className="grid size-14 place-items-center rounded-2xl bg-risk-medium/15 text-risk-high">
          <CloudOff className="size-6" aria-hidden />
        </span>
        <h2 className="mt-4 text-lg font-medium">
          Impossible d’afficher vos données pour le moment
        </h2>
        <p className="mt-1.5 max-w-md text-sm leading-relaxed text-ink-muted">
          La connexion avec le serveur d’AgroShield a été interrompue. Vos
          données ne sont pas perdues : elles s’afficheront de nouveau dès que
          la connexion sera rétablie.
        </p>
        <p className="mt-3 max-w-md text-[13px] text-ink-disabled">
          Vérifiez votre connexion internet, puis réessayez.
        </p>
        <Button onClick={onRetry} className="mt-6">
          <RotateCw className="size-4" aria-hidden />
          Réessayer
        </Button>
      </CardBody>
    </Card>
  )
}
