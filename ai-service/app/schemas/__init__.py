"""Schémas communs — erreurs et health."""

from typing import Any

from pydantic import BaseModel, Field


class ErrorBody(BaseModel):
    code: str
    message: str
    details: dict[str, Any] = Field(default_factory=dict)


class ErrorResponse(BaseModel):
    error: ErrorBody


class HealthResponse(BaseModel):
    status: str = "ok"
    service: str = "agroshield-ai-service"
    version: str


class ReadyResponse(BaseModel):
    status: str
    models_loaded: bool
    models_load_seconds: float | None = None
    model_id: str | None = None
    detail: str | None = None
