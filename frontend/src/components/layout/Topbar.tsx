import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { useQuery } from '@tanstack/react-query'
import {
  Bell,
  Building2,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  UserRound,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useSidebar } from '@/hooks/useSidebar'
import { NAV_SECTIONS } from '@/config/navigation'
import { ROUTES } from '@/config/routes'
import { fetchAlerts } from '@/features/alerts/alerts-data'

export function Topbar() {
  const { user, logout, hasPermission } = useAuth()
  const { openMobile, isCollapsed, toggleCollapsed } = useSidebar()
  const { pathname } = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const canSeeAlerts = hasPermission('SECURITY_VIEW') || hasPermission('SECURITY_MANAGE')

  const alertsQuery = useQuery({
    queryKey: ['alerts'],
    queryFn: fetchAlerts,
    enabled: canSeeAlerts,
    refetchInterval: 60_000,
  })
  const openAlerts = (alertsQuery.data ?? []).filter((alert) => alert.status !== 'done').length

  const trail = (() => {
    for (const section of NAV_SECTIONS) {
      const match = section.items.find((item) => pathname.startsWith(item.to))
      if (match) return [section.title, match.label]
    }
    return ['Compte', 'Mon espace']
  })()

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-canvas/85 px-4 backdrop-blur-md lg:px-7">
      <button
        type="button"
        onClick={openMobile}
        aria-label="Ouvrir le menu"
        className="rounded-lg p-2 text-ink-muted transition-colors hover:bg-surface hover:text-brand-900 lg:hidden"
      >
        <Menu className="size-5" />
      </button>

      <button
        type="button"
        onClick={toggleCollapsed}
        aria-label={isCollapsed ? 'Déplier le menu' : 'Replier le menu'}
        aria-expanded={!isCollapsed}
        className="hidden rounded-lg p-2 text-ink-muted transition-colors hover:bg-surface hover:text-brand-900 lg:block"
      >
        {isCollapsed ? (
          <PanelLeftOpen className="size-4.75" />
        ) : (
          <PanelLeftClose className="size-4.75" />
        )}
      </button>

      <span className="hidden h-5 w-px bg-line lg:block" aria-hidden />

      <nav aria-label="Fil d'Ariane" className="hidden min-w-0 items-center gap-2 text-sm sm:flex">
        <span className="shrink-0 text-ink-muted">{trail[0]}</span>
        <span className="text-ink-disabled">/</span>
        <span className="truncate font-medium">{trail[1]}</span>
      </nav>

      <span className="hidden shrink-0 items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-[13px] font-medium text-brand-900 xl:flex">
        <Building2 className="size-3.5" aria-hidden />
        {user?.organizationName}
      </span>

      <div className="ml-auto flex items-center gap-2">
        <label className="hidden items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 md:flex">
          <Search className="size-4 text-ink-disabled" aria-hidden />
          <input
            type="search"
            placeholder="Rechercher un producteur, un événement…"
            className="w-56 bg-transparent text-sm outline-none placeholder:text-ink-disabled lg:w-72"
          />
          <kbd className="rounded border border-line px-1.5 text-[11px] text-ink-disabled">
            /
          </kbd>
        </label>

        {canSeeAlerts && (
          <Link
            to={ROUTES.alerts}
            aria-label={
              openAlerts > 0
                ? `${openAlerts} alerte${openAlerts > 1 ? 's' : ''} en attente`
                : 'Aucune alerte en attente'
            }
            className="relative rounded-xl border border-line bg-surface p-2.5 text-ink-muted transition-colors hover:text-brand-900"
          >
            <Bell className="size-4.5" />
            {openAlerts > 0 && (
              <span className="absolute -right-1 -top-1 grid min-w-4.5 place-items-center rounded-full bg-risk-high px-1 text-[10px] font-semibold leading-4.5 text-white">
                {Math.min(openAlerts, 99)}
              </span>
            )}
          </Link>
        )}

        <div className="relative">
          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-haspopup="menu"
            aria-expanded={isMenuOpen}
            className="flex items-center gap-2 rounded-xl border border-line bg-surface p-1.5 pr-2.5 transition-colors hover:bg-brand-50"
          >
            <span className="grid size-8 place-items-center rounded-lg bg-brand-900 font-display text-sm font-bold text-white">
              {user?.fullName.slice(0, 1)}
            </span>
            <span className="hidden text-sm font-medium sm:block">
              {user?.fullName.split(' ')[0]}
            </span>
          </button>

          <AnimatePresence>
            {isMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsMenuOpen(false)}
                  aria-hidden
                />
                <motion.div
                  role="menu"
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 z-20 mt-2 w-60 overflow-hidden rounded-2xl border border-line bg-surface shadow-card"
                >
                  <div className="border-b border-line px-4 py-3">
                    <p className="text-sm font-medium">{user?.fullName}</p>
                    <p className="truncate text-[13px] text-ink-muted">
                      {user?.organizationName}
                    </p>
                  </div>
                  <div className="p-1.5">
                    <Link
                      to={ROUTES.profile}
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-ink-muted hover:bg-canvas hover:text-ink"
                    >
                      <UserRound className="size-4" aria-hidden />
                      Mon profil
                    </Link>
                    <Link
                      to={ROUTES.securitySettings}
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-ink-muted hover:bg-canvas hover:text-ink"
                    >
                      <Settings className="size-4" aria-hidden />
                      Sécurité du compte
                    </Link>
                    <button
                      type="button"
                      onClick={logout}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-risk-critical hover:bg-risk-critical/8"
                    >
                      <LogOut className="size-4" aria-hidden />
                      Se déconnecter
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}
