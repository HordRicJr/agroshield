"""Health checks — publics (sans X-Internal-Token)."""

from fastapi import APIRouter, Response, status

from app import __version__
from app.models.registry import registry
from app.schemas import HealthResponse, ReadyResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    """Liveness — répond immédiatement, indépendamment des modèles."""
    return HealthResponse(status="ok", version=__version__)


@router.get(
    "/health/ready",
    response_model=ReadyResponse,
    responses={503: {"description": "Modèles non chargés"}},
)
async def ready(response: Response) -> ReadyResponse:
    """Readiness — 200 seulement si le pipeline zero-shot est en mémoire."""
    loaded = registry.loaded and registry.zero_shot is not None
    payload = ReadyResponse(
        status="ready" if loaded else "not_ready",
        models_loaded=loaded,
        models_load_seconds=registry.load_seconds,
        model_id=registry.model_id,
        detail=(
            None
            if loaded
            else "Pipeline zero-shot non chargé en mémoire."
        ),
    )
    if not loaded:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    return payload
