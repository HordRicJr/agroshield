import { NavLink } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { Sprout, X } from 'lucide-react'
import { getNavigationForUser } from '@/config/navigation'
import { useSidebar } from '@/hooks/useSidebar'
import { cn } from '@/lib/utils'
import type { User } from '@/types'

export function Sidebar({ user }: { user: User }) {
  const { isCollapsed, isMobileOpen, closeMobile } = useSidebar()
  const sections = getNavigationForUser(user)

  return (
    <>
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeMobile}
            className="fixed inset-0 z-30 bg-ink/50 backdrop-blur-[2px] lg:hidden"
            aria-hidden
          />
        )}
      </AnimatePresence>

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex flex-col bg-brand-900 text-white',
          'transition-[width,transform] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]',
          'lg:translate-x-0',
          isCollapsed ? 'w-19' : 'w-68',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(120% 80% at 0% 0%, #1c6b3c 0%, transparent 55%), radial-gradient(100% 60% at 100% 100%, #0a2f19 0%, transparent 60%)',
          }}
          aria-hidden
        />

        <div className="relative flex h-16 shrink-0 items-center gap-2.5 px-4.5">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/12 ring-1 ring-white/15">
            <Sprout className="size-5 text-white" aria-hidden />
          </span>
          <AnimatePresence initial={false}>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.15 }}
                className="whitespace-nowrap font-display text-[17px] font-bold tracking-tight"
              >
                AgroShield<span className="text-white/55">.io</span>
              </motion.span>
            )}
          </AnimatePresence>

          <button
            type="button"
            onClick={closeMobile}
            aria-label="Fermer le menu"
            className="ml-auto rounded-lg p-1.5 text-white/70 hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav
          className={cn(
            'relative flex-1 overflow-y-auto overflow-x-hidden py-2 pb-5',
            isCollapsed ? 'scrollbar-rail px-3' : 'scrollbar-sidebar pl-3 pr-1',
          )}
        >
          {sections.map((section) => (
            <div key={section.title} className="mb-4">
              <p
                className={cn(
                  'h-4 px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35',
                  'transition-opacity duration-200',
                  isCollapsed && 'opacity-0',
                )}
              >
                {section.title}
              </p>
              <ul className="space-y-1">
                {section.items.map((item) => (
                  <li key={item.to} className="relative">
                    <NavLink
                      to={item.to}
                      onClick={closeMobile}
                      title={isCollapsed ? item.label : undefined}
                      className={({ isActive }) =>
                        cn(
                          'relative flex h-11 items-center gap-3 rounded-xl px-3 text-sm transition-colors',
                          isCollapsed && 'justify-center px-0',
                          isActive
                            ? 'bg-white/14 font-medium text-white'
                            : 'text-white/65 hover:bg-white/8 hover:text-white',
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <motion.span
                              layoutId="nav-rail"
                              className="absolute left-0 top-1/2 h-6 w-0.75 -translate-y-1/2 rounded-r-full bg-white"
                              transition={{ duration: 0.25 }}
                            />
                          )}
                          <item.icon className="size-4.75 shrink-0" aria-hidden />
                          {!isCollapsed && (
                            <span className="truncate">{item.label}</span>
                          )}
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  )
}
