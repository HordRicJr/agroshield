"""Chargement unique du modèle HF zero-shot (CPU) au démarrage."""

from __future__ import annotations

import logging
import os
import time
from typing import Any

from app.config import get_settings
from app.models.registry import registry

logger = logging.getLogger(__name__)

# Texte de warm-up synthétique — pas de donnée métier.
_WARMUP_TEXT = "AgroShield warm-up probe"
_WARMUP_LABELS = ["agriculture", "finance"]


def load_models() -> None:
    """Charge le pipeline zero-shot une seule fois, puis warm-up.

    Ne jamais appeler depuis une route. PyTorch reste sur CPU (device=-1).
    """
    settings = get_settings()

    if settings.skip_model_load:
        logger.info(
            "model_loader action=skip reason=SKIP_MODEL_LOAD model_id=%s",
            settings.resolved_model_id(),
        )
        registry.zero_shot = None
        registry.loaded = False
        registry.load_seconds = None
        registry.warmup_seconds = None
        registry.model_id = None
        return

    hf_home = settings.hf_home.resolve()
    hf_home.mkdir(parents=True, exist_ok=True)
    # Cache local pour éviter tout retéléchargement (volume monté en prod).
    os.environ["HF_HOME"] = str(hf_home)
    os.environ.setdefault("TRANSFORMERS_CACHE", str(hf_home / "transformers"))
    os.environ.setdefault("HF_HUB_DISABLE_TELEMETRY", "1")

    model_id = settings.resolved_model_id()
    device = -1 if settings.model_device.lower() == "cpu" else 0
    logger.info(
        "model_loader action=start model_id=%s device=%s hf_home=%s",
        model_id,
        settings.model_device,
        hf_home,
    )

    t0 = time.perf_counter()
    try:
        pipe = _build_zero_shot_pipeline(model_id, device=device)
        load_seconds = time.perf_counter() - t0

        t1 = time.perf_counter()
        _warmup(pipe)
        warmup_seconds = time.perf_counter() - t1
    except Exception:
        registry.zero_shot = None
        registry.loaded = False
        registry.load_seconds = time.perf_counter() - t0
        registry.warmup_seconds = None
        registry.model_id = model_id
        logger.exception(
            "model_loader action=failed model_id=%s duration_s=%.2f",
            model_id,
            registry.load_seconds,
        )
        raise

    registry.zero_shot = pipe
    registry.loaded = True
    registry.load_seconds = load_seconds
    registry.warmup_seconds = warmup_seconds
    registry.model_id = model_id

    logger.info(
        "model_loader action=ready model_id=%s load_s=%.2f warmup_s=%.2f total_s=%.2f",
        model_id,
        load_seconds,
        warmup_seconds,
        load_seconds + warmup_seconds,
    )


def _build_zero_shot_pipeline(model_id: str, device: int = -1) -> Any:
    # Import tardif : accélère le démarrage quand SKIP_MODEL_LOAD=true.
    from transformers import pipeline

    return pipeline(
        task="zero-shot-classification",
        model=model_id,
        device=device,  # -1 = CPU
    )


def _warmup(pipe: Any) -> None:
    """Inférence à vide pour compiler les kernels / allouer les buffers."""
    pipe(_WARMUP_TEXT, candidate_labels=_WARMUP_LABELS, multi_label=False)
