# Intégration AI Service

Source de vérité : contrats Pydantic `ai-service/app/schemas/*`.

## Endpoints consommés

| Spring | FastAPI |
|---|---|
| `AiServicePort.classifyData` | `POST /ai/classify-data` |
| `AiServicePort.analyzeMessage` | `POST /ai/analyze-message` |
| `AiServicePort.detectAnomaly` | `POST /ai/detect-anomaly` |
| `AiServicePort.trainAnomaly` | `POST /ai/anomaly/train` |
| health indicator | `GET /health/ready` |

## Auth inter-services

Header `X-Internal-Token` = `AI_INTERNAL_TOKEN` (env).  
Aussi `X-Correlation-ID`.

## Décisions figées

- Pas de champ `url` séparé (URLs dans `content`)
- Anomaly AI **sans** `risk_level` — Spring Risk Engine le produit
- Train = `POST /ai/anomaly/train`
- `model_categories` (liste), `score` int, `confidence` float 0–1
- `risk_level` unifié classify + fraud

## Résilience (Phase 4)

- Timeouts RestClient (`connect` / `read`)
- **Retry** : uniquement `AiUnavailableException` (réseau / timeout)
- **CircuitBreaker** `aiService` : ouvre si taux d'échec élevé
- Use-cases `ClassifyDataService` / `AnalyzeMessageService` :
  - tentent l'IA
  - si échec ou circuit ouvert → **fallback local** + `degraded: true`
  - persistent `ai_predictions` + audit (et `data_classifications` pour classify)
- **Jamais** de 500 utilisateur pour IA down sur ces routes

## Endpoints plateforme

| Spring | Permission | AI |
|---|---|---|
| `POST /api/v1/data/classify` | DATA_READ / DATA_WRITE | `/ai/classify-data` |
| `POST /api/v1/security/analyze-message` | SECURITY_VIEW | `/ai/analyze-message` |
