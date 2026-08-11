import { Outlet } from 'react-router-dom'
import { motion } from 'motion/react'
import { Sprout } from 'lucide-react'
import { AuthCarousel } from '@/features/auth/AuthCarousel'

export function AuthLayout() {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr] xl:grid-cols-[1.2fr_1fr]">
      <div className="relative hidden lg:block">
        <AuthCarousel />
        <span className="absolute left-10 top-9 z-10 flex items-center gap-2.5 xl:left-12">
          <span className="grid size-10 place-items-center rounded-xl bg-white/15 ring-1 ring-white/20 backdrop-blur">
            <Sprout className="size-5 text-white" aria-hidden />
          </span>
          <span className="font-display text-lg font-bold text-white">
            AgroShield<span className="text-white/60">.io</span>
          </span>
        </span>
      </div>

      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-14 xl:px-20">
        <span className="mb-10 flex items-center gap-2.5 lg:hidden">
          <span className="grid size-10 place-items-center rounded-xl bg-brand-900">
            <Sprout className="size-5 text-white" aria-hidden />
          </span>
          <span className="font-display text-lg font-bold text-brand-900">
            AgroShield<span className="text-brand-600">.io</span>
          </span>
        </span>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-[400px]"
        >
          <Outlet />
        </motion.div>

        <p className="mt-12 max-w-[400px] text-[13px] text-ink-disabled">
          © {new Date().getFullYear()} AgroShield.io — Vos identifiants ne sont
          jamais partagés avec un tiers.
        </p>
      </div>
    </div>
  )
}
