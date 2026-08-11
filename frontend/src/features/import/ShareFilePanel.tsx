import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Check, Copy, Link2, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { createShare, publicShareUrl } from '@/features/organization/organization-data'

/**
 * Partage sélectif d'un fichier importé : le partenaire ne reçoit qu'un lien
 * temporaire donnant accès aux métadonnées + colonnes cochées — jamais le
 * fichier complet.
 */
export function ShareFilePanel({ fileId, columns }: { fileId: string; columns: string[] }) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const [copied, setCopied] = useState(false)

  const mutation = useMutation({
    mutationFn: () =>
      createShare({
        fileId,
        label: 'Partenaire externe',
        allowedColumns: selected,
        ttlMinutes: 60,
      }),
  })

  function toggle(name: string) {
    setSelected((current) =>
      current.includes(name) ? current.filter((c) => c !== name) : [...current, name],
    )
  }

  if (!open) {
    return (
      <Button
        variant="secondary"
        size="lg"
        className="mt-3 w-full"
        onClick={() => setOpen(true)}
      >
        <Share2 className="size-4" aria-hidden />
        Partager ce fichier avec un partenaire
      </Button>
    )
  }

  if (mutation.data) {
    const url = publicShareUrl(mutation.data.publicPath)
    return (
      <div className="mt-3 rounded-2xl border border-brand-600/25 bg-brand-50 p-4 text-left">
        <p className="text-sm font-medium text-brand-900">Lien de partage créé</p>
        <p className="mt-1 text-[13px] leading-relaxed text-brand-900/70">
          {mutation.data.note}
        </p>
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-line bg-surface p-2.5">
          <code className="min-w-0 flex-1 truncate text-[12px]">{url}</code>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(url)
              setCopied(true)
            }}
            className="shrink-0 rounded-lg p-1.5 text-ink-muted hover:bg-canvas"
            aria-label="Copier le lien"
          >
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          </button>
        </div>
        <p className="mt-2 text-[12px] text-ink-disabled">
          Colonnes visibles : {selected.length ? selected.join(', ') : 'aucune (métadonnées seules)'}
          {' — expire dans 1h, révocable à tout moment depuis « Mon organisation ».'}
        </p>
      </div>
    )
  }

  return (
    <div className="mt-3 rounded-2xl border border-line bg-surface p-4 text-left shadow-card">
      <p className="text-sm font-medium">Quelles colonnes le partenaire peut-il voir ?</p>
      <p className="mt-1 text-[13px] text-ink-muted">
        Le reste du fichier ne lui sera jamais accessible.
      </p>
      <ul className="mt-2.5 space-y-1.5">
        {columns.map((name) => (
          <li key={name}>
            <label className="flex items-center gap-2.5 text-sm">
              <input
                type="checkbox"
                checked={selected.includes(name)}
                onChange={() => toggle(name)}
                className="size-4 rounded border-line accent-brand-900"
              />
              {name}
            </label>
          </li>
        ))}
      </ul>
      {mutation.isError && (
        <p className="mt-2 text-[13px] text-risk-critical">
          Le lien n’a pas pu être créé. Réessayez.
        </p>
      )}
      <div className="mt-3 flex gap-2">
        <Button size="sm" onClick={() => mutation.mutate()} isLoading={mutation.isPending}>
          <Link2 className="size-4" aria-hidden />
          Créer le lien
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Annuler
        </Button>
      </div>
    </div>
  )
}
