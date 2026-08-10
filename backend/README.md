# AgroShield Backend

Backend métier Spring Boot 3.4 / Java 17 — cerveau d'AgroShield AI.

**L'IA conseille. Spring décide. L'audit prouve.**

## Auth (Phase 3)

```http
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
GET  /api/v1/auth/me   (Bearer JWT)
```

Mots de passe : **Argon2id**. Refresh token : **SHA-256** en base (jamais le clair).
JWT : issuer/audience/expiration validés.

## Phase 4 — IA résiliente + classify / fraude métier

```http
POST /api/v1/data/classify             (DATA_READ | DATA_WRITE)
POST /api/v1/security/analyze-message  (SECURITY_VIEW)
```

- Client AI : timeouts + **Retry** (réseau) + **CircuitBreaker**
- Si IA down / circuit ouvert → **fallback local** + `degraded: true` (pas de 500 utilisateur)
- Persistance : `ai_predictions`, `data_classifications`, `audit_logs`
- Empreinte SHA-256 du payload (jamais le contenu brut dans les logs)

## Phase 5 — Risk Engine + incidents / alertes

L'IA **conseille** (`aiScore` / `aiRiskLevel`) ; Spring **décide** (`score` / `riskLevel` / `recommendedAction`).

```http
GET  /api/v1/risks/recent
GET  /api/v1/incidents
GET  /api/v1/alerts
POST /api/v1/alerts/{id}/acknowledge
```

- Contexte : canal, mode dégradé, incidents ouverts 7j, signaux critiques
- Persistance : `risk_assessments` + `risk_factors`
- Escalade auto HIGH/CRITICAL → `incidents` + `alerts`
- Actions : `MONITOR` | `REVIEW` | `ALERT` | `BLOCK_RECOMMENDED`

## Produit cœur (hackathon)

```http
POST/GET/PUT/DELETE /api/v1/producers
POST/GET/PUT/DELETE /api/v1/farms
POST/GET/DELETE     /api/v1/files   (+ GET /{id}/content)
POST/GET/DELETE     /api/v1/shares
GET                 /api/v1/public/shares/{token}   # métadonnées + colonnes — pas le fichier
```

- Upload local + `sha256` dans `file_metadata`
- Partage sélectif (`DATA_SHARE`) : token hashé, colonnes autorisées, **pas de binaire**
- Login : audit `LOGIN_FAILED` (`email_hash` + `ip_hash`) + rate-limit compte **et** IP
- Lecture audit : `GET /api/v1/audit/recent` (`AUDIT_VIEW`)

Checklist démo : [`docs/demo-jury.md`](docs/demo-jury.md)

## Phase 2 — Base de données

```powershell
cd D:\Agro\backend
docker compose up -d
# Postgres : localhost:5433  Redis : localhost:6379
D:\Agro\.tools\apache-maven-3.9.6\bin\mvn.cmd spring-boot:run
```

Vérifier le seed RBAC : http://127.0.0.1:8080/api/v1/system/schema-status  
(roles=6, permissions=10)

`ddl-auto=validate` — le schéma vient uniquement de Flyway `V1__core_schema.sql`.

## Prérequis

- JDK 17+
- AI Service local : `http://127.0.0.1:8000` (voir `../ai-service`)
- Maven 3.9+ (ou `D:\Agro\.tools\apache-maven-3.9.6`)

## Lancement

```powershell
cd D:\Agro\backend
docker compose up -d
$env:SPRING_PROFILES_ACTIVE='local'
D:\Agro\.tools\apache-maven-3.9.6\bin\mvn.cmd spring-boot:run
```

- API health : http://127.0.0.1:8080/api/v1/health  
- Swagger : http://127.0.0.1:8080/swagger-ui.html  
- Actuator : http://127.0.0.1:8080/actuator/health  

## Fraud smoke (Spring → AI)

`POST /api/v1/security/analyze-message` (Bearer JWT)

```json
{
  "content": "URGENT. Le compte de paiement a changé. Envoyez immédiatement les fonds sur ce nouveau compte.",
  "channel": "WHATSAPP",
  "language": "fr"
}
```

## Sécurité

- Secrets via env (jamais en dur commités)
- Argon2id (`PasswordHasher`)
- SHA-256 pour empreintes fichiers / `input_hash` AI
- Headers : `X-Content-Type-Options`, `X-Frame-Options`, Referrer-Policy
- `X-Correlation-ID` sur chaque requête
- JWT + RBAC (`@PreAuthorize` sur endpoints métier)

## Docs

- `docs/architecture.md`
- `docs/security.md`
- `docs/ai-integration.md`
