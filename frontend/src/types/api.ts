/**
 * Types miroirs des DTO du backend Spring (`agroshield/backend`).
 *
 * Convention JSON côté backend :
 * - Enveloppe + DTOs applicatifs (auth, audit, risks, producers…) → camelCase
 * - DTOs venant du service IA (ColumnClassification, Signal…) → snake_case
 *   (annotés @JsonNaming(SnakeCaseStrategy) côté Java)
 */

// ---------------------------------------------------------------------------
// Enveloppe commune
// ---------------------------------------------------------------------------

export interface ApiMeta {
  requestId: string
}

export interface ApiErrorBody {
  code: string
  message: string
  details?: Record<string, unknown> | null
}

export interface ApiEnvelope<T> {
  success: boolean
  data: T | null
  error: ApiErrorBody | null
  meta: ApiMeta
}

// ---------------------------------------------------------------------------
// Enums partagés
// ---------------------------------------------------------------------------

export type ApiRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type RecommendedAction = 'MONITOR' | 'REVIEW' | 'ALERT' | 'BLOCK_RECOMMENDED'
export type Channel = 'SMS' | 'EMAIL' | 'WHATSAPP' | 'OTHER'
export type Language = 'fr' | 'en' | 'auto'

/** Rôles backend (majuscules, ≠ des rôles UI en minuscules). */
export type ApiRole =
  | 'PRODUCTEUR'
  | 'TECHNICIEN'
  | 'AGRONOME'
  | 'RESPONSABLE'
  | 'RESPONSABLE_SECURITE'
  | 'ADMIN'

export type Permission =
  | 'DATA_READ'
  | 'DATA_WRITE'
  | 'DATA_EXPORT'
  | 'DATA_DELETE'
  | 'DATA_SHARE'
  | 'USER_MANAGE'
  | 'SECURITY_VIEW'
  | 'SECURITY_MANAGE'
  | 'INCIDENT_MANAGE'
  | 'AUDIT_VIEW'

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export interface RegisterRequest {
  email: string
  password: string
  fullName: string
  organizationName: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface TokenResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
  userId: string
  organizationId: string
  email: string
  roles: ApiRole[]
  permissions: Permission[]
}

export interface MeResponse {
  userId: string
  email: string
  fullName: string
  organizationId: string
  roles: ApiRole[]
  permissions: Permission[]
}

// ---------------------------------------------------------------------------
// Gestion des utilisateurs (GET/POST/PATCH /users — permission USER_MANAGE)
// ---------------------------------------------------------------------------

export type MemberStatusApi = 'ACTIVE' | 'DISABLED'

export interface MemberView {
  userId: string
  email: string
  fullName: string
  roleCode: ApiRole
  status: MemberStatusApi
  mfaEnabled: boolean
  joinedAt: string
}

export interface InviteUserRequest {
  email: string
  fullName: string
  temporaryPassword: string
  roleCode: ApiRole
}

export interface UpdateMemberRequest {
  roleCode?: ApiRole
  status?: MemberStatusApi
}

// ---------------------------------------------------------------------------
// Classification (POST /data/classify) — payload IA en snake_case
// ---------------------------------------------------------------------------

export type DataCategory =
  | 'PERSONAL'
  | 'PERSONAL_SENSITIVE'
  | 'AGRICULTURAL'
  | 'FINANCIAL'
  | 'FINANCIAL_SENSITIVE'
  | 'LOCATION'
  | 'UNKNOWN'

export interface ColumnInput {
  name: string
  samples?: string[]
}

export interface ClassifyRequest {
  columns: ColumnInput[]
}

export interface RecommendedPolicy {
  encrypt_at_rest: boolean
  mask_by_default: boolean
}

export interface ColumnClassification {
  column: string
  classification: DataCategory
  confidence: number
  method: 'RULE' | 'ML' | string
  risk_level: ApiRiskLevel
  evidence: string[]
  recommended_policy: RecommendedPolicy
}

export interface ClassifyDataResult {
  results: ColumnClassification[]
  highestRiskLevel: ApiRiskLevel
  sensitiveColumns: number
  stub: boolean | null
  degraded: boolean
  predictionId: string
}

/** POST /files/{id}/analyze — parsing + classification d'un fichier importé. */
export interface AnalyzeFileResult {
  fileId: string
  fileName: string
  rowCount: number
  columnCount: number
  classification: ClassifyDataResult
}

// ---------------------------------------------------------------------------
// Fraud Guard (POST /security/analyze-message)
// ---------------------------------------------------------------------------

export interface AnalyzeMessageRequest {
  content: string
  channel: Channel
  language: Language
}

export interface FraudSignal {
  type: string
  weight: number
  label: string
}

export interface ModelCategory {
  label: string
  score: number
}

export interface AnalyzeMessageResult {
  aiRiskLevel: ApiRiskLevel
  aiScore: number
  signals: FraudSignal[]
  modelCategories: ModelCategory[]
  aiRecommendation: string
  confidence: number
  stub: boolean | null
  degraded: boolean
  predictionId: string
  riskLevel: ApiRiskLevel
  score: number
  recommendedAction: RecommendedAction
  explanation: string
  riskAssessmentId: string
  incidentId: string | null
  alertId: string | null
}

/** POST /security/analyze-image — capture d'écran (OCR) puis même analyse que le texte. */
export interface AnalyzeImageResult {
  extractedText: string
  ocrConfidence: number
  ocrDegraded: boolean
  analysis: AnalyzeMessageResult
}

// ---------------------------------------------------------------------------
// Audit (GET /audit/recent)
// ---------------------------------------------------------------------------

export interface AuditLogView {
  id: string
  action: string
  resourceType: string
  resourceId: string | null
  result: string
  riskScore: number | null
  riskLevel: string | null
  createdAt: string
}

// ---------------------------------------------------------------------------
// Risks / Incidents / Alertes
// ---------------------------------------------------------------------------

export interface RiskFactorView {
  factor: string
  description: string
  weight: number
  source: string
}

export interface RiskAssessmentView {
  id: string
  source: string
  riskScore: number
  riskLevel: ApiRiskLevel
  aiPredictionId: string | null
  explanation: string
  createdAt: string
  factors: RiskFactorView[]
}

export interface IncidentView {
  id: string
  type: string
  severity: string
  status: string
  detectedAt: string
  description: string
  riskScore: number | null
  source: string
}

export interface AlertView {
  id: string
  incidentId: string | null
  level: string
  message: string
  acknowledgedAt: string | null
  createdAt: string
}

// ---------------------------------------------------------------------------
// Dashboard (GET /dashboard/summary)
// ---------------------------------------------------------------------------

export interface CategoryScore {
  key: string
  label: string
  score: number
}

export interface DashboardSummary {
  cyberScore: number
  categories: CategoryScore[]
  threatsDetected7d: number
  openIncidents: number
  criticalOpenIncidents: number
  unacknowledgedAlerts: number
  protectedRecords: number
  sensitiveColumnsPendingReview: number
  recentAlerts: AlertView[]
}

// ---------------------------------------------------------------------------
// Producteurs / Exploitations
// ---------------------------------------------------------------------------

export interface CreateProducerRequest {
  code: string
  displayName: string
}

export interface ProducerView {
  id: string
  code: string
  displayName: string
  createdAt: string
}

export interface CreateFarmRequest {
  name: string
  producerId: string
}

export interface FarmView {
  id: string
  name: string
  producerId: string
  createdAt: string
}

// ---------------------------------------------------------------------------
// Fichiers
// ---------------------------------------------------------------------------

export interface FileMetadataView {
  id: string
  originalName: string
  contentType: string
  sizeBytes: number
  sha256Hex: string
  createdAt: string
}

// ---------------------------------------------------------------------------
// Partages sécurisés
// ---------------------------------------------------------------------------

export interface CreateShareRequest {
  fileId: string
  label?: string
  allowedColumns: string[]
  ttlMinutes?: number
}

export interface CreateShareResponse {
  shareId: string
  token: string
  publicPath: string
  expiresAt: string
  allowedColumns: string[]
  note: string
}

// ---------------------------------------------------------------------------
// Formation / sensibilisation (CyberÉducation)
// ---------------------------------------------------------------------------

export interface TrainingModuleView {
  id: string
  code: string
  title: string
  topic: string
  contentUrl: string | null
  createdAt: string
}

export interface TrainingResultView {
  id: string
  moduleId: string
  userId: string
  score: number | null
  completedAt: string | null
  createdAt: string
}

export interface CompleteModuleRequest {
  score?: number
}

export interface ShareSummaryView {
  shareId: string
  fileId: string
  label: string | null
  allowedColumns: string[]
  expiresAt: string
  revokedAt: string | null
  createdAt: string
}




