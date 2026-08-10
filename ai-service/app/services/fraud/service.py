"""Orchestration Fraud Guard — pipeline hybride."""

from __future__ import annotations

import logging
import time

from fastapi import HTTPException, status

from app.config import get_settings
from app.models.registry import registry
from app.schemas.fraud import AnalyzeMessageRequest, AnalyzeMessageResponse
from app.services.fraud.model import predict_categories
from app.services.fraud.normalize import normalize_text
from app.services.fraud.risk_engine import compute_risk
from app.services.fraud.rules import apply_fraud_rules

logger = logging.getLogger(__name__)

# Jeux acceptés en DEMO_MODE (hash de longueur+préfixe — pas de PII stockée).
_DEMO_ALLOWED_PREFIXES = (
    "bonjour, voici le rapport",
    "urgent. le compte de paiement",
    "votre compte sera supprimé",
    "veuillez trouver ci-joint",
    "agroshield demo",
)


async def analyze_message(request: AnalyzeMessageRequest) -> AnalyzeMessageResponse:
    settings = get_settings()
    text = normalize_text(request.content)

    if settings.demo_mode and not _demo_allowed(text):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": {
                    "code": "DEMO_MODE_REJECTED",
                    "message": (
                        "DEMO_MODE actif : seules les données de démonstration "
                        "synthétiques sont acceptées."
                    ),
                    "details": {},
                }
            },
        )

    if not registry.loaded or registry.zero_shot is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "error": {
                    "code": "MODEL_NOT_READY",
                    "message": "Modèle IA non chargé. Réessayer après /health/ready = 200.",
                    "details": {"models_loaded": False},
                }
            },
        )

    started = time.perf_counter()
    signals = apply_fraud_rules(text)
    categories = await predict_categories(text)
    risk = compute_risk(categories, signals)
    inference_ms = (time.perf_counter() - started) * 1000

    logger.info(
        "fraud_analyze channel=%s content_len=%s score=%s risk=%s "
        "n_signals=%s inference_ms=%.1f stub=false",
        request.channel.value,
        len(text),
        risk.score,
        risk.risk_level.value,
        len(signals),
        inference_ms,
    )

    return AnalyzeMessageResponse(
        risk_level=risk.risk_level,
        score=risk.score,
        signals=signals,
        model_categories=categories,
        recommendation=risk.recommendation,
        confidence=risk.confidence,
        stub=None,  # vraie inférence — pas de stub:true
    )


def _demo_allowed(text: str) -> bool:
    lower = text.lower().strip()
    return any(lower.startswith(p) for p in _DEMO_ALLOWED_PREFIXES)
