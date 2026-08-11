import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/common/Skeleton'

export function DashboardSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-live="polite">
      <span className="sr-only">Chargement de votre tableau de bord…</span>

      <Card className="p-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
          <Skeleton className="size-16 rounded-2xl" />
          <div className="w-full space-y-2.5">
            <Skeleton className="h-6 w-64 max-w-full" />
            <Skeleton className="h-4 w-full max-w-md" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-8">
          <Skeleton className="h-[100px] w-[190px] shrink-0 rounded-t-full" />
          <div className="w-full space-y-2.5">
            <Skeleton className="h-6 w-72 max-w-full" />
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-4 w-full max-w-sm" />
            <Skeleton className="h-4 w-3/4 max-w-sm" />
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <Skeleton className="mb-5 h-4 w-44" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3">
              <Skeleton className="size-2 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
