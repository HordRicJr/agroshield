import { useState } from 'react'
import { motion } from 'motion/react'
import { Check, Copy, KeyRound, Send, UserPlus } from 'lucide-react'
import { SidePanel } from '@/components/common/SidePanel'
import { Button } from '@/components/ui/Button'
import { ApiError } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { ApiRole, InviteUserRequest } from '@/types/api'
import { generateTemporaryPassword, ROLE_OPTIONS } from './users-data'

export function InvitePanel({
  open,
  onClose,
  onInvite,
}: {
  open: boolean
  onClose: () => void
  onInvite: (request: InviteUserRequest) => Promise<void>
}) {
  return (
    <SidePanel
      open={open}
      onClose={onClose}
      label="Inviter un utilisateur"
      header={
        <div>
          <h2 className="font-display text-lg font-semibold">
            Inviter un utilisateur
          </h2>
          <p className="mt-0.5 text-[13px] text-ink-muted">
            Le compte est créé tout de suite, avec un mot de passe provisoire à
            transmettre à la personne.
          </p>
        </div>
      }
    >
      {open && <InviteForm onClose={onClose} onInvite={onInvite} />}
    </SidePanel>
  )
}

function InviteForm({
  onClose,
  onInvite,
}: {
  onClose: () => void
  onInvite: (request: InviteUserRequest) => Promise<void>
}) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<ApiRole>('TECHNICIEN')
  const [password] = useState(generateTemporaryPassword)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  const ready = fullName.trim().length > 1 && emailOk

  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center px-2 py-10 text-center"
      >
        <span className="grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-900">
          <Check className="size-7" aria-hidden />
        </span>
        <h3 className="mt-5 font-display text-lg font-semibold">
          Compte créé
        </h3>
        <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-ink-muted">
          {fullName.trim()} peut se connecter avec l’adresse{' '}
          <strong className="text-ink">{email.trim()}</strong> et le mot de
          passe provisoire ci-dessous.
        </p>

        <div className="mt-5 flex w-full max-w-xs items-center justify-between gap-3 rounded-xl border border-line bg-canvas px-4 py-3">
          <span className="flex items-center gap-2 font-mono text-[15px] tracking-wide">
            <KeyRound className="size-4 shrink-0 text-ink-muted" aria-hidden />
            {password}
          </span>
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard?.writeText(password)
              setCopied(true)
            }}
            className="shrink-0 text-brand-600 transition-colors hover:text-brand-900"
            aria-label="Copier le mot de passe provisoire"
          >
            {copied ? (
              <Check className="size-4" aria-hidden />
            ) : (
              <Copy className="size-4" aria-hidden />
            )}
          </button>
        </div>
        <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-ink-muted">
          Transmettez-le de vive voix ou par SMS — il ne sera plus affiché
          ensuite.
        </p>

        <Button className="mt-6" onClick={onClose}>
          Revenir à la liste
        </Button>
      </motion.div>
    )
  }

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault()
        if (!ready || sending) return
        setSending(true)
        setError(null)
        onInvite({
          email: email.trim(),
          fullName: fullName.trim(),
          temporaryPassword: password,
          roleCode: role,
        })
          .then(() => setSent(true))
          .catch((err) => {
            setError(
              err instanceof ApiError && !err.isNetworkError
                ? err.message
                : 'Le compte n’a pas pu être créé. Vérifiez votre connexion et réessayez.',
            )
          })
          .finally(() => setSending(false))
      }}
    >
      <label className="block">
        <span className="mb-1.5 block text-[13px] font-medium text-ink-muted">
          Nom de la personne
        </span>
        <input
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          placeholder="Ex. Ama Dogbé"
          autoComplete="off"
          maxLength={255}
          className="w-full rounded-xl border border-line bg-surface px-3.5 py-3 text-[15px] outline-none transition-colors placeholder:text-ink-disabled focus-visible:border-brand-600 focus-visible:ring-2 focus-visible:ring-brand-600/25"
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-[13px] font-medium text-ink-muted">
          Adresse e-mail
        </span>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="ama.dogbe@exemple.tg"
          autoComplete="off"
          maxLength={320}
          className="w-full rounded-xl border border-line bg-surface px-3.5 py-3 text-[15px] outline-none transition-colors placeholder:text-ink-disabled focus-visible:border-brand-600 focus-visible:ring-2 focus-visible:ring-brand-600/25"
        />
        <span className="mt-1.5 block text-[13px] text-ink-muted">
          C’est l’identifiant que la personne utilisera pour se connecter.
        </span>
      </label>

      <fieldset>
        <legend className="mb-1.5 text-[13px] font-medium text-ink-muted">
          Que pourra faire cette personne ?
        </legend>
        <ul className="space-y-2">
          {ROLE_OPTIONS.map((option) => (
            <li key={option.value}>
              <label
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors',
                  role === option.value
                    ? 'border-brand-600 bg-brand-50'
                    : 'border-line hover:border-brand-600',
                )}
              >
                <input
                  type="radio"
                  name="role"
                  value={option.value}
                  checked={role === option.value}
                  onChange={() => setRole(option.value)}
                  className="sr-only"
                />
                <span
                  className={cn(
                    'mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2',
                    role === option.value
                      ? 'border-brand-600 bg-brand-600 text-white'
                      : 'border-line',
                  )}
                  aria-hidden
                >
                  {role === option.value && <Check className="size-3" />}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium">
                    {option.label}
                  </span>
                  <span className="mt-0.5 block text-[13px] leading-snug text-ink-muted">
                    {option.description}
                  </span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      </fieldset>

      {error && (
        <p className="rounded-xl border border-risk-critical/25 bg-risk-critical/8 p-3.5 text-[13px] leading-relaxed text-risk-critical">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={!ready || sending}>
        <Send className="size-4" aria-hidden />
        {sending ? 'Création du compte…' : 'Créer le compte'}
      </Button>

      {!ready && (
        <p className="flex items-start gap-2 text-[13px] leading-relaxed text-ink-muted">
          <UserPlus className="mt-0.5 size-4 shrink-0" aria-hidden />
          Indiquez le nom et une adresse e-mail valide pour pouvoir créer le
          compte.
        </p>
      )}
    </form>
  )
}

