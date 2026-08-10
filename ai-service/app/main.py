"""Point d'entrée FastAPI — AgroShield AI Service."""

import logging
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app import __version__
from app.models.loader import load_models
from app.routers import anomaly, classify, fraud, health

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    logger.info("startup version=%s phase=2", __version__)
    # Chargement unique — jamais dans une route.
    load_models()
    yield
    logger.info("shutdown")


app = FastAPI(
    title="AgroShield AI Service",
    description=(
        "Microservice IA autonome pour AgroShield AI.\n\n"
        "## Capacités\n"
        "1. **Classification de données** — `POST /ai/classify-data`\n"
        "2. **Analyse fraude / phishing** — `POST /ai/analyze-message`\n"
        "3. **Anomalies comportementales** — `POST /ai/detect-anomaly` "
        "et `POST /ai/anomaly/train`\n\n"
        "## Authentification\n"
        "En-tête `X-Internal-Token` (sauf `/health` et `/health/ready`).\n\n"
        "## Modèle\n"
        "Un seul transformer : `MoritzLaurer/multilingual-MiniLMv2-L6-mnli-xnli` "
        "(zero-shot, CPU), chargé au démarrage. `/health/ready` → 200 si en mémoire.\n\n"
        "## Phase courante\n"
        "Fraud Guard (`POST /ai/analyze-message`) : inférence hybride réelle "
        "(règles + MiniLM + risk engine). Classification et anomalies restent "
        "en stub jusqu'aux phases suivantes. `stub: true` uniquement si stub."
    ),
    version=__version__,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)


def _error_payload(code: str, message: str, details: dict[str, Any] | None = None) -> dict:
    return {"error": {"code": code, "message": message, "details": details or {}}}


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(_request: Request, exc: StarletteHTTPException):
    if isinstance(exc.detail, dict) and "error" in exc.detail:
        return JSONResponse(status_code=exc.status_code, content=exc.detail)
    return JSONResponse(
        status_code=exc.status_code,
        content=_error_payload("HTTP_ERROR", str(exc.detail)),
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_request: Request, exc: RequestValidationError):
    # Pas de valeurs utilisateur brutes dans details si possible — on garde les loc/msg.
    safe_errors = [
        {"loc": list(err.get("loc", [])), "msg": err.get("msg"), "type": err.get("type")}
        for err in exc.errors()
    ]
    return JSONResponse(
        status_code=422,
        content=_error_payload(
            "VALIDATION_ERROR",
            "Requête invalide — vérifier le contrat d'API.",
            {"errors": safe_errors},
        ),
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(_request: Request, exc: Exception):
    logger.exception("unhandled_error type=%s", type(exc).__name__)
    return JSONResponse(
        status_code=500,
        content=_error_payload(
            "INTERNAL_ERROR",
            "Erreur interne du service IA.",
            {"exception_type": type(exc).__name__},
        ),
    )


app.include_router(health.router)
app.include_router(classify.router)
app.include_router(fraud.router)
app.include_router(anomaly.router)
