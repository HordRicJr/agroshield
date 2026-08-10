"""Authentification inter-services par jeton partagé."""

import hmac
import logging

from fastapi import Header, HTTPException, status

from app.config import get_settings

logger = logging.getLogger(__name__)


async def verify_internal_token(
    x_internal_token: str | None = Header(default=None, alias="X-Internal-Token"),
) -> None:
    """Vérifie X-Internal-Token en temps constant.

    Ne journalise jamais la valeur du jeton — uniquement le résultat.
    """
    settings = get_settings()
    expected = settings.internal_token.encode("utf-8")
    provided = (x_internal_token or "").encode("utf-8")

    if not x_internal_token or not hmac.compare_digest(provided, expected):
        logger.warning("auth_failed reason=invalid_or_missing_token")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": {
                    "code": "UNAUTHORIZED",
                    "message": "Jeton inter-services invalide ou manquant.",
                    "details": {"header": "X-Internal-Token"},
                }
            },
        )
