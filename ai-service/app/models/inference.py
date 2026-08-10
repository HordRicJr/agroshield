"""Inférence zero-shot — toujours hors event loop (PyTorch bloquant)."""

from __future__ import annotations

import logging
from typing import Any

from starlette.concurrency import run_in_threadpool

from app.models.registry import registry

logger = logging.getLogger(__name__)


def zero_shot_sync(
    text: str,
    candidate_labels: list[str],
    *,
    multi_label: bool = False,
) -> dict[str, Any]:
    """Appel synchrone au pipeline — à utiliser uniquement depuis un thread pool."""
    if not registry.loaded or registry.zero_shot is None:
        raise RuntimeError("Modèle zero-shot non chargé (registry.loaded=false).")
    return registry.zero_shot(
        text,
        candidate_labels=candidate_labels,
        multi_label=multi_label,
    )


async def zero_shot(
    text: str,
    candidate_labels: list[str],
    *,
    multi_label: bool = False,
) -> dict[str, Any]:
    """Inférence async-safe : délègue au thread pool.

    Ne journalise jamais `text` — uniquement la taille et le nombre de labels.
    """
    logger.info(
        "zero_shot_infer text_len=%s n_labels=%s multi_label=%s",
        len(text),
        len(candidate_labels),
        multi_label,
    )
    return await run_in_threadpool(
        zero_shot_sync,
        text,
        candidate_labels,
        multi_label=multi_label,
    )
