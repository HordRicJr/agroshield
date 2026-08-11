import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ROUTES } from '@/config/routes'
import { ApiError } from '@/lib/api'

function loginErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.isNetworkError) {
      return 'Le serveur ne répond pas. Vérifiez votre connexion et réessayez.'
    }
    if (error.status === 401 || error.status === 400) {
      return 'Email ou mot de passe incorrect.'
    }
    if (error.status === 429 || error.code === 'RATE_LIMITED') {
      return 'Trop de tentatives. Patientez quelques minutes avant de réessayer.'
    }
    return error.message
  }
  return 'Une erreur inattendue est survenue. Réessayez.'
}

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const from =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ??
    ROUTES.dashboard

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setIsLoading(true)
    try {
      await login(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(loginErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h1 className="font-display text-[28px] font-semibold leading-tight">
          Content de vous revoir
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          Connectez-vous pour accéder à l’espace de votre coopérative.
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
          label="Adresse email"
          type="email"
          autoComplete="email"
          placeholder="vous@cooperative.tg"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        <div>
          <div className="mb-1.5 flex items-baseline justify-between">
            <label htmlFor="password" className="text-sm font-medium">
              Mot de passe
            </label>
            <Link
              to={ROUTES.forgotPassword}
              className="text-[13px] font-medium text-brand-600 hover:underline"
            >
              Oublié ?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
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
        </div>

        <label className="flex items-center gap-2.5 text-sm text-ink-muted">
          <input
            type="checkbox"
            defaultChecked
            className="size-4 rounded border-line accent-brand-900"
          />
          Garder ma session ouverte sur cet appareil
        </label>
      </div>

      <Button type="submit" size="lg" className="group w-full" isLoading={isLoading}>
        Se connecter
        {!isLoading && (
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        )}
      </Button>

      <p className="text-center text-sm text-ink-muted">
        Première visite ?{' '}
        <Link to={ROUTES.register} className="font-medium text-brand-600 hover:underline">
          Créer le compte de votre coopérative
        </Link>
      </p>
    </form>
  )
}
