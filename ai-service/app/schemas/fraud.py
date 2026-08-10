"""Contrat d'API — analyse fraude / phishing."""

from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.classify import RiskLevel


class Channel(str, Enum):
    SMS = "SMS"
    EMAIL = "EMAIL"
    WHATSAPP = "WHATSAPP"
    OTHER = "OTHER"


class Language(str, Enum):
    FR = "fr"
    EN = "en"
    AUTO = "auto"


class SignalType(str, Enum):
    URGENCY = "URGENCY"
    FINANCIAL_REQUEST = "FINANCIAL_REQUEST"
    BENEFICIARY_CHANGE = "BENEFICIARY_CHANGE"
    CREDENTIAL_HARVEST = "CREDENTIAL_HARVEST"
    SUSPICIOUS_URL = "SUSPICIOUS_URL"
    IMPERSONATION = "IMPERSONATION"
    PRESSURE = "PRESSURE"
    OTHER = "OTHER"


class AnalyzeMessageRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=10_000)
    channel: Channel = Channel.OTHER
    language: Language = Language.AUTO


class Signal(BaseModel):
    type: SignalType
    weight: int = Field(..., ge=0, le=100)
    label: str


class ModelCategory(BaseModel):
    label: str
    score: float = Field(..., ge=0.0, le=1.0)


class AnalyzeMessageResponse(BaseModel):
    risk_level: RiskLevel
    score: int = Field(..., ge=0, le=100, description="Score de risque estimé 0–100")
    signals: list[Signal] = Field(default_factory=list)
    model_categories: list[ModelCategory] = Field(default_factory=list)
    recommendation: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    stub: Literal[True] | None = None
