"""Route POST /ai/classify-data."""

import logging
import time

from fastapi import APIRouter, Depends

from app.schemas.classify import ClassifyRequest, ClassifyResponse
from app.security import verify_internal_token
from app.services.classifier import classify_columns

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ai", tags=["classify"], dependencies=[Depends(verify_internal_token)])


@router.post(
    "/classify-data",
    response_model=ClassifyResponse,
    summary="Classifier les colonnes d'un fichier agricole",
)
async def classify_data(body: ClassifyRequest) -> ClassifyResponse:
    started = time.perf_counter()
    result = classify_columns(body)
    elapsed_ms = (time.perf_counter() - started) * 1000
    # Journalise noms de colonnes + durée — jamais les samples.
    logger.info(
        "classify_data columns=%s duration_ms=%.1f stub=true",
        [c.name for c in body.columns],
        elapsed_ms,
    )
    return result
