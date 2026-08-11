import { api } from '@/lib/api'
import type { RiskLevel } from '@/types'
import type {
  AnalyzeFileResult,
  ColumnClassification,
  DataCategory,
  FileMetadataView,
} from '@/types/api'

/**
 * Analyse réelle d'un fichier importé : upload puis extraction des colonnes
 * et classification par l'IA (avec repli sur des règles locales si besoin).
 */

export type CategoryId = 'personnel' | 'agricole' | 'financier' | 'sensible'

export interface ColumnResult {
  /** Identifiant de la classification en base — pour la correction manuelle. */
  id: string | null
  name: string
  category: CategoryId
  /** Catégorie proposée par l'analyse, avant correction éventuelle. */
  originalCategory: CategoryId
  sensitivity: RiskLevel
}

export interface AnalysisResult {
  fileId: string
  fileName: string
  rows: number
  columns: ColumnResult[]
  /** Analyse simplifiée : IA indisponible, règles locales utilisées. */
  degraded: boolean
}

export const CATEGORY_ORDER: CategoryId[] = [
  'personnel',
  'agricole',
  'financier',
  'sensible',
]

export const CATEGORY_LABELS: Record<CategoryId, string> = {
  personnel: 'Informations personnelles',
  agricole: 'Données agricoles',
  financier: 'Données financières',
  sensible: 'Données sensibles',
}

/** Ce que la catégorie veut dire, en une phrase, sans vocabulaire technique. */
export const CATEGORY_HELP: Record<CategoryId, string> = {
  personnel: 'Ce qui permet de reconnaître une personne',
  agricole: 'Parcelles, cultures et récoltes',
  financier: 'Paiements et montants',
  sensible: 'À ne montrer qu’aux personnes autorisées',
}

// ---------------------------------------------------------------------------
// Mapping API ↔ UI
// ---------------------------------------------------------------------------

const API_TO_CATEGORY: Record<DataCategory, CategoryId> = {
  PERSONAL: 'personnel',
  PERSONAL_SENSITIVE: 'sensible',
  AGRICULTURAL: 'agricole',
  FINANCIAL: 'financier',
  FINANCIAL_SENSITIVE: 'sensible',
  LOCATION: 'sensible',
  UNKNOWN: 'agricole',
}

/** Catégorie UI → catégorie backend (pour les corrections manuelles). */
export const CATEGORY_TO_API: Record<CategoryId, DataCategory> = {
  personnel: 'PERSONAL',
  agricole: 'AGRICULTURAL',
  financier: 'FINANCIAL',
  sensible: 'PERSONAL_SENSITIVE',
}

function toSensitivity(level: string): RiskLevel {
  switch (level) {
    case 'CRITICAL':
      return 'critical'
    case 'HIGH':
      return 'high'
    case 'MEDIUM':
      return 'medium'
    default:
      return 'low'
  }
}

function toColumn(column: ColumnClassification): ColumnResult {
  const category = API_TO_CATEGORY[column.classification] ?? 'agricole'
  return {
    id: null,
    name: column.column,
    category,
    originalCategory: category,
    sensitivity: toSensitivity(column.risk_level),
  }
}

// ---------------------------------------------------------------------------
// Appels API
// ---------------------------------------------------------------------------

/** Upload du fichier puis analyse des colonnes (parsing + classification). */
export async function analyzeFile(file: File): Promise<AnalysisResult> {
  const form = new FormData()
  form.append('file', file)
  const uploaded = await api.post<FileMetadataView>('/files', form)

  const analyzed = await api.post<AnalyzeFileResult>(
    `/files/${uploaded.id}/analyze`,
  )

  // Récupère les identifiants des classifications persistées pour permettre
  // la correction manuelle (dernier import = premières lignes).
  let ids = new Map<string, string>()
  try {
    const stored = await api.get<
      { id: string; fileId: string | null; columnName: string }[]
    >('/data/classifications')
    ids = new Map(
      stored
        .filter((item) => item.fileId === uploaded.id)
        .map((item) => [item.columnName, item.id]),
    )
  } catch {
    // Non bloquant : la correction manuelle sera simplement désactivée.
  }

  return {
    fileId: analyzed.fileId,
    fileName: analyzed.fileName,
    rows: analyzed.rowCount,
    degraded: analyzed.classification.degraded,
    columns: analyzed.classification.results.map((column) => ({
      ...toColumn(column),
      id: ids.get(column.column) ?? null,
    })),
  }
}

/** Enregistre les corrections manuelles (la décision humaine prime). */
export async function saveCorrections(columns: ColumnResult[]): Promise<void> {
  const changed = columns.filter(
    (column) => column.id && column.category !== column.originalCategory,
  )
  await Promise.all(
    changed.map((column) =>
      api.patch(`/data/classifications/${column.id}`, {
        classification: CATEGORY_TO_API[column.category],
      }),
    ),
  )
}

// ---------------------------------------------------------------------------
// Utilitaires
// ---------------------------------------------------------------------------

export function countByCategory(columns: ColumnResult[]) {
  return CATEGORY_ORDER.reduce<Record<CategoryId, number>>(
    (totals, category) => ({
      ...totals,
      [category]: columns.filter((column) => column.category === category)
        .length,
    }),
    { personnel: 0, agricole: 0, financier: 0, sensible: 0 },
  )
}

export const ACCEPTED_EXTENSIONS = ['csv', 'xlsx']

export function extensionOf(fileName: string) {
  return fileName.split('.').pop()?.toLowerCase() ?? ''
}

export function formatNumber(value: number) {
  return value.toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, ' ')
}
