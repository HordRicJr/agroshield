# Sécurité

## Hashing

| Donnée | Algo | Usage |
|---|---|---|
| Mot de passe | **Argon2id** | `PasswordHasher` (Phase 3 auth) |
| Fichier / payload AI | **SHA-256** | `ContentHasher` → `input_hash` (traçabilité sans contenu) |
| Refresh token | SHA-256 (Phase 3) | stocker uniquement l'empreinte |

## Chiffrement at-rest (fichiers)

| Élément | Détail |
|---|---|
| Algo | **AES-256-GCM** (`AesGcmFileCipher`) |
| Clé | `agroshield.storage.encryption.master-key-base64` (32 octets décodés) |
| Métadonnées | `file_metadata.encrypted`, `iv_b64`, `encryption_alg`, `key_id` |
| Intégrité | SHA-256 du **plaintext** avant chiffrement |
| Policy org | `ENCRYPT_AT_REST` (ENFORCE) seedée à l'inscription |
| Audit | `FILE_ENCRYPT` / `FILE_DECRYPT` / `FILE_UPLOAD` (flag encrypted) |

Download authentifié déchiffre en mémoire — le disque reste chiffré.  
Share public = `METADATA_ONLY` + colonnes `MASKED`/`VISIBLE` via policy `MASK_SENSITIVE_COLUMNS`.

## Interdits dans les logs

password, JWT, OTP, `AI_INTERNAL_TOKEN`, contenu message, cellules Excel, clé maître, IV en clair dans les logs applicatifs.

## Headers

CSP/HSTS via nginx en prod. Phase 1 : nosniff, frame deny, referrer-policy.

## Multi-tenant

Isolation `organization_id` dès Phase 2 (données) / Phase 3 (auth).
