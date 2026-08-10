"""Normalisation légère du message (sans traduction systématique)."""

from __future__ import annotations

import re
import unicodedata


_WS_RE = re.compile(r"\s+")


def normalize_text(text: str) -> str:
    """NFC + espaces compressés. Ne journalise jamais le texte."""
    cleaned = unicodedata.normalize("NFC", text or "")
    cleaned = cleaned.replace("\x00", "")
    return _WS_RE.sub(" ", cleaned).strip()
