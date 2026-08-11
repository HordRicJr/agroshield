export const ROUTES = {
  login: '/connexion',
  register: '/inscription',
  mfa: '/connexion/verification',
  forgotPassword: '/mot-de-passe-oublie',

  dashboard: '/tableau-de-bord',
  import: '/donnees/import',
  classification: '/donnees/classification',
  producers: '/donnees/producteurs',
  auditLogs: '/securite/journal',
  alerts: '/securite/alertes',
  fraudGuard: '/securite/verification-message',
  training: '/securite/formation',
  users: '/organisation/utilisateurs',
  organization: '/organisation',
  profile: '/compte/profil',
  securitySettings: '/compte/securite',

  forbidden: '/acces-refuse',
} as const

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES]
