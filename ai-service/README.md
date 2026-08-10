---
title: AgroShield AI Service
emoji: 🛡️
colorFrom: green
colorTo: blue
sdk: docker
app_port: 7860
pinned: false
license: mit
short_description: Fraud Guard + classify + anomaly API
startup_duration_timeout: 1h
---

# AgroShield AI Service

Microservice FastAPI pour **AgroShield AI** — classification, fraude/phishing (hybride règles + MiniLM), anomalies.

**Licence modèle :** MIT — [`MoritzLaurer/multilingual-MiniLMv2-L6-mnli-xnli`](https://huggingface.co/MoritzLaurer/multilingual-MiniLMv2-L6-mnli-xnli)

Ce n'est **pas** un détecteur de fraude spécialisé entraîné sur des arnaques agricoles.  
Il produit un **risque estimé** + signaux explicables. Spring Boot décide.

## Endpoints

| Méthode | Chemin | Auth |
|---|---|---|
| GET | `/health` | public |
| GET | `/health/ready` | public |
| GET | `/docs` | public |
| POST | `/ai/analyze-message` | `X-Internal-Token` |
| POST | `/ai/classify-data` | `X-Internal-Token` |
| POST | `/ai/detect-anomaly` | `X-Internal-Token` |
| POST | `/ai/anomaly/train` | `X-Internal-Token` |

## Secrets Space

- `INTERNAL_TOKEN` — jeton partagé avec Spring Boot

## Variables

- `DEMO_MODE=true` (recommandé en public)
- `PORT=7860`
- `HF_HOME=/data/huggingface`
- `MODEL_DEVICE=cpu`
