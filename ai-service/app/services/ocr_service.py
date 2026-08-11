"""Extraction de texte depuis une image (OCR Tesseract) — capture d'écran de SMS/WhatsApp."""

from __future__ import annotations

import io
import logging

import pytesseract
from PIL import Image, UnidentifiedImageError

from app.config import get_settings
from app.schemas.ocr import OcrResponse

logger = logging.getLogger(__name__)

_LANGS = "fra+eng"


class UnreadableImageError(Exception):
    """Image illisible (format non supporté ou fichier corrompu)."""


def extract_text(image_bytes: bytes) -> OcrResponse:
    settings = get_settings()
    pytesseract.pytesseract.tesseract_cmd = settings.tesseract_cmd
    config = f"--tessdata-dir {settings.tessdata_dir.resolve().as_posix()}"

    try:
        image = Image.open(io.BytesIO(image_bytes))
        image.load()
    except UnidentifiedImageError as exc:
        raise UnreadableImageError("Format d'image non reconnu") from exc

    try:
        data = pytesseract.image_to_data(
            image, lang=_LANGS, config=config, output_type=pytesseract.Output.DICT
        )
    except pytesseract.TesseractNotFoundError as exc:
        logger.error("ocr_tesseract_not_found path=%s", settings.tesseract_cmd)
        return OcrResponse(text="", confidence=0.0, degraded=True)
    except Exception:
        logger.exception("ocr_extraction_failed")
        return OcrResponse(text="", confidence=0.0, degraded=True)

    words: list[str] = []
    confidences: list[float] = []
    for word, conf in zip(data.get("text", []), data.get("conf", [])):
        word = word.strip()
        if not word:
            continue
        words.append(word)
        try:
            conf_value = float(conf)
        except (TypeError, ValueError):
            continue
        if conf_value >= 0:
            confidences.append(conf_value)

    text = " ".join(words)
    avg_confidence = (sum(confidences) / len(confidences) / 100.0) if confidences else 0.0

    logger.info("ocr_extracted chars=%s words=%s confidence=%.2f", len(text), len(words), avg_confidence)
    return OcrResponse(text=text, confidence=round(avg_confidence, 4), degraded=False)
