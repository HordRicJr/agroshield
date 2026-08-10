# Checklist démo jury — AgroShield Backend

Prérequis : Postgres `:5433`, Redis `:6379`, AI `:8000`, backend `:8080`.

```powershell
cd D:\Agro\backend
docker compose up -d
$env:SPRING_PROFILES_ACTIVE='local'
D:\Agro\.tools\apache-maven-3.9.6\bin\mvn.cmd spring-boot:run
```

Swagger : http://127.0.0.1:8080/swagger-ui.html

---

## Script (5–7 min)

### 1. Inscription / connexion
- `POST /api/v1/auth/register` (email, org, mot de passe)
- Montrer le JWT + rôles / permissions (`RESPONSABLE`)
- `GET /api/v1/auth/me`

### 2. Cœur produit agricole
- `POST /api/v1/producers` → code + nom
- `POST /api/v1/farms` → lié au producteur
- Dire : *gestion centralisée, isolée par organisation*

### 3. Document + empreinte
- `POST /api/v1/files` (multipart CSV/Excel)
- Montrer `sha256Hex` + métadonnées (pas le contenu en clair dans les logs)

### 4. Partage sélectif (point fort checklist)
- `POST /api/v1/shares` body (camelCase **ou** snake_case) :
  ```json
  {
    "fileId": "<uuid-fichier>",
    "label": "Partenaire coop",
    "allowedColumns": ["parcelle", "superficie"],
    "ttlMinutes": 60
  }
  ```
  Équivalent accepté : `file_id`, `allowed_columns`, `ttl_minutes`
- Réponse : `token` + `publicPath` (ex. `/api/v1/public/shares/{token}`)
- Ouvrir **sans JWT** : `GET {publicPath}`
- Insister : **`accessMode: METADATA_ONLY`** — colonnes autorisées, **pas le fichier complet**
- `GET /api/v1/shares` → liste des partages org
- `DELETE /api/v1/shares/{id}` → révocation → le lien public tombe

### 5. Fraud Guard + décision Spring
- `POST /api/v1/security/analyze-message` (message urgent + changement de compte)
- Montrer `aiScore` (conseil IA) vs `score` / `recommendedAction` (décision plateforme)
- Si HIGH/CRITICAL : `incidentId` + `alertId` créés
- `GET /api/v1/incidents` / `/alerts`

### 6. Audit
- `GET /api/v1/audit/recent`
- Montrer `PRODUCER_CREATE`, `FILE_UPLOAD`, `DATA_SHARE_CREATE`, etc.

### 7. Sécurité login (30 s)
- 5× `POST /api/v1/auth/login` avec mauvais mot de passe
- 6ᵉ → **429 RATE_LIMITED**
- Dire : verrouillage par compte **et** par IP (hashés), échecs journalisés (`LOGIN_FAILED`, `email_hash` / `ip_hash`)

---

## Phrases clés
- *L’IA conseille. Spring décide. L’audit prouve.*
- *Partager une donnée ≠ donner le fichier complet.*
- *Isolation multi-tenant : chaque coop ne voit que son org.*

## Ne pas promettre (roadmap)
- MFA / step-up
- Anomaly detection branchée sur login
- Politiques `security_policies` actives
- Déploiement Hugging Face Spaces (compte PRO)
