import { useRef, useState, type DragEvent } from 'react'
import { motion } from 'motion/react'
import { AlertCircle, FileSpreadsheet, ShieldCheck, Upload } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

export type DropError = 'format' | 'empty' | null

const ERROR_TEXT: Record<'format' | 'empty', { title: string; help: string }> = {
  format: {
    title: 'Ce type de fichier ne peut pas être lu',
    help: 'Ouvrez votre fichier dans Excel, puis enregistrez-le au format Excel (.xlsx) ou CSV avant de réessayer.',
  },
  empty: {
    title: 'Ce fichier est vide ou impossible à ouvrir',
    help: 'Vérifiez qu’il contient bien des lignes, puis choisissez-le à nouveau.',
  },
}

export function DropStep({
  error,
  onFile,
}: {
  error: DropError
  onFile: (file: File) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isOver, setIsOver] = useState(false)

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsOver(false)
    const file = event.dataTransfer.files[0]
    if (file) onFile(file)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.28 }}
      className="space-y-4"
    >
      <div
        onDragOver={(event) => {
          event.preventDefault()
          setIsOver(true)
        }}
        onDragLeave={() => setIsOver(false)}
        onDrop={handleDrop}
        className={cn(
          'rounded-2xl border-2 border-dashed bg-surface px-6 py-12 text-center transition-colors sm:py-16',
          isOver
            ? 'border-brand-600 bg-brand-50'
            : error
              ? 'border-risk-medium/60'
              : 'border-line',
        )}
      >
        <span
          className={cn(
            'mx-auto grid size-16 place-items-center rounded-2xl transition-colors',
            isOver ? 'bg-brand-900 text-white' : 'bg-brand-50 text-brand-600',
          )}
        >
          <Upload className="size-7" aria-hidden />
        </span>

        <h2 className="mt-5 font-display text-xl font-semibold">
          Déposez votre fichier ici
        </h2>
        <p className="mx-auto mt-1.5 max-w-xs text-sm text-ink-muted">
          Fichiers Excel ou CSV
        </p>

        <Button
          size="lg"
          className="mt-6"
          onClick={() => inputRef.current?.click()}
        >
          <FileSpreadsheet className="size-4" aria-hidden />
          Choisir un fichier
        </Button>

        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xls,.xlsx"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) onFile(file)
            event.target.value = ''
          }}
        />
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-risk-medium/40 bg-risk-medium/8 p-4"
        >
          <AlertCircle
            className="mt-0.5 size-5 shrink-0 text-risk-high"
            aria-hidden
          />
          <div>
            <p className="text-sm font-medium">{ERROR_TEXT[error].title}</p>
            <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">
              {ERROR_TEXT[error].help}
            </p>
          </div>
        </motion.div>
      )}

      <p className="flex items-center justify-center gap-2 text-[13px] text-ink-muted">
        <ShieldCheck className="size-4 shrink-0 text-brand-600" aria-hidden />
        Vos données sont analysées et protégées automatiquement
      </p>
    </motion.div>
  )
}
