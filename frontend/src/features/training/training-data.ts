import { api } from '@/lib/api'
import type {
  CompleteModuleRequest,
  TrainingModuleView,
  TrainingResultView,
} from '@/types/api'

/**
 * Modules de sensibilisation (CyberÉducation) chargés depuis l'API
 * (`GET /training/modules`, `POST /training/modules/{id}/complete`,
 * `GET /training/results/me`).
 */

export function fetchModules(): Promise<TrainingModuleView[]> {
  return api.get<TrainingModuleView[]>('/training/modules')
}

export function fetchMyResults(): Promise<TrainingResultView[]> {
  return api.get<TrainingResultView[]>('/training/results/me')
}

export function completeModule(
  moduleId: string,
  request: CompleteModuleRequest = {},
): Promise<TrainingResultView> {
  return api.post<TrainingResultView>(`/training/modules/${moduleId}/complete`, request)
}

// ---------------------------------------------------------------------------
// Contenu pédagogique — les modules de démonstration n'ont pas de lien
// externe (`contentUrl`) : le contenu court est affiché directement dans
// l'application pour que la lecture fonctionne sans dépendance externe.
// ---------------------------------------------------------------------------

const CONTENT_BY_CODE: Record<string, string[]> = {
  'PHISHING-101': [
    'Un message qui crée l’urgence (« votre compte sera bloqué dans 10 minutes ») cherche à vous empêcher de réfléchir. Prenez toujours le temps de vérifier.',
    'Aucun service sérieux ne vous demandera votre mot de passe ou votre code de vérification par SMS, WhatsApp ou email.',
    'En cas de doute sur un lien, ne cliquez pas : contactez la personne ou l’organisation par un autre moyen que celui utilisé pour vous contacter.',
  ],
  'MDP-101': [
    'Utilisez un mot de passe différent pour chaque service important — surtout pour votre messagerie et vos comptes financiers.',
    'Un mot de passe long (12 caractères ou plus) est plus sûr qu’un mot de passe complexe mais court.',
    'Ne partagez jamais votre mot de passe, même avec un collègue ou un « responsable informatique » qui vous le demande par téléphone.',
  ],
  'DONNEES-101': [
    'Les données financières (montants, numéros mobile money) et personnelles (téléphone, email) doivent être partagées avec parcimonie, uniquement à ceux qui en ont réellement besoin.',
    'Avant de partager un fichier avec un partenaire, demandez-vous : a-t-il besoin de voir toutes les colonnes, ou seulement certaines ?',
    'Signalez tout accès ou toute demande de données qui vous semble inhabituelle au responsable sécurité de votre coopérative.',
  ],
  'PARTAGE-101': [
    'Un partage sécurisé ne donne accès qu’aux colonnes choisies — jamais au fichier complet.',
    'Chaque lien de partage a une durée de vie limitée et peut être arrêté à tout moment.',
    'Avant de créer un lien de partage, vérifiez que vous transmettez bien à la bonne personne, pour la bonne raison.',
  ],
}

const DEFAULT_CONTENT = [
  'Ce module de sensibilisation vous aide à reconnaître les risques courants et à protéger les données de votre coopérative au quotidien.',
]

export function moduleContent(module: TrainingModuleView): string[] {
  return CONTENT_BY_CODE[module.code] ?? DEFAULT_CONTENT
}

export function isCompleted(moduleId: string, results: TrainingResultView[]): boolean {
  return results.some((result) => result.moduleId === moduleId)
}

export function completionFor(
  moduleId: string,
  results: TrainingResultView[],
): TrainingResultView | undefined {
  return results.find((result) => result.moduleId === moduleId)
}
