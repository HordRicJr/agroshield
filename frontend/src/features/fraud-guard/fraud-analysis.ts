/**
 * Analyse d'un message suspect via l'API AgroShield (AI Fraud Guard).
 * L'IA conseille, la plateforme décide — on affiche la décision plateforme.
 * Formulation toujours estimative : jamais d'affirmation.
 */

import { api } from '@/lib/api'
import type { AnalyzeImageResult, AnalyzeMessageResult, Channel } from '@/types/api'

export type Level = 'low' | 'medium' | 'high'

export type SignalIcon =
  | 'urgency'
  | 'money'
  | 'beneficiary'
  | 'link'
  | 'secret'
  | 'unknown'

export interface Signal {
  icon: SignalIcon
  label: string
  detail: string
  weight: number
}

export interface Analysis {
  level: Level
  score: number
  signals: Signal[]
  recommendation: string
  /** Analyse simplifiée : l'IA était indisponible, règles locales utilisées. */
  degraded: boolean
  /** Texte lu automatiquement dans une capture d'écran jointe, le cas échéant. */
  extractedText?: string
}

/** Formulation toujours estimative : jamais d'affirmation. */
export const HEADLINES: Record<Level, string> = {
  low: 'Ce message semble normal',
  medium: 'Ce message mérite votre attention',
  high: 'Risque élevé détecté',
}

export const SUBHEADS: Record<Level, string> = {
  low: 'Nous n’avons repéré aucun signe d’arnaque connu.',
  medium: 'Quelques éléments sortent de l’ordinaire, sans certitude.',
  high: 'Plusieurs éléments ressemblent fortement à une tentative d’arnaque.',
}

export const EXAMPLES = [
  {
    label: 'Faux message de subvention',
    text: 'URGENT: votre subvention agricole de 250 000 FCFA est en attente. Confirmez votre code marchand sur http://subvention-agri-tg.co/verif avant 18h sinon annulation.',
  },
  {
    label: 'Changement de compte',
    text: 'Bonjour, ici la coopérative. Notre compte a changé, merci d’envoyer le paiement de la récolte sur le nouveau numéro 92 45 11 08 aujourd’hui.',
  },
  {
    label: 'Message normal',
    text: 'Bonjour Yao, la réunion de la coopérative est déplacée à jeudi 10h à la maison des producteurs. Merci de confirmer ta présence.',
  },
]

const SIGNAL_META: Record<string, { icon: SignalIcon; detail: string }> = {
  URGENCY: {
    icon: 'urgency',
    detail:
      'Un délai très court sert souvent à empêcher de prendre le temps de vérifier.',
  },
  PRESSURE: {
    icon: 'urgency',
    detail: 'Le message insiste pour vous faire agir sans réfléchir.',
  },
  FINANCIAL_REQUEST: {
    icon: 'money',
    detail:
      'Le message parle d’une somme à envoyer ou à recevoir sans démarche de votre part.',
  },
  BENEFICIARY_CHANGE: {
    icon: 'beneficiary',
    detail:
      'On vous demande de payer sur un compte différent de celui utilisé d’habitude.',
  },
  CREDENTIAL_HARVEST: {
    icon: 'secret',
    detail:
      'Aucun service sérieux ne demande votre code ou votre mot de passe par message.',
  },
  SUSPICIOUS_URL: {
    icon: 'link',
    detail:
      'L’adresse indiquée ne correspond à aucun service connu de votre coopérative.',
  },
  IMPERSONATION: {
    icon: 'unknown',
    detail: 'L’expéditeur se fait peut-être passer pour quelqu’un que vous connaissez.',
  },
}

function toLevel(riskLevel: string): Level {
  switch (riskLevel) {
    case 'CRITICAL':
    case 'HIGH':
      return 'high'
    case 'MEDIUM':
      return 'medium'
    default:
      return 'low'
  }
}

function toAnalysis(result: AnalyzeMessageResult): Analysis {
  const level = toLevel(result.riskLevel)
  const signals: Signal[] = result.signals.map((signal) => {
    const meta = SIGNAL_META[signal.type] ?? {
      icon: 'unknown' as SignalIcon,
      detail: '',
    }
    return {
      icon: meta.icon,
      label: signal.label,
      detail: meta.detail,
      weight: signal.weight,
    }
  })

  const fallbackAdvice: Record<Level, string> = {
    low: 'Vous pouvez répondre normalement. Restez tout de même prudent si vous ne connaissez pas l’expéditeur.',
    medium:
      'Ne cliquez sur aucun lien et n’envoyez pas d’argent avant d’avoir appelé la personne concernée sur son numéro habituel.',
    high: 'Ne payez pas avant d’avoir vérifié ce bénéficiaire par un autre moyen (appel, visite). Si vous avez déjà répondu, prévenez votre responsable.',
  }

  return {
    level,
    score: result.score,
    signals,
    recommendation: result.aiRecommendation || fallbackAdvice[level],
    degraded: result.degraded,
  }
}

function detectChannel(text: string): Channel {
  if (/objet\s*:|@.+\..+/i.test(text)) return 'EMAIL'
  return 'SMS'
}

export async function analyse(text: string): Promise<Analysis> {
  const result = await api.post<AnalyzeMessageResult>(
    '/security/analyze-message',
    {
      content: text,
      channel: detectChannel(text),
      language: 'fr',
    },
  )
  return toAnalysis(result)
}

/** Capture d'écran jointe : lecture du texte (OCR) puis même analyse que le texte saisi. */
export async function analyseImage(file: File, additionalText: string): Promise<Analysis> {
  const form = new FormData()
  form.append('file', file)
  if (additionalText.trim()) {
    form.append('additionalText', additionalText.trim())
  }
  form.append('channel', detectChannel(additionalText || file.name))
  form.append('language', 'fr')

  const result = await api.post<AnalyzeImageResult>('/security/analyze-image', form)
  return {
    ...toAnalysis(result.analysis),
    extractedText: result.extractedText,
  }
}

export const MIN_LENGTH = 15
