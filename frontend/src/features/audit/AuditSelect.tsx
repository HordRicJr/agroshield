import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Menu déroulant natif habillé : lisible, accessible, sans dépendance. */
export function AuditSelect({
  label,
  value,
  options,
  onChange,
  className,
}: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
  className?: string
}) {
  const isDefault = value === options[0]?.value

  return (
    <label className={cn('relative block min-w-0 flex-1', className)}>
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-disabled">
        {label}
      </span>

      <span className="relative block">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={cn(
            'w-full appearance-none rounded-xl border bg-surface py-2.5 pl-3.5 pr-9 text-sm outline-none transition-colors',
            'focus-visible:border-brand-600 focus-visible:ring-2 focus-visible:ring-brand-600/25',
            isDefault
              ? 'border-line text-ink'
              : 'border-brand-600 font-medium text-brand-900',
          )}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <ChevronDown
          className={cn(
            'pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2',
            isDefault ? 'text-ink-disabled' : 'text-brand-600',
          )}
          aria-hidden
        />
      </span>
    </label>
  )
}
