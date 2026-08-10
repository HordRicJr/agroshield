# Architecture AgroShield Backend

```
WEB/MOBILE → Spring Boot (métier) → PostgreSQL / Redis
                    ↓
              AiServiceClient
                    ↓
           FastAPI ai-service (local :8000)
                    ↓
              MiniLM / IF / …
```

## Hexagonal

- `domain/` — règles & ports
- `application/` — use cases
- `infrastructure/` — AI, security, persistence
- `interfaces/` — REST, exceptions

## Principe

Utilisateur → Spring Security → Contexte → AI → Risk Engine → Policy → Action → Audit

Phase 1 = squelette + client AI + hashing + smoke analyze-message.
Phase 2 = Flyway + JPA.
Phase 3 = Auth JWT / RBAC.
Phase 4 = Resilience4j + classify/fraude métier (persist + audit + fallback).
Phase 5 = Risk Engine plateforme + risk_assessments + incidents/alertes.
Produit cœur = producers/farms/files/shares + login audit/rate-limit.

