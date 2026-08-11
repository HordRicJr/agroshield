import { cn } from '@/lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-label="Chargement en cours"
      className={cn('animate-pulse rounded-lg bg-line/70', className)}
    />
  )
}
