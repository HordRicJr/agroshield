import { motion } from 'motion/react'
import { ChevronRight, Tractor, Wheat } from 'lucide-react'
import type { FarmView, ProducerView } from './producers-data'

export function ProducerCard({
  producer,
  farms,
  index,
  onSelect,
}: {
  producer: ProducerView
  farms: FarmView[]
  index: number
  onSelect: () => void
}) {
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, delay: Math.min(index, 8) * 0.05 }}
      className="flex w-full items-center gap-3.5 rounded-2xl border border-line bg-surface p-4 text-left shadow-card transition-colors hover:border-brand-600"
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
        <Wheat className="size-5" aria-hidden />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block font-display text-[17px] font-semibold leading-tight">
          {producer.displayName}
        </span>
        <span className="mt-1 flex items-center gap-1.5 text-[13px] text-ink-muted">
          <Tractor className="size-3.5 shrink-0 text-ink-disabled" aria-hidden />
          {farms.length === 0
            ? 'Aucune exploitation enregistrée'
            : farms.length === 1
              ? farms[0].name
              : `${farms.length} exploitations`}
          <span aria-hidden>·</span>
          <span className="tabular-nums">{producer.code}</span>
        </span>
      </span>

      <ChevronRight className="size-5 shrink-0 text-ink-disabled" aria-hidden />
    </motion.button>
  )
}

