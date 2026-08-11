# Plan d'action — Terminer le frontend + intégration backend

> État au 11/08/2026 : backend ~80 % du P0 opérationnel sur `:8080`, frontend 5 pages/18
> implémentées, **zéro appel API**. Objectif : démo jury complète
> (login réel → dashboard → import → classification → fraud guard → audit → alertes).

## Suivi d'avancement

- [x] **Phase 0 — Fondation API** (11/08) : `src/lib/api.ts` (fetch + refresh 401 + ApiError),
  `src/types/api.ts` (miroir DTO), TanStack Query dans `AppProviders`, `.env.development`,
  Vite fixé sur le port **3000** (`http://localhost:3000` — autorisé par le CORS backend, testé OK).
- [x] **Phase 1 — Auth réelle** (11/08) : AuthProvider v2 (login/register/me/logout + restauration
  de session + événement `auth:expired`), LoginPage branchée (erreurs credentials/rate-limit/réseau),
  **RegisterPage** créée (`/inscription`), ProtectedRoute v2 (`requiredPermissions`), gardes du
  router basculées sur les permissions backend. `tsc` propre. ⚠️ À valider dans le navigateur.
- [x] **Phase 2 — Compléments backend** (11/08) — testés bout en bout :
  - `GET /dashboard/summary` : Cyber Score explicable (6 catégories), compteurs (menaces 7j,
    incidents ouverts/critiques, alertes non traitées, données protégées, colonnes sensibles
    à valider), 5 dernières alertes. `DashboardService` + `DashboardController`.
  - `POST /files/{id}/analyze` : `TabularFileParser` (XLSX via POI + CSV `;`/`,` + guillemets
    + BOM), en-têtes + 5 échantillons/col, max 100 col / 200 lignes scannées →
    `ClassifyDataService.classify(request, fileId)` → persistance liée au fichier.
    Test réel : CSV 5 colonnes → `iban_beneficiaire=FINANCIAL_SENSITIVE/CRITICAL`.
  - `GET/POST/PATCH /users` (`USER_MANAGE`) : liste des membres, invitation (mdp temporaire),
    changement de rôle/statut (garde anti auto-désactivation). Audit `USER_INVITE`/`USER_UPDATE`.
- [~] **Phase 3 — Pages P0 branchées** (en cours) :
  - [x] 3.1 Dashboard : `useDashboardData` → TanStack Query sur `/dashboard/summary`,
    nouveau `dashboard-model.ts` (mapping API→UI, textes non techniques), composants
    (`ProtectionCard`, `PriorityCard`, `RecentAlerts`, `MemberDashboard`) détachés des mocks,
    sélecteur de démo retiré, refresh auto 60 s.
  - [x] 3.4 Fraud Guard : `fraud-analysis.ts` appelle `POST /security/analyze-message`
    (mapping SignalType→icônes, décision plateforme affichée, bandeau « analyse simplifiée »
    si `degraded`), simulateur d'erreur retiré.
  - [x] 3.2 Import Excel : `import-data.ts` → `POST /files` (FormData) puis
    `POST /files/{id}/analyze`, mapping DataCategory→catégories UI, correction manuelle
    via `PATCH /data/classifications/{id}`, erreurs format/taille/réseau.
  - [x] 3.3 Classification : `classification-data.ts` → `GET /data/classifications` +
    `PATCH /data/classifications/{id}` (reclassement humain), champs incertains < 70 %.
  - [x] 3.5 Journal d'audit (11/08) : `audit-data.ts` → `GET /audit/recent`, mapping des
    codes backend (FILE_UPLOAD, DATA_CLASSIFY, LOGIN_FAILED…) en phrases lisibles,
    résultat SUCCESS/FAILURE/DEGRADED → Autorisé/Bloqué/À surveiller, filtres action +
    période, fiche détail adaptée (pas d'acteur/appareil dans le DTO), refresh auto 60 s,
    sélecteur de démo retiré. `tsc` propre.
  - [x] 3.6 Alertes & incidents : `alerts-data.ts` → `GET /alerts` + `GET /incidents` +
    `POST /alerts/{id}/acknowledge`, tri sévérité/statut, invalidation dashboard.
  - [x] 3.7 Producteurs (11/08) : `producers-data.ts` → `GET/POST /producers` +
    `GET/POST /farms`, liste + recherche + pagination, fiche simple (code, date,
    exploitations + ajout), création minimale (code auto-suggéré depuis le nom),
    gardé par `DATA_READ`/`DATA_WRITE`. Mode « Mon profil » producteur retiré
    (pas de lien user↔producer côté backend). `tsc` propre. ⚠️ À valider navigateur.
- [x] **Phase 4 — Pages secondaires** (11/08) :
  - Utilisateurs : `users-data.ts` → `GET/POST/PATCH /users` (mapping MemberView→Member,
    rôles backend avec libellés parlants dont RESPONSABLE_SECURITE), invitation = création
    directe avec mot de passe provisoire généré (affiché une fois + bouton copier),
    changement de rôle et activation/désactivation réels (garde anti auto-modification
    via `user.id`), badge « Double vérification », statuts ACTIVE/DISABLED (plus de
    « pending » fictif), loading/erreur/vide, sélecteur de démo retiré.
  - Organisation : fiche (nom org via session, compteurs producteurs/membres/Cyber Score
    partagés avec les caches TanStack existants) + **partages sécurisés** :
    `GET /shares` (états actif/expiré/arrêté, colonnes visibles, échéance en mots) et
    révocation `DELETE /shares/{id}`. Politiques/EditOrgPanel/DangerZone mock supprimés.
  - Profil : `ProfilePage` lecture seule depuis la session (`/auth/me`), note honnête
    « modification bientôt disponible ».
  - Transactions : retirées du menu, du routeur et du code (décision démo).
  - Paramètres sécurité : placeholder honnête conservé. `tsc` propre. ⚠️ À valider navigateur.
- [x] **Phase 5 — Polish & démo** (11/08) :
  - **Toasts 4 niveaux** (info/moyen/élevé/critique, couleurs famille signal, durée
    croissante avec la gravité) : `ToastProvider` + `Toaster` + `useToast`, branchés
    sur l'acquittement d'alerte et la révocation de partage.
  - **Bannière réseau globale** : `api.ts` émet `network-down`/`network-up`,
    `ConnectionBanner` affiche « Connexion au serveur perdue » puis « rétablie »
    (+ écoute `offline` navigateur) dans `AppLayout`.
  - **Nettoyage** : `src/mocks/` supprimé (plus aucun mock dans le code).
  - **Script démo jury** : `scripts/seed-demo.ps1` — compte `demo@agroshield.tg`,
    3 producteurs + 2 exploitations, CSV importé + analysé (5 col, 2 sensibles),
    message frauduleux analysé (CRITICAL / BLOCK_RECOMMENDED). **Exécuté avec succès
    contre le backend réel.**
  - **Test bout en bout API** : dashboard (score 80, 1 menace 7j, 1 incident,
    1 alerte non traitée, 6 données protégées), `GET /alerts` = 1, `GET /shares` = 0.
  - `tsc` propre + build de production OK (1,9 s). ⚠️ Répétition orale du parcours
    navigateur à faire avant le passage jury.

---

## Phase 0 — Fondation API (bloquant tout le reste) · ~½ journée

**Objectif : plus aucun mock dans le chemin critique.**

1. **Client HTTP** — `src/lib/api.ts`
   - `fetch` wrapper (pas besoin d'axios) : base URL `import.meta.env.VITE_API_URL` (défaut `http://127.0.0.1:8080/api/v1`)
   - Injection `Authorization: Bearer <accessToken>`
   - Gestion de l'enveloppe backend `{ success, data, error, meta }` → unwrap `data`, throw `ApiError(code, message)` sinon
   - Sur `401` : tentative `POST /auth/refresh` (une seule fois, file d'attente des requêtes en vol) puis rejeu ; échec → logout + redirect `/connexion`
   - `.env.development` : `VITE_API_URL=http://127.0.0.1:8080/api/v1`
2. **CORS** — vérifier `CORS_ALLOWED_ORIGINS` backend : ajouter le port Vite (`5173`) si absent
3. **Types API** — `src/types/api.ts` : miroir des DTO backend
   (`AuthResponse`, `ClassifyDataResult`, `ColumnClassification`, `AuditEntry`,
   `RiskAssessment`, `Incident`, `Alert`, `AnalyzeMessageResult`, `Producer`, `Farm`, `Share`, `FileMetadata`)
4. **TanStack Query** (`@tanstack/react-query`) : provider dans `AppProviders`,
   conventions `queryKey` par feature — donne gratuitement loading/error/retry/cache

**Critère de sortie :** `apiFetch('/health')` fonctionne depuis l'app, erreurs typées.

---

## Phase 1 — Auth réelle · ~1 journée

Remplace le mock localStorage par le vrai flux JWT.

1. **AuthProvider v2**
   - State : `user`, `accessToken` (mémoire), `refreshToken` (localStorage), `permissions[]`, `roles[]`
   - `login(email, password)` → `POST /auth/login` ; `register(...)` → `POST /auth/register`
   - `GET /auth/me` au mount si refreshToken présent (restauration de session)
   - `logout()` → `POST /auth/logout` + purge
2. **LoginPage** : formulaire email/mot de passe réel (garder le style existant),
   erreurs : credentials invalides, compte verrouillé (rate-limit backend), réseau
3. **RegisterPage** (nouvelle — n'existe pas) : email, mot de passe, nom complet,
   nom d'organisation → route `/inscription` sous `AuthLayout`
4. **ProtectedRoute v2** : décision par **permissions réelles** (`DATA_READ`, `SECURITY_VIEW`, `AUDIT_VIEW`, `USER_MANAGE`…) et non plus par rôle seul ; `navigation.ts` filtré pareil
5. Pages `MFA` / `Mot de passe oublié` : **rester en placeholder** (pas d'endpoint backend) — mettre un message honnête « bientôt disponible »

**Critère de sortie :** register → login → refresh auto → logout, menus filtrés par permissions réelles.

---

## Phase 2 — Compléments backend nécessaires · ~1 journée (parallélisable avec Phase 1)

Trois endpoints manquent pour alimenter le frontend :

1. **`GET /api/v1/dashboard/summary`** (nouveau contrôleur Spring) — l'écran vitrine n'a pas de source :
   - Cyber Score global + sous-scores par catégorie (calcul simple : % MFA activé, incidents ouverts, alertes non traitées, classifications sensibles non validées…)
   - Compteurs : menaces détectées (security_events 7j), incidents critiques ouverts, alertes non acquittées, données protégées (count producers+farms+files)
   - Alertes récentes (top 5)
   - Permission : authentifié (contenu adapté au rôle)
2. **Parsing XLSX/CSV** — `POST /api/v1/files/{id}/analyze` :
   - Apache POI (déjà dans le pom) + parsing CSV ; extrait en-têtes + 5 échantillons/colonne
   - Appelle en interne `ClassifyDataService.classify(...)` → renvoie `ClassifyDataResult` + `fileId`
   - Ferme le flux du cahier des charges : Upload → colonnes → classification
3. **`GET/POST/PATCH /api/v1/users`** (gestion utilisateurs, permission `USER_MANAGE`) :
   - Lister les membres de l'organisation, inviter (création directe email+mdp temporaire pour le MVP), changer rôle, activer/désactiver

**Critère de sortie :** les 3 endpoints testables via Swagger.

---

## Phase 3 — Pages P0 branchées · ~2,5 jours

Ordre = parcours de démo jury. Chaque page : loading (skeleton existant), vide, erreur, succès.

| # | Page | Endpoint(s) | Travail |
|---|------|-------------|---------|
| 3.1 | **Dashboard** (½ j) | `GET /dashboard/summary` | Remplacer `mocks/dashboard.ts` par `useQuery` ; garder les composants (`ProtectionCard`, `PriorityCard`, `RecentAlerts`) — seule la source change |
| 3.2 | **Import Excel** (½ j) | `POST /files` puis `POST /files/{id}/analyze` | Drag & drop, progression upload, erreur format/taille (10 MB max), puis transition vers résultat de classification |
| 3.3 | **Classification** (½ j) | résultat de 3.2 + `POST /data/classify` | Tableau colonnes : badge catégorie (couleurs famille signal d'`init.md`), confiance, politique recommandée, bandeau `degraded: true` (« analyse simplifiée — IA indisponible ») |
| 3.4 | **Fraud Guard** (¼ j) | `POST /security/analyze-message` | Remplacer `fraud-analysis.ts` mock par l'appel réel ; mapper signaux + recommandation + `aiScore`/`score` (conseil IA vs décision plateforme) |
| 3.5 | **Journal d'audit** (½ j) | `GET /audit/recent` | Tableau : action, ressource, résultat, risque (badge), date ; filtres client ; visible seulement avec `AUDIT_VIEW` |
| 3.6 | **Alertes & incidents** (½ j) | `GET /alerts`, `GET /incidents`, `POST /alerts/{id}/acknowledge` | Liste par sévérité (4 niveaux visuels), bouton « Marquer comme traité », onglet incidents |
| 3.7 | **Producteurs** (¼ j) | `GET/POST /producers`, `GET /farms` | Liste + fiche simple + création (formulaire minimal) |

**Vocabulaire :** jamais de terme technique (RBAC, JWT…) — reprendre les tournures d'`init.md`
(« Votre compte présente une activité inhabituelle », « analyse simplifiée »…).

---

## Phase 4 — Pages secondaires · ~1 journée

| Page | Endpoint | Note |
|------|----------|------|
| **Utilisateurs** | `GET/POST/PATCH /users` (Phase 2.3) | Liste, inviter, changer rôle, désactiver |
| **Organisation** | `GET /auth/me` (org) + shares | Fiche org + liste des partages actifs (`GET /shares`, révocation) |
| **Profil** | `GET /auth/me` | Lecture seule pour le MVP (pas d'endpoint update) |
| **Transactions** | — aucun endpoint backend | Garder placeholder « à venir » OU retirer du menu pour la démo (décision : retirer, plus propre) |
| **Paramètres sécurité** | — | Placeholder honnête (MFA non implémenté backend) |

---

## Phase 5 — Polish & démo · ~1 journée

1. **Toasts** 4 niveaux (info/moyen/élevé/critique) — couleurs famille signal
2. **États transverses** : erreur réseau globale (bannière « connexion au serveur perdue »), 403 avec message clair, skeletons partout
3. **Nettoyage** : supprimer `src/mocks/` (ou déplacer derrière un flag `VITE_DEMO_MODE` pour secours démo hors-ligne)
4. **Script démo jury** : seed d'un compte + données (producteurs, un import, un message frauduleux analysé, alertes) — petit script PowerShell ou SQL
5. **Test bout en bout du parcours démo** : register → dashboard → import Excel → classification → fraud guard → audit → alerte acquittée

---

## Récapitulatif & séquencement

```
Jour 1 : Phase 0 (matin) + Phase 1 (après-midi, suite jour 2 matin)
Jour 2 : Phase 1 fin + Phase 2 (backend, parallélisable si 2 devs)
Jour 3 : Phase 3.1 → 3.3 (dashboard, import, classification)
Jour 4 : Phase 3.4 → 3.7 (fraud, audit, alertes, producteurs)
Jour 5 : Phase 4 + Phase 5 (secondaires, polish, répétition démo)
```

**Total : ~5 jours-homme** (3,5 si les phases 1 et 2 sont menées en parallèle).

### Risques identifiés
| Risque | Mitigation |
|---|---|
| AI service non lancé pendant la démo | Le fallback backend fonctionne déjà (`degraded: true`) — l'UI doit l'afficher élégamment, c'est même un argument jury (« résilience ») |
| CORS bloqué | Tester dès la Phase 0 avec le port Vite réel |
| Access token 15 min expiré en pleine démo | Refresh automatique (Phase 0.1) — à tester explicitement |
| Pas de MFA/OTP backend | Assumé : placeholders honnêtes, ne pas le mettre dans le parcours démo |
```

