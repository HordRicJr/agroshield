"""Contrat d'API — extraction de texte depuis une image (capture d'écran)."""

from pydantic import BaseModel, Field


class OcrResponse(BaseModel):
    text: str = Field(default="", description="Texte lu dans l'image (peut être vide).")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confiance moyenne OCR.")
    degraded: bool = Field(
        default=False, description="True si le moteur OCR n'a pas pu être utilisé."
    )
