import { RiskBadge } from '@/components/ui/RiskBadge'
import { CATEGORY_LABELS, CATEGORY_ORDER } from './import-data'
import type { CategoryId, ColumnResult } from './import-data'

const SENSITIVITY_LABEL = {
  low: 'Peu sensible',
  medium: 'Sensible',
  high: 'Très sensible',
  critical: 'Très sensible',
} as const

export function ColumnDetail({
  columns,
  canCorrect,
  onCorrect,
}: {
  columns: ColumnResult[]
  canCorrect: boolean
  onCorrect: (name: string, category: CategoryId) => void
}) {
  return (
    <div className="border-t border-line">
      <ul className="divide-y divide-line">
        {columns.map((column) => (
          <li
            key={column.name}
            className="flex flex-wrap items-center gap-x-3 gap-y-2 px-5 py-3"
          >
            <span className="min-w-0 flex-1 truncate text-sm">
              {column.name}
            </span>

            {canCorrect ? (
              <label className="shrink-0">
                <span className="sr-only">
                  Catégorie de la colonne {column.name}
                </span>
                <select
                  value={column.category}
                  onChange={(event) =>
                    onCorrect(column.name, event.target.value as CategoryId)
                  }
                  className="max-w-[190px] rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[13px] text-ink-muted outline-none transition-colors hover:border-brand-600 focus:border-brand-600 focus:text-ink"
                >
                  {CATEGORY_ORDER.map((category) => (
                    <option key={category} value={category}>
                      {CATEGORY_LABELS[category]}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <span className="shrink-0 text-[13px] text-ink-muted">
                {CATEGORY_LABELS[column.category]}
              </span>
            )}

            <RiskBadge
              level={column.sensitivity}
              label={SENSITIVITY_LABEL[column.sensitivity]}
              className="shrink-0 normal-case tracking-normal"
            />
          </li>
        ))}
      </ul>

      {canCorrect && (
        <p className="border-t border-line px-5 py-3 text-[13px] text-ink-disabled">
          Vous pouvez changer une catégorie si elle vous semble incorrecte. Vos
          corrections seront enregistrées avec le fichier.
        </p>
      )}
    </div>
  )
}
