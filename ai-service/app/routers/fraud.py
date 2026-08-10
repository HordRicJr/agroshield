"""Route POST /ai/analyze-message."""

import logging
import time

from fastapi import APIRouter, Depends

from app.schemas.fraud import AnalyzeMessageRequest, AnalyzeMessageResponse
from app.security import verify_internal_token
from app.services.fraud_guard import analyze_message

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ai", tags=["fraud"], dependencies=[Depends(verify_internal_token)])


@router.post(
    "/analyze-message",
    response_model=AnalyzeMessageResponse,
    summary="Évaluer le risque estimé d'un message (fraude / phishing)",
    responses={
        401: {"description": "Jeton X-Internal-Token manquant ou invalide"},
        403: {"description": "DEMO_MODE : donnée réelle refusée"},
        422: {"description": "Payload invalide"},
        503: {"description": "Modèle non chargé"},
    },
)
async def analyze_message_route(body: AnalyzeMessageRequest) -> AnalyzeMessageResponse:
    """Analyse hybride : règles de sécurité + zero-shot MiniLM + risk engine.

    Retourne un **risque estimé**, jamais une preuve d'escroquerie.
    Le contenu du message n'est jamais journalisé.
    """
    started = time.perf_counter()
    result = await analyze_message(body)
    elapsed_ms = (time.perf_counter() - started) * 1000
    logger.info(
        "analyze_message channel=%s content_len=%s score=%s risk=%s duration_ms=%.1f stub=%s",
        body.channel.value,
        len(body.content),
        result.score,
        result.risk_level.value,
        elapsed_ms,
        result.stub is True,
    )
    return result
