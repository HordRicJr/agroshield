"""Prédiction zero-shot fraude — utilise le registry chargé au lifespan."""

from __future__ import annotations

import logging
from typing import Any

from app.models.inference import zero_shot
from app.models.registry import registry
from app.schemas.fraud import ModelCategory

logger = logging.getLogger(__name__)

# Hypothèses en français naturel (stabilité zero-shot).
# Labels stables exposés ensuite sous forme courte pour Spring.
ZERO_SHOT_HYPOTHESES: list[tuple[str, str]] = [
    ("phishing", "ce message est une tentative de phishing"),
    ("fraude au paiement", "ce message tente de commettre une fraude au paiement"),
    ("vol d'identifiants", "ce message tente de voler des identifiants ou mots de passe"),
    ("usurpation d'identité", "ce message usurpe l'identité d'une organisation ou d'une personne"),
    ("demande suspecte", "ce message contient une demande suspecte ou dangereuse"),
    ("demande légitime", "ceci est un message professionnel agricole légitime"),
]


async def predict_categories(text: str) -> list[ModelCategory]:
    """Inférence async-safe. Ne journalise jamais le texte."""
    if not registry.loaded or registry.zero_shot is None:
        raise RuntimeError("Modèle zero-shot non chargé")

    hypotheses = [h for _, h in ZERO_SHOT_HYPOTHESES]
    raw: dict[str, Any] = await zero_shot(text, hypotheses, multi_label=True)

    labels = raw.get("labels") or []
    scores = raw.get("scores") or []
    hyp_to_short = {h: short for short, h in ZERO_SHOT_HYPOTHESES}

    categories: list[ModelCategory] = []
    for lab, sc in zip(labels, scores, strict=False):
        short = hyp_to_short.get(lab, lab)
        categories.append(ModelCategory(label=short, score=round(float(sc), 4)))

    # Garantir toutes les catégories stables même si le pipeline en omet
    present = {c.label for c in categories}
    for short, _ in ZERO_SHOT_HYPOTHESES:
        if short not in present:
            categories.append(ModelCategory(label=short, score=0.0))

    logger.info(
        "fraud_model_predict n_categories=%s top=%s",
        len(categories),
        categories[0].label if categories else None,
    )
    return categories
