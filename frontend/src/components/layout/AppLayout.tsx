import { Suspense } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { useAuth } from '@/hooks/useAuth'
import { useSidebar } from '@/hooks/useSidebar'
import { Skeleton } from '@/components/common/Skeleton'
import { ConnectionBanner } from '@/components/common/ConnectionBanner'
import { cn } from '@/lib/utils'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function AppLayout() {
  const { user } = useAuth()
  const { isCollapsed } = useSidebar()
  const location = useLocation()

  if (!user) return null

  return (
    <div
      className={cn(
        'min-h-dvh transition-[padding] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]',
        isCollapsed ? 'lg:pl-[76px]' : 'lg:pl-[272px]',
      )}
    >
      <ConnectionBanner />
      <Sidebar user={user} />
      <Topbar />
      <main className="mx-auto w-full max-w-[1400px] px-4 py-6 lg:px-7 lg:py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22 }}
          >
            <Suspense
              fallback={
                <div className="space-y-4">
                  <Skeleton className="h-8 w-56" />
                  <Skeleton className="h-4 w-80" />
                  <Skeleton className="h-64 w-full rounded-2xl" />
                </div>
              }
            >
              <Outlet />
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
