import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CloudOff, Wifi } from 'lucide-react'
import { NETWORK_DOWN_EVENT, NETWORK_UP_EVENT } from '@/lib/api'

type BannerState = 'hidden' | 'down' | 'restored'

/**
 * Bannière transverse : « connexion au serveur perdue » quand une requête
 * échoue au niveau réseau, puis confirmation brève quand ça répond à nouveau.
 */
export function ConnectionBanner() {
  const [state, setState] = useState<BannerState>('hidden')

  useEffect(() => {
    let timer: number | undefined

    const onDown = () => {
      window.clearTimeout(timer)
      setState('down')
    }
    const onUp = () => {
      setState((current) => {
        if (current !== 'down') return current
        timer = window.setTimeout(() => setState('hidden'), 3_000)
        return 'restored'
      })
    }
    const onOffline = () => onDown()

    window.addEventListener(NETWORK_DOWN_EVENT, onDown)
    window.addEventListener(NETWORK_UP_EVENT, onUp)
    window.addEventListener('offline', onOffline)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener(NETWORK_DOWN_EVENT, onDown)
      window.removeEventListener(NETWORK_UP_EVENT, onUp)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  return (
    <AnimatePresence>
      {state !== 'hidden' && (
        <motion.p
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.22 }}
          role="status"
          className={
            state === 'down'
              ? 'fixed inset-x-0 top-0 z-[70] flex items-center justify-center gap-2 bg-risk-critical px-4 py-2 text-center text-[13px] font-medium text-white'
              : 'fixed inset-x-0 top-0 z-[70] flex items-center justify-center gap-2 bg-brand-600 px-4 py-2 text-center text-[13px] font-medium text-white'
          }
        >
          {state === 'down' ? (
            <>
              <CloudOff className="size-4 shrink-0" aria-hidden />
              Connexion au serveur perdue. Vos actions seront possibles dès
              qu’elle sera rétablie.
            </>
          ) : (
            <>
              <Wifi className="size-4 shrink-0" aria-hidden />
              Connexion rétablie.
            </>
          )}
        </motion.p>
      )}
    </AnimatePresence>
  )
}

