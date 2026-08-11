import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ROUTES } from '@/config/routes'
import { ApiError } from '@/lib/api'

function registerErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.isNetworkError) {
      return 'Le serveur ne répond pas. Vérifiez votre connexion et réessayez.'
    }
    if (error.status === 409 || error.code === 'EMAIL_TAKEN') {
      return 'Un compte existe déjà avec cette adresse email.'
    }
    if (error.status === 400) {
      return error.message || 'Vérifiez les informations saisies.'
    }
    return error.message
  }
  return 'Une erreur inattendue est survenue. Réessayez.'
}

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [organizationName, setOrganizationName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const passwordTooShort = password.length > 0 && password.length < 10

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (passwordTooShort) return
    setError(null)
    setIsLoading(true)
    try {
      await register({ email, password, fullName, organizationName })
      navigate(ROUTES.dashboard, { replace: true })
    } catch (err) {
      setError(registerErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h1 className="font-display text-[28px] font-semibold leading-tight">
          Créer votre espace
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          Ouvrez le compte sécurisé de votre coopérative ou exploitation.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-risk-critical/30 bg-risk-critical/5 p-3.5 text-sm text-risk-critical"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="space-y-4">
        <Input
          label="Votre nom complet"
          type="text"
          autoComplete="name"
          placeholder="Afiwa Kossi"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          required
        />

        <Input
          label="Nom de la coopérative ou exploitation"
          type="text"
          autoComplete="organization"
          placeholder="Coopérative du Zio"
          value={organizationName}
          onChange={(event) => setOrganizationName(event.target.value)}
          required
        />

        <Input
          label="Adresse email"
          type="email"
          autoComplete="email"
          placeholder="vous@cooperative.tg"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        <div>
          <label htmlFor="register-password" className="mb-1.5 block text-sm font-medium">
            Mot de passe
          </label>
          <div className="relative">
            <input
              id="register-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={10}
              className="h-11 w-full rounded-xl border border-line bg-surface pl-3.5 pr-11 text-ink placeholder:text-ink-disabled focus:border-brand-600 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={
                showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'
              }
              className="absolute right-1 top-1 grid size-9 place-items-center rounded-lg text-ink-muted hover:bg-canvas"
            >
              {showPassword ? (
                <EyeOff className="size-[18px]" />
              ) : (
                <Eye className="size-[18px]" />
              )}
            </button>
          </div>
          <p
            className={
              passwordTooShort
                ? 'mt-1.5 text-[13px] text-risk-high'
                : 'mt-1.5 text-[13px] text-ink-muted'
            }
          >
            Au moins 10 caractères — mélangez lettres, chiffres et symboles.
          </p>
        </div>
      </div>

      <Button type="submit" size="lg" className="group w-full" isLoading={isLoading}>
        Créer mon espace
        {!isLoading && (
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        )}
      </Button>

      <p className="text-center text-sm text-ink-muted">
        Vous avez déjà un compte ?{' '}
        <Link to={ROUTES.login} className="font-medium text-brand-600 hover:underline">
          Se connecter
        </Link>
      </p>
    </form>
  )
}

