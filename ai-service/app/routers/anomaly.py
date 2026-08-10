"""Routes POST /ai/detect-anomaly et /ai/anomaly/train."""

import logging
import time

from fastapi import APIRouter, Depends

from app.schemas.anomaly import (
    DetectAnomalyRequest,
    DetectAnomalyResponse,
    TrainAnomalyRequest,
    TrainAnomalyResponse,
)
from app.security import verify_internal_token
from app.services.anomaly_detector import detect_anomaly, train_anomaly

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ai", tags=["anomaly"], dependencies=[Depends(verify_internal_token)])


@router.post(
    "/detect-anomaly",
    response_model=DetectAnomalyResponse,
    summary="Détecter une anomalie comportementale",
)
async def detect_anomaly_route(body: DetectAnomalyRequest) -> DetectAnomalyResponse:
    started = time.perf_counter()
    result = detect_anomaly(body)
    elapsed_ms = (time.perf_counter() - started) * 1000
    logger.info(
        "detect_anomaly org=%s user=%s baseline=%s duration_ms=%.1f stub=true",
        body.organization_id,
        body.user_id,
        result.baseline_available,
        elapsed_ms,
    )
    return result


@router.post(
    "/anomaly/train",
    response_model=TrainAnomalyResponse,
    summary="Réentraîner le modèle Isolation Forest d'une organisation",
)
async def train_anomaly_route(body: TrainAnomalyRequest) -> TrainAnomalyResponse:
    started = time.perf_counter()
    result = train_anomaly(body)
    elapsed_ms = (time.perf_counter() - started) * 1000
    logger.info(
        "anomaly_train org=%s n_samples=%s duration_ms=%.1f stub=true",
        body.organization_id,
        len(body.events),
        elapsed_ms,
    )
    return result
