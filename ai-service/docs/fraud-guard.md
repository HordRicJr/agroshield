# Fraud Guard — architecture hybride

## Pipeline

REQUEST → validation → normalize → zero-shot MiniLM → règles → risk engine → réponse

## Pourquoi zero-shot ?

Le MiniLM NLI multilingue apporte une compréhension sémantique **générale**.
Ce n'est **pas** un modèle entraîné sur des fraudes agricoles. Il complète
les règles déterministes, il ne les remplace pas.

## Pourquoi les règles ?

Rapides, explicables, défendables devant un jury / un régulateur.
Urgence, paiement, bénéficiaire, OTP, URL, usurpation.

## Score (déterministe)

```
final = round(0.45 * model_component + 0.55 * rule_component)
# majoration ≥ 75 si CREDENTIAL_HARVEST ou (BENEFICIARY + FINANCIAL)
```

0–24 LOW · 25–49 MEDIUM · 50–74 HIGH · 75–100 CRITICAL

## Pas de fausse certitude

Vocabulaire : « risque estimé », « signaux détectés », « vérification recommandée ».
L'IA conseille ; Spring décide et audite.
