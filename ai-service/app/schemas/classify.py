"""Contrat d'API — classification de colonnes agricoles."""

from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field, field_validator


class DataCategory(str, Enum):
    PERSONAL = "PERSONAL"
    PERSONAL_SENSITIVE = "PERSONAL_SENSITIVE"
    AGRICULTURAL = "AGRICULTURAL"
    FINANCIAL = "FINANCIAL"
    FINANCIAL_SENSITIVE = "FINANCIAL_SENSITIVE"
    LOCATION = "LOCATION"
    UNKNOWN = "UNKNOWN"


class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class Method(str, Enum):
    RULE = "RULE"
    MODEL = "MODEL"
    HYBRID = "HYBRID"


class ColumnInput(BaseModel):
    name: str = Field(..., min_length=1, max_length=256, description="Nom de colonne")
    samples: list[str] = Field(
        default_factory=list,
        max_length=50,
        description="Échantillons (max 50) — jamais journalisés",
    )

    @field_validator("samples")
    @classmethod
    def coerce_samples_to_str(cls, values: list) -> list[str]:
        return ["" if v is None else str(v) for v in values]


class ClassifyRequest(BaseModel):
    columns: list[ColumnInput] = Field(..., min_length=1, max_length=100)


class RecommendedPolicy(BaseModel):
    encrypt_at_rest: bool = False
    mask_by_default: bool = False


class ColumnClassification(BaseModel):
    column: str
    classification: DataCategory
    confidence: float = Field(..., ge=0.0, le=1.0)
    method: Method
    risk_level: RiskLevel
    evidence: list[str] = Field(default_factory=list)
    recommended_policy: RecommendedPolicy


class ClassifyResponse(BaseModel):
    results: list[ColumnClassification]
    stub: Literal[True] | None = Field(
        default=None,
        description="True uniquement en Phase 1 (réponses factices).",
    )
