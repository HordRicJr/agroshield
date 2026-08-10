# AgroShield

Logiciel web de gestion centralisée des données agricoles et de traçabilité, avec sécurité intégrée par conception — développé dans le cadre du **Hackathon des Togo IT Days 2026 — Cyber Innovation Challenge**, mission **AgroCyber**.

> Gérer, tracer, protéger — sans jamais compliquer le travail du terrain.

## Contexte

Le secteur agricole togolais se digitalise vite : paiements mobiles, plateformes de traçabilité, objets connectés. Cette évolution crée de nouveaux risques : fraude et phishing sur les paiements, absence de traçabilité des accès, comptes producteurs et coopératives compromis faute d'authentification adaptée.

AgroShield répond à ces enjeux avec une plateforme unique où une coopérative, une entreprise agricole ou une institution d'appui centralise ses données — producteurs, exploitations, documents — avec une sécurité pensée pour ne jamais ralentir le travail quotidien.

## Fonctionnalités

- **Espace centralisé** pour gérer producteurs, exploitations et documents professionnels, isolé strictement par organisation (multi-tenant)
- **Authentification renforcée et adaptative** : mot de passe haché (Argon2id), verrouillage après tentatives répétées (par compte et par IP), vérification renforcée déclenchée uniquement sur signal de risque — jamais systématique
- **Contrôle d'accès par rôle** : Producteur, Technicien, Agronome, Responsable, Responsable Sécurité — chacun avec des permissions précises
- **Partage sélectif** : transmettre une donnée précise à un partenaire externe via un lien à durée de vie limitée donnant accès aux métadonnées et colonnes autorisées uniquement — jamais le fichier complet
- **Traçabilité complète** : chaque consultation, création, modification et tentative refusée est journalisée (qui, quoi, quand, résultat)
- **Détection de fraude et de phishing** (Fraud Guard) : moteur hybride règles déterministes + modèle sémantique, score de risque explicable, jamais de décision opaque
- **Risk Engine & incidents** : escalade automatique des signaux à risque élevé en incidents et alertes suivis par l'organisation
- **Résilience** : si le service d'IA est indisponible, la plateforme continue de fonctionner en mode dégradé — jamais de blocage du travail quotidien à cause de l'IA

## Architecture

```
WEB/MOBILE → Backend AgroShield (Spring Boot, hexagonal) → PostgreSQL / Redis
                          │
                          ├── Sécurité : JWT, RBAC, rate-limit, audit
                          ├── Producteurs / Exploitations / Fichiers / Partages
                          └── AiServiceClient
                                    │
                             AI Service (FastAPI)
                                    │
                          Classification · Fraud Guard · Anomalies
```

Deux services :

| Service | Rôle | Stack |
|---|---|---|
| [`backend/`](backend/) | Métier, sécurité, RBAC, audit, décision | Spring Boot 3.4 · Java 17 · PostgreSQL · Redis · Resilience4j |
| [`ai-service/`](ai-service/) | Classification de sensibilité, détection de fraude/phishing, anomalies | FastAPI · Python · MiniLM (zero-shot, multilingue) |

Principe central : **l'IA conseille, le backend décide, l'audit prouve**. Chaque score IA est accompagné d'une explication ; la décision finale (bloquer, alerter, autoriser) et la traçabilité restent du côté métier, jamais dans une boîte noire.

## Modèle de sécurité

- Mots de passe : **Argon2id** — jamais de mot de passe en clair, jamais réversible
- Sessions : jetons de rafraîchissement à rotation, seule leur empreinte SHA-256 est stockée en base
- **Authentification adaptative (step-up)** : connexion standard rapide ; vérification renforcée déclenchée uniquement si un signal de risque est détecté (nouvel appareil, comportement inhabituel, action sensible)
- **Isolation multi-tenant stricte** : toute lecture/écriture est scopée à l'organisation de l'utilisateur, aucun accès croisé possible
- **Partage de données** : jetons aléatoires 256 bits, seule leur empreinte est stockée, expiration obligatoire, révocation à tout moment, accès limité aux métadonnées/colonnes autorisées
- **Traçabilité** : journal d'audit append-only, IP et appareil toujours hachés (jamais stockés en clair)
- **Défense contre le brute-force** : limitation des tentatives de connexion par compte et par IP
- En-têtes de sécurité (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`), CORS restreint par variable d'environnement, secrets exclusivement via variables d'environnement

Détails complets : [`backend/docs/security.md`](backend/docs/security.md), [`backend/docs/architecture.md`](backend/docs/architecture.md), [`ai-service/docs/fraud-guard.md`](ai-service/docs/fraud-guard.md).

## Démarrage rapide

Prérequis : JDK 17+, Python 3.11+, Docker, Maven 3.9+.

```powershell
# 1. Base de données + cache
cd backend
docker compose up -d

# 2. Backend
$env:SPRING_PROFILES_ACTIVE = 'local'
mvn spring-boot:run
# API      : http://127.0.0.1:8080/api/v1/health
# Swagger  : http://127.0.0.1:8080/swagger-ui.html

# 3. Service IA (autre terminal)
cd ai-service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --port 8000
```

Copier `.env.example` en `.env` dans chaque sous-projet et ajuster les valeurs avant de démarrer. Checklist de démonstration complète : [`backend/docs/demo-jury.md`](backend/docs/demo-jury.md).

## Rôles et permissions

| Rôle | Portée |
|---|---|
| `PRODUCTEUR` | Lecture/écriture de ses propres données |
| `TECHNICIEN` | Lecture/écriture/export des données terrain |
| `AGRONOME` | Lecture/écriture/export, analyses |
| `RESPONSABLE` | Gestion complète de l'organisation, utilisateurs, partage de données |
| `RESPONSABLE_SECURITE` | Supervision sécurité, incidents, audit |
| `ADMIN` | Administration plateforme |

## Structure du dépôt

```
backend/          Backend métier Spring Boot (hexagonal)
ai-service/        Service IA FastAPI (classification, fraude, anomalies)
docs/               Documentation transverse du projet
design-artifacts/   Artefacts de conception UX (WDS)
```

## État d'avancement

Fonctionnel aujourd'hui : inscription/connexion, RBAC, gestion producteurs/exploitations, upload et empreinte de fichiers, partage sélectif avec révocation, analyse de messages (Fraud Guard), classification de données, risk engine avec escalade en incidents/alertes, audit complet, limitation des tentatives de connexion.

Roadmap : authentification renforcée (MFA) branchée en step-up complet, détection d'anomalies connectée à l'authentification, moteur de politiques de sécurité actif.

## Licence

Modèle IA utilisé sous licence MIT ([`MoritzLaurer/multilingual-MiniLMv2-L6-mnli-xnli`](https://huggingface.co/MoritzLaurer/multilingual-MiniLMv2-L6-mnli-xnli)). Code du projet : à préciser par l'équipe.
