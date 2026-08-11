"""Route POST /ai/ocr — extraction de texte depuis une capture d'écran."""

import logging

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.schemas.ocr import OcrResponse
from app.security import verify_internal_token
from app.services.ocr_service import UnreadableImageError, extract_text

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ai", tags=["ocr"], dependencies=[Depends(verify_internal_token)])

_MAX_BYTES = 5 * 1024 * 1024


@router.post(
    "/ocr",
    response_model=OcrResponse,
    summary="Extraire le texte d'une capture d'écran (SMS / WhatsApp)",
    responses={
        400: {"description": "Image illisible ou trop volumineuse"},
        401: {"description": "Jeton X-Internal-Token manquant ou invalide"},
    },
)
async def ocr_route(file: UploadFile = File(...)) -> OcrResponse:
    if file.content_type is not None and not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": {"code": "INVALID_IMAGE", "message": "Fichier non reconnu comme une image."}},
        )

    body = await file.read()
    if len(body) > _MAX_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": {"code": "IMAGE_TOO_LARGE", "message": "Image trop volumineuse (5 Mo max)."}},
        )
    if not body:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": {"code": "EMPTY_IMAGE", "message": "Fichier vide."}},
        )

    try:
        result = extract_text(body)
    except UnreadableImageError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": {"code": "INVALID_IMAGE", "message": str(exc)}},
        ) from exc

    logger.info("ocr_route chars=%s degraded=%s", len(result.text), result.degraded)
    return result
