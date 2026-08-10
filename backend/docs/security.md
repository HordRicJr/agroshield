# Sécurité

## Hashing

| Donnée | Algo | Usage |
|---|---|---|
| Mot de passe | **Argon2id** | `PasswordHasher` (Phase 3 auth) |
| Fichier / payload AI | **SHA-256** | `ContentHasher` → `input_hash` (traçabilité sans contenu) |
| Refresh token | SHA-256 (Phase 3) | stocker uniquement l'empreinte |

## Interdits dans les logs

password, JWT, OTP, `AI_INTERNAL_TOKEN`, contenu message, cellules Excel.

## Headers

CSP/HSTS via nginx en prod. Phase 1 : nosniff, frame deny, referrer-policy.

## Multi-tenant

Isolation `organization_id` dès Phase 2 (données) / Phase 3 (auth).
