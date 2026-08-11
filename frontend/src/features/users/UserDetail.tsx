import { useState } from 'react'
import { motion } from 'motion/react'
import {
  Check,
  Info,
  Mail,
  ShieldCheck,
  UserX,
} from 'lucide-react'
import { SidePanel } from '@/components/common/SidePanel'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import type { ApiRole } from '@/types/api'
import {
  ROLE_LABELS,
  ROLE_OPTIONS,
  STATUS_LABELS,
  formatJoinedAt,
  initials,
  type Member,
} from './users-data'

export function UserDetail({
  member,
  isSelf,
  onClose,
  onChangeRole,
  onToggleAccess,
}: {
  member: Member | null
  isSelf: boolean
  onClose: () => void
  onChangeRole: (id: string, role: ApiRole) => Promise<void>
  onToggleAccess: (member: Member) => Promise<void>
}) {
  return (
    <SidePanel
      open={member !== null}
      onClose={onClose}
      label={member ? `Fiche de ${member.fullName}` : 'Fiche du membre'}
      header={
        member && (
          <div className="flex items-center gap-3">
            <span
              className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-50 font-display text-sm font-bold text-brand-900"
              aria-hidden
            >
              {initials(member.fullName)}
            </span>
            <div className="min-w-0">
              <h2 className="font-display text-lg font-semibold leading-snug">
                {member.fullName}
              </h2>
              <p className="mt-0.5 text-[13px] text-ink-muted">
                {ROLE_LABELS[member.role]} · {STATUS_LABELS[member.status]}
              </p>
            </div>
          </div>
        )
      }
    >
      {member && (
        <Body
          key={member.id}
          member={member}
          isSelf={isSelf}
          onChangeRole={onChangeRole}
          onToggleAccess={onToggleAccess}
        />
      )}
    </SidePanel>
  )
}

/** Monté avec une clé par membre : l'état repart de zéro à chaque ouverture. */
function Body({
  member,
  isSelf,
  onChangeRole,
  onToggleAccess,
}: {
  member: Member
  isSelf: boolean
  onChangeRole: (id: string, role: ApiRole) => Promise<void>
  onToggleAccess: (member: Member) => Promise<void>
}) {
  const [openRoles, setOpenRoles] = useState(false)
  const [blocked, setBlocked] = useState(false)
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const disabled = member.status === 'disabled'

  async function run(action: () => Promise<void>, successMessage: string) {
    setBusy(true)
    setError(null)
    setFeedback(null)
    try {
      await action()
      setFeedback(successMessage)
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : 'La modification n’a pas pu être enregistrée. Réessayez dans un instant.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <section>
        <h3 className="text-[13px] font-medium text-ink-muted">Contact</h3>
        <p className="mt-1.5 flex items-center gap-2 text-[15px]">
          <Mail className="size-4 shrink-0 text-ink-muted" aria-hidden />
          {member.email}
        </p>
      </section>

      <section>
        <h3 className="text-[13px] font-medium text-ink-muted">Rôle</h3>

        <button
          type="button"
          disabled={busy}
          onClick={() => {
            if (isSelf) {
              setBlocked(true)
              return
            }
            setOpenRoles((open) => !open)
          }}
          aria-expanded={isSelf ? undefined : openRoles}
          className={cn(
            'mt-1.5 flex w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors',
            isSelf
              ? 'border-line bg-canvas text-ink-muted'
              : 'border-line bg-surface hover:border-brand-600',
          )}
        >
          <span className="text-[15px] font-medium">
            {ROLE_LABELS[member.role]}
          </span>
          <span className="shrink-0 text-[13px] text-brand-600">
            {isSelf ? '' : openRoles ? 'Fermer' : 'Changer'}
          </span>
        </button>

        {isSelf && blocked && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 flex items-start gap-2.5 rounded-xl border border-line bg-canvas p-3.5 text-[13px] leading-relaxed text-ink-muted"
          >
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
            Vous ne pouvez pas modifier votre propre rôle. Demandez à un autre
            responsable de le faire pour vous.
          </motion.p>
        )}

        {openRoles && !isSelf && (
          <motion.ul
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 space-y-2"
          >
            {ROLE_OPTIONS.map((option) => (
              <li key={option.value}>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setOpenRoles(false)
                    void run(
                      () => onChangeRole(member.id, option.value),
                      `${member.fullName} est maintenant ${option.label.toLowerCase()}.`,
                    )
                  }}
                  className={cn(
                    'flex w-full items-start gap-2.5 rounded-xl border p-3.5 text-left transition-colors',
                    option.value === member.role
                      ? 'border-brand-600 bg-brand-50'
                      : 'border-line hover:border-brand-600',
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">
                      {option.label}
                    </span>
                    <span className="mt-0.5 block text-[13px] leading-snug text-ink-muted">
                      {option.description}
                    </span>
                  </span>
                  {option.value === member.role && (
                    <Check
                      className="mt-0.5 size-4 shrink-0 text-brand-600"
                      aria-hidden
                    />
                  )}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </section>

      <section>
        <h3 className="text-[13px] font-medium text-ink-muted">Compte</h3>
        <ul className="mt-1.5 space-y-1.5 text-[15px]">
          <li>Membre depuis le {formatJoinedAt(member.joinedAt)}</li>
          <li className="flex items-center gap-2 text-ink-muted">
            <ShieldCheck
              className={cn(
                'size-4 shrink-0',
                member.mfaEnabled ? 'text-risk-low' : 'text-ink-disabled',
              )}
              aria-hidden
            />
            {member.mfaEnabled
              ? 'La double vérification est activée sur ce compte.'
              : 'La double vérification n’est pas encore activée.'}
          </li>
        </ul>
      </section>

      {feedback && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2.5 rounded-2xl border border-brand-600/25 bg-brand-50 p-4 text-sm leading-relaxed text-brand-900"
        >
          <Check className="mt-0.5 size-4 shrink-0" aria-hidden />
          {feedback}
        </motion.p>
      )}

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-risk-critical/25 bg-risk-critical/8 p-4 text-sm leading-relaxed text-risk-critical"
        >
          {error}
        </motion.p>
      )}

      <div className="space-y-2.5 border-t border-line pt-4">
        {isSelf ? (
          <p className="flex items-start gap-2.5 px-1 text-[13px] leading-relaxed text-ink-muted">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
            Vous ne pouvez pas désactiver votre propre accès.
          </p>
        ) : disabled ? (
          <Button
            variant="secondary"
            className="w-full"
            disabled={busy}
            onClick={() =>
              void run(
                () => onToggleAccess(member),
                `${member.fullName} peut de nouveau se connecter à la plateforme.`,
              )
            }
          >
            <Check className="size-4" aria-hidden />
            {busy ? 'Un instant…' : 'Rendre l’accès'}
          </Button>
        ) : (
          <Button
            variant="secondary"
            className="w-full text-risk-critical hover:bg-risk-critical/8"
            disabled={busy}
            onClick={() =>
              void run(
                () => onToggleAccess(member),
                `${member.fullName} ne peut plus se connecter. Vous pouvez lui rendre l’accès à tout moment.`,
              )
            }
          >
            <UserX className="size-4" aria-hidden />
            {busy ? 'Un instant…' : 'Désactiver l’accès'}
          </Button>
        )}
      </div>
    </>
  )
}

