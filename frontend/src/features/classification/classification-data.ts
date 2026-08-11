import { api } from '@/lib/api'

/**
 * Classifications réelles chargées depuis l'API + correction manuelle
 * (« l'IA ne doit pas avoir le dernier mot » — la décision humaine prime).
 */

export type CategoryId = 'personnel' | 'agricole' | 'financier' | 'sensible'

export interface Field {
  id: string
  name: string
  example: string
  category: CategoryId
  /** Vrai quand l'IA hésite : le champ est proposé « à vérifier ». */
  uncertain: boolean
  /** Vrai quand un responsable a confirmé ou corrigé la catégorie. */
  reviewed: boolean
}

export interface Correction {
  field: string
  from: CategoryId
  to: CategoryId
  author: string
  date: string
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

export const CATEGORY_HELP: Record<CategoryId, string> = {
  personnel: 'Ce qui permet de reconnaître une personne',
  agricole: 'Parcelles, cultures et récoltes',
  financier: 'Paiements et montants',
  sensible: 'À ne montrer qu’aux personnes autorisées',
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

export interface ClassificationView {
  id: string
  fileId: string | null
  columnName: string
  classification: string
  riskLevel: string
  confidence: number | null
  method: string | null
  humanValidated: boolean
  createdAt: string
}

const API_TO_CATEGORY: Record<string, CategoryId> = {
  PERSONAL: 'personnel',
  PERSONAL_SENSITIVE: 'sensible',
  AGRICULTURAL: 'agricole',
  FINANCIAL: 'financier',
  FINANCIAL_SENSITIVE: 'sensible',
  LOCATION: 'sensible',
  UNKNOWN: 'agricole',
}

export const CATEGORY_TO_API: Record<CategoryId, string> = {
  personnel: 'PERSONAL',
  agricole: 'AGRICULTURAL',
  financier: 'FINANCIAL',
  sensible: 'PERSONAL_SENSITIVE',
}

export function toField(view: ClassificationView): Field {
  const confidence = view.confidence ?? 0
  return {
    id: view.id,
    name: view.columnName,
    example:
      view.method === 'HUMAN'
        ? 'catégorie confirmée à la main'
        : `confiance de l’analyse : ${Math.round(confidence * 100)} %`,
    category: API_TO_CATEGORY[view.classification] ?? 'agricole',
    uncertain: !view.humanValidated && confidence < 0.7,
    reviewed: view.humanValidated,
  }
}

export function fetchClassifications(): Promise<ClassificationView[]> {
  return api.get<ClassificationView[]>('/data/classifications')
}

export function reclassify(id: string, category: CategoryId) {
  return api.patch<ClassificationView>(`/data/classifications/${id}`, {
    classification: CATEGORY_TO_API[category],
  })
}

// ---------------------------------------------------------------------------
// Utilitaires
// ---------------------------------------------------------------------------

export function countIn(fields: Field[], category: CategoryId) {
  return fields.filter((field) => field.category === category).length
}

export function countUncertain(fields: Field[], category: CategoryId) {
  return fields.filter(
    (field) => field.category === category && field.uncertain && !field.reviewed,
  ).length
}

export function formatNumber(value: number) {
  return value.toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, ' ')
}
