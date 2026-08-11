import { useRef } from 'react'
import { motion } from 'motion/react'
import { AlertCircle, ImagePlus, Link2, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { EXAMPLES } from './fraud-analysis'

export function SubmitStep({
  text,
  tooShort,
  attachment,
  onTextChange,
  onAttach,
  onSubmit,
}: {
  text: string
  tooShort: boolean
  attachment: File | null
  onTextChange: (value: string) => void
  onAttach: (file: File | null) => void
  onSubmit: () => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.28 }}
      className="space-y-4"
    >
      <div className="rounded-2xl border border-line bg-surface p-4 shadow-card sm:p-5">
        <label htmlFor="message" className="sr-only">
          Message à vérifier
        </label>
        <textarea
          id="message"
          value={text}
          onChange={(event) => onTextChange(event.target.value)}
          rows={7}
          placeholder="Collez ici le message reçu par SMS, WhatsApp ou email…"
          className="w-full resize-none rounded-xl border border-line bg-canvas p-4 text-[15px] leading-relaxed outline-none transition-colors placeholder:text-ink-disabled focus:border-brand-600 focus:bg-surface"
        />

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-[13px] text-ink-muted transition-colors hover:border-brand-600 hover:text-brand-900"
          >
            <ImagePlus className="size-3.5" aria-hidden />
            Joindre une capture d’écran
          </button>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-[13px] text-ink-disabled">
            <Link2 className="size-3.5" aria-hidden />
            Un lien seul fonctionne aussi
          </span>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(event) => {
            onAttach(event.target.files?.[0] ?? null)
            event.target.value = ''
          }}
        />

        {attachment && (
          <p className="mt-2.5 flex items-center gap-2 text-[13px] text-ink-muted">
            <span className="truncate">Capture jointe : {attachment.name}</span>
            <button
              type="button"
              onClick={() => onAttach(null)}
              className="shrink-0 font-medium text-brand-900 hover:underline"
            >
              Retirer
            </button>
          </p>
        )}

        <Button size="lg" onClick={onSubmit} className="mt-4 w-full">
          Analyser
        </Button>
      </div>

      {tooShort && (
        <motion.p
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-risk-medium/40 bg-risk-medium/8 p-3.5 text-sm"
        >
          <AlertCircle
            className="mt-0.5 size-4 shrink-0 text-risk-high"
            aria-hidden
          />
          Le message est trop court pour être analysé. Recopiez-le en entier,
          avec le lien s’il y en a un.
        </motion.p>
      )}

      <div>
        <p className="mb-2 text-[13px] text-ink-muted">
          Pas de message sous la main ? Essayez un exemple :
        </p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((example) => (
            <button
              key={example.label}
              type="button"
              onClick={() => onTextChange(example.text)}
              className="rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] text-ink-muted transition-colors hover:border-brand-600 hover:text-brand-900"
            >
              {example.label}
            </button>
          ))}
        </div>
      </div>

      <p className="flex items-center justify-center gap-2 pt-1 text-[13px] text-ink-muted">
        <ShieldCheck className="size-4 shrink-0 text-brand-600" aria-hidden />
        Le message reste sur votre appareil, il n’est envoyé à personne
      </p>
    </motion.div>
  )
}
