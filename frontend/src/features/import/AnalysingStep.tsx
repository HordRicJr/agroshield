import { motion } from 'motion/react'
import { FileSpreadsheet } from 'lucide-react'

export function AnalysingStep({
  fileName,
  progress,
}: {
  fileName: string
  progress: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.28 }}
      className="rounded-2xl border border-line bg-surface px-6 py-12 text-center shadow-card sm:py-16"
    >
      <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-ai-50 text-ai-900">
        <FileSpreadsheet className="size-7" aria-hidden />
      </span>

      <h2 className="mt-5 font-display text-xl font-semibold">
        Analyse de votre fichier en cours…
      </h2>
      <p className="mx-auto mt-1.5 max-w-sm truncate text-sm text-ink-muted">
        {fileName}
      </p>

      <div
        className="mx-auto mt-7 h-2 max-w-sm overflow-hidden rounded-full bg-canvas"
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progression de l’analyse"
      >
        <motion.div
          className="h-full rounded-full bg-brand-600"
          animate={{ width: `${progress}%` }}
          transition={{ ease: 'linear', duration: 0.3 }}
        />
      </div>

      <p className="mt-3 text-[13px] text-ink-disabled">
        Cela prend quelques secondes. Ne fermez pas cette page.
      </p>
    </motion.div>
  )
}
