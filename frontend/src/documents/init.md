# Roadmap Frontend — AgroShield AI

## 1. Ce que je retiens du cahier des charges (angle frontend)

**5 rôles = 5 expériences différentes** : Producteur, Technicien, Agronome, Responsable de coopérative, Administrateur. Chaque rôle voit un sous-ensemble de menus/données (RBAC), donc le frontend doit gérer une **navigation conditionnelle par rôle**, pas juste un affichage/masquage de boutons.

**Le produit tourne autour de 3 boucles UX** :
- Boucle "sécurité passive" : dashboard, audit logs, alertes, cyber score
- Boucle "action utilisateur" : import Excel, classification, partage sécurisé, vérification d'un message suspect
- Boucle "pédagogie" : cyberéducation, quiz, progression du score

**Contrainte forte** : le vocabulaire technique (IDS, RBAC, JWT, XSS) ne doit jamais apparaître côté utilisateur agricole. Tout doit être traduit en langage clair ("Votre compte présente une activité inhabituelle"). C'est une contrainte de contenu/UX writing autant que de design.

**Le MVP hackathon (P0)** définit clairement ce qu'il faut construire en premier :
Auth + RBAC, Import Excel, Classification, Audit logs, Anomaly Detection, Risk Score, Alertes, Dashboard, AI Fraud Guard.

C'est sur ce périmètre P0 qu'il faut concentrer l'inventaire d'écrans — pas sur les 18 fonctionnalités du cahier des charges complet.

---

## 2. Inventaire des pages (priorité P0)

### A. Authentification & compte
| Page | Rôles concernés | États clés |
|---|---|---|
| Connexion (email/mdp ou tel/OTP) | Tous | default, loading, erreur credentials, compte verrouillé, MFA requis |
| MFA / Vérification OTP | Tous | saisie, code invalide, expiré, renvoyer code |
| Mot de passe oublié / reset | Tous | envoi email, lien invalide/expiré, succès |
| Onboarding / création de compte | Responsable, Admin | multi-étapes, validation en cours |
| Gestion de session (déconnexion globale) | Tous | liste des sessions actives, confirmation |

### B. Organisation
| Page | Rôles | États clés |
|---|---|---|
| Fiche organisation (coopérative/exploitation) | Responsable, Admin | vue lecture, édition, vide (pas encore configurée) |
| Gestion des utilisateurs (inviter, rôles, désactiver) | Responsable, Admin | liste vide, liste paginée, invitation en attente, erreur droits |

### C. Données agricoles
| Page | Rôles | États clés |
|---|---|---|
| Import Excel/CSV | Responsable, Technicien | drag&drop, upload en cours, erreur format, aperçu avant validation |
| Résultat de classification IA | Responsable, Admin | analyse en cours (async), résultat (X colonnes Personnel/Agricole/Financier), correction manuelle par admin |
| Liste producteurs / exploitations / productions | Producteur (ses données), Technicien, Agronome, Responsable | vide, chargement, filtré, accès partiel (colonnes masquées si non autorisé) |
| Fiche détail (producteur, exploitation, transaction) | selon RBAC | lecture seule vs édition, champs sensibles masqués/floutés |

### D. Sécurité & supervision
| Page | Rôles | États clés |
|---|---|---|
| **Dashboard cybersécurité** (Cyber Score, menaces, incidents, utilisateurs à risque) | Responsable sécurité, Admin | chargement des widgets, aucune donnée, temps réel/rafraîchi |
| Journal d'audit (logs) | Responsable sécurité, Admin | liste paginée, filtres (utilisateur/action/date), export bloqué visuellement pour non-autorisés |
| Détail d'un événement de sécurité (avec Risk Score + Explainable AI) | Responsable sécurité, Admin | vue "facteurs du score" (+30 volume, +20 heure...), aucun facteur significatif |
| Liste des alertes / incidents | Responsable sécurité, Admin | par sévérité (faible/moyen/élevé/critique), traité/non traité, assigné |
| **AI Fraud & Phishing Guard** (analyse d'un message/SMS/URL) | Tous les utilisateurs métier | saisie/upload, analyse en cours, résultat risque faible/moyen/élevé avec signaux détectés, recommandation |

### E. Compte / paramètres
| Page | Rôles | États clés |
|---|---|---|
| Profil utilisateur | Tous | édition, changement mot de passe |
| Paramètres de sécurité (MFA, sessions) | Tous | activé/désactivé |
| Paramètres organisation (politiques d'accès) | Admin uniquement | verrouillé visuellement pour les autres rôles |

### F. Écrans transverses (à prévoir dès le début)
- État vide générique (pas encore de données)
- État de chargement (skeleton, pas de spinner générique si possible)
- État d'erreur réseau / serveur
- État "accès refusé" (403 — RBAC), avec message compréhensible non technique
- État "action bloquée par la sécurité" (ex: export bloqué, MFA requis avant de continuer)
- Notification toast (info / alerte moyenne / alerte critique — 4 niveaux visuels distincts, cf. §2.12 du cahier des charges)

**P1 à prévoir en 2ᵉ vague** : Secure Sharing (aperçu "à partager vs à masquer"), Cyber Score détaillé par catégorie, Cyberéducation (parcours + quiz), activation MFA avancée.
**P2** : recherche d'image, analytics avancées, multi-organisation, app mobile complète — pas nécessaire pour la V1 des maquettes.

---

## 3. Palette de couleurs

Logique : deux familles bien séparées — une **famille de marque** (agriculture, confiance, IA) qui habille l'interface en permanence, et une **famille de signal** (sécurité) réservée exclusivement aux risk scores et alertes. Si on mélange les deux, l'app "crie" en permanence et le vert de marque perd sa valeur de repère quand une vraie alerte critique apparaît.

### Famille de marque

| Rôle | Couleur | Hex | Usage |
|---|---|---|---|
| Primaire | Vert forêt | `#14532D` | Header, boutons primaires, navigation active, logo |
| Primaire clair | Vert feuille | `#2D8659` | Hover, liens, icônes actives |
| Primaire très clair | Vert brume | `#E6F4EC` | Fonds de cartes, badges "sécurisé", états positifs légers |
| Secondaire (IA / tech) | Bleu ardoise | `#1E3A5F` | Éléments liés à l'IA (Explainable AI, scores, badges "analysé par IA"), pour distinguer visuellement "agriculture" (vert) de "intelligence/analyse" (bleu) |
| Secondaire clair | Bleu brume | `#EAF1F8` | Fonds des blocs d'analyse IA, tooltips explicatifs |

### Famille de signal (risque — jamais utilisée hors contexte sécurité)

| Niveau | Couleur | Hex | Usage |
|---|---|---|---|
| Faible / OK | Vert signal | `#2F9E44` | Risk score bas, statut "protégé" |
| Moyen | Ambre | `#F59F00` | Surveillance renforcée, avertissement |
| Élevé | Orange rouge | `#E8590C` | Notification responsable sécurité |
| Critique | Rouge | `#C92A2A` | Blocage, incident critique, action bloquée |

*Note : garder le vert "signal" (`#2F9E44`) légèrement différent du vert "marque" (`#14532D`/`#2D8659`) — même famille de teinte pour rester cohérent, mais assez distinct pour ne pas faire croire qu'un badge de statut est un simple élément de navigation.*

### Neutres

| Rôle | Hex | Usage |
|---|---|---|
| Fond général | `#F7FAF8` | Fond de page (léger tint vert, pas blanc pur — plus doux, cohérent avec le thème agricole) |
| Surface / carte | `#FFFFFF` | Cartes, modales |
| Bordure | `#DDE5DF` | Séparateurs, contours de champs |
| Texte principal | `#1B2B22` | Corps de texte (vert très foncé plutôt que noir pur, pour rester dans la teinte de marque) |
| Texte secondaire | `#5B6B60` | Légendes, métadonnées, timestamps |
| Désactivé | `#A9B5AD` | Champs/actions inactifs |

---

## 4. Typographie

Deux contraintes à concilier : **lisibilité maximale sur mobile pour un public non-technicien** (§3.6 du cahier des charges) et **crédibilité "sécurité/IA"** pour l'aspect démo hackathon devant un jury technique.

- **Titres / UI structurante — [Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk)** : géométrique, légèrement technique sans être froide, donne le côté "IA/sécurité" sur les headers, noms de sections, scores affichés en grand (ex: `84/100`).
- **Corps de texte / contenu métier — [Inter](https://fonts.google.com/specimen/Inter)** : conçue pour l'UI, excellente lisibilité sur petit écran, chiffres tabulaires nets (utile pour les tableaux de données agricoles et logs d'audit), très large support de l'alphabet latin (FR/EN).
- Alternative tout-en-un si on veut une seule famille pour simplifier l'intégration : **[Manrope](https://fonts.google.com/specimen/Manrope)** — un peu plus chaleureuse qu'Inter, cohérente avec le côté "humain/agricole" du produit, tout en restant très lisible.

**Échelle suggérée (mobile-first)** :
| Usage | Taille | Poids |
|---|---|---|
| Score / chiffre clé (ex: Cyber Score) | 40–48px | Space Grotesk Bold |
| H1 (titre de page) | 24px | Space Grotesk SemiBold |
| H2 (section) | 18px | Space Grotesk Medium |
| Corps de texte | 15px | Inter Regular |
| Légende / métadonnée | 13px | Inter Regular, couleur texte secondaire |
| Label de badge (risque) | 12px | Inter SemiBold, majuscules, espacement des lettres |

Je peux maintenant vous faire un premier mockup (dashboard ou écran de login) appliquant cette palette et cette typo, pour qu'on valide la direction avant de continuer.

---

## 5. Roadmap de conception frontend (proposition de séquençage)

1. **Fondations** : palette, typographie, composants de base (boutons, inputs, badges de risque, cartes), grille mobile-first
2. **Auth flow complet** (connexion → MFA → session)
3. **Dashboard cybersécurité** (écran vitrine du projet, fort impact démo jury)
4. **Import Excel + résultat de classification IA** (parcours P0 différenciant)
5. **AI Fraud & Phishing Guard** (écran de démo à fort effet "wow")
6. **Audit logs + détail d'un événement (Explainable AI)**
7. **Gestion des utilisateurs/RBAC + états d'accès refusé**
8. **Polish : états vides/erreurs/notifications transverses**

Cette séquence colle au plan de démonstration probable du hackathon : dashboard → import → détection → explication → action.