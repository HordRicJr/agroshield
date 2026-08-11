import { Link } from 'react-router-dom'
import { Building2, Info, Mail, ShieldCheck, UserRound } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { ROUTES } from '@/config/routes'
import { ROLE_LABELS } from '@/types'
import { useAuth } from '@/hooks/useAuth'

/** Fiche personnelle en lecture seule (la modification arrivera plus tard). */
export default function ProfilePage() {
  const { user } = useAuth()

  if (!user) return null

  const initials = user.fullName
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Mon profil"
        description="Vos informations personnelles sur la plateforme."
      />

      <section className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-5 shadow-card">
        <span
          className="grid size-14 shrink-0 place-items-center rounded-full bg-brand-50 font-display text-lg font-bold text-brand-900"
          aria-hidden
        >
          {initials}
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-xl font-semibold leading-snug">
            {user.fullName}
          </h2>
          <p className="mt-1 inline-flex rounded-full bg-brand-50 px-2.5 py-1 text-[12px] font-medium text-brand-900">
            {ROLE_LABELS[user.role]}
          </p>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="mb-2.5 font-display text-[13px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
          Informations
        </h2>
        <dl className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
          <Row icon={Mail} label="Adresse e-mail" value={user.email} />
          <Row
            icon={UserRound}
            label="Rôle"
            value={ROLE_LABELS[user.role]}
          />
          <Row
            icon={Building2}
            label="Organisation"
            value={user.organizationName}
          />
          <Row
            icon={ShieldCheck}
            label="Double vérification"
            value={user.mfaEnabled ? 'Activée' : 'Pas encore activée'}
            faded={!user.mfaEnabled}
          />
        </dl>
      </section>

      <p className="mt-6 flex items-start gap-2.5 rounded-2xl border border-line bg-canvas p-4 text-[13px] leading-relaxed text-ink-muted">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span>
          La modification du nom, de l’e-mail et du mot de passe arrive bientôt.
          En attendant, si une information est incorrecte, demandez à un{' '}
          <Link
            to={ROUTES.users}
            className="font-medium text-brand-600 underline underline-offset-4"
          >
            responsable de votre organisation
          </Link>{' '}
          de vous aider.
        </span>
      </p>
    </div>
  )
}

function Row({
  icon: Icon,
  label,
  value,
  faded,
}: {
  icon: typeof Mail
  label: string
  value: string
  faded?: boolean
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <Icon className="size-4 shrink-0 text-ink-disabled" aria-hidden />
      <dt className="shrink-0 text-[13px] text-ink-muted">{label}</dt>
      <dd
        className={
          faded
            ? 'ml-auto text-right text-[15px] text-ink-disabled'
            : 'ml-auto text-right text-[15px]'
        }
      >
        {value}
      </dd>
    </div>
  )
}

