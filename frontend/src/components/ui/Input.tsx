import type { InputHTMLAttributes } from 'react'
import { useId } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
}

export function Input({
  label,
  hint,
  error,
  className,
  id,
  ...props
}: InputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-sm font-medium text-ink"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        className={cn(
          'h-11 w-full rounded-xl border border-line bg-surface px-3.5 text-ink',
          'placeholder:text-ink-disabled focus:border-brand-600 focus:outline-none',
          error && 'border-risk-critical',
          className,
        )}
        {...props}
      />
      {(error || hint) && (
        <p
          className={cn(
            'mt-1.5 text-[13px]',
            error ? 'text-risk-critical' : 'text-ink-muted',
          )}
        >
          {error ?? hint}
        </p>
      )}
    </div>
  )
}
