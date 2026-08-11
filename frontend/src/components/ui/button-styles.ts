import { cn } from '@/lib/utils'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-900 text-white hover:bg-brand-600 shadow-[0_1px_2px_rgb(20_83_45/0.3)]',
  secondary: 'bg-surface text-brand-900 border border-line hover:bg-brand-50',
  ghost: 'text-ink-muted hover:bg-brand-50 hover:text-brand-900',
  danger: 'bg-risk-critical text-white hover:brightness-110',
}

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm gap-1.5',
  md: 'h-11 px-4 gap-2',
  lg: 'h-12 px-6 text-base gap-2',
}

export function buttonStyles({
  variant = 'primary',
  size = 'md',
  className,
}: {
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
} = {}) {
  return cn(
    'inline-flex items-center justify-center rounded-xl font-medium transition-all',
    'disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.985]',
    VARIANTS[variant],
    SIZES[size],
    className,
  )
}
