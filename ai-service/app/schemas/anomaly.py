"""Contrat d'API — détection d'anomalies comportementales."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class FeatureVector(BaseModel):
    """Vecteur de caractéristiques comportementales (une observation)."""

    hour_of_day: int = Field(..., ge=0, le=23)
    export_count_24h: float = Field(..., ge=0)
    records_accessed: float = Field(..., ge=0)
    failed_logins_24h: float = Field(..., ge=0)
    is_new_device: bool
    is_unusual_location: bool
    actions_per_minute: float = Field(..., ge=0)
    sensitive_resource_ratio: float = Field(..., ge=0.0, le=1.0)


class DetectAnomalyRequest(BaseModel):
    organization_id: str = Field(..., min_length=1, max_length=128)
    user_id: str = Field(..., min_length=1, max_length=128)
    features: FeatureVector


class FeatureContribution(BaseModel):
    feature: str
    deviation: float = Field(
        ...,
        description=(
            "Écart normalisé vs moyenne org. Approximation assumée (pas SHAP)."
        ),
    )


class DetectAnomalyResponse(BaseModel):
    anomaly_score: float = Field(..., ge=0.0, le=1.0)
    is_anomaly: bool
    model_version: str | None = None
    feature_contributions: list[FeatureContribution] = Field(default_factory=list)
    baseline_available: bool
    confidence: float = Field(..., ge=0.0, le=1.0)
    stub: Literal[True] | None = None


class TrainAnomalyRequest(BaseModel):
    organization_id: str = Field(..., min_length=1, max_length=128)
    events: list[FeatureVector] = Field(
        ...,
        min_length=50,
        description="Lot historique — minimum 50 événements pour entraîner une baseline.",
    )


class TrainAnomalyResponse(BaseModel):
    organization_id: str
    model_version: str
    n_samples: int
    trained_at: datetime
    status: Literal["trained", "stub"]
    stub: Literal[True] | None = None
