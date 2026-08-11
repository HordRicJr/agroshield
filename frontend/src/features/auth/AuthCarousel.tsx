import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { AUTH_SLIDES } from './auth-slides'
import { cn } from '@/lib/utils'

const INTERVAL_MS = 6000

export function AuthCarousel() {
  const [index, setIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    if (isPaused) return
    const timer = window.setInterval(
      () => setIndex((current) => (current + 1) % AUTH_SLIDES.length),
      INTERVAL_MS,
    )
    return () => window.clearInterval(timer)
  }, [isPaused])

  const slide = AUTH_SLIDES[index]

  return (
    <div
      className="relative h-full w-full overflow-hidden bg-brand-900"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <AnimatePresence initial={false}>
        <motion.img
          key={slide.src}
          src={slide.src}
          alt={slide.alt}
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ opacity: { duration: 0.9 }, scale: { duration: 7, ease: 'linear' } }}
          className="absolute inset-0 size-full object-cover"
        />
      </AnimatePresence>

      <div className="absolute inset-0 bg-gradient-to-t from-brand-900 via-brand-900/55 to-brand-900/15" />

      <div className="relative flex h-full flex-col justify-end p-10 xl:p-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="max-w-lg font-display text-[32px] font-semibold leading-[1.15] text-white xl:text-[38px]">
              {slide.title}
            </h2>
            <p className="mt-3 max-w-md text-[15px] leading-relaxed text-white/70">
              {slide.caption}
            </p>
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 flex items-center gap-2.5">
          {AUTH_SLIDES.map((item, slideIndex) => (
            <button
              key={item.src}
              type="button"
              onClick={() => setIndex(slideIndex)}
              aria-label={`Voir le visuel ${slideIndex + 1} sur ${AUTH_SLIDES.length}`}
              aria-current={slideIndex === index}
              className="group h-1.5 rounded-full bg-white/25 transition-all duration-500"
              style={{ width: slideIndex === index ? 44 : 16 }}
            >
              {slideIndex === index && (
                <motion.span
                  key={`${index}-${isPaused}`}
                  className="block h-full rounded-full bg-white"
                  initial={{ width: '0%' }}
                  animate={{ width: isPaused ? '35%' : '100%' }}
                  transition={{
                    duration: isPaused ? 0.3 : INTERVAL_MS / 1000,
                    ease: 'linear',
                  }}
                />
              )}
            </button>
          ))}
          <span
            className={cn(
              'ml-2 font-display text-xs tabular-nums text-white/45',
            )}
          >
            {String(index + 1).padStart(2, '0')} — {String(AUTH_SLIDES.length).padStart(2, '0')}
          </span>
        </div>
      </div>
    </div>
  )
}
