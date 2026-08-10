"""Configuration via variables d'environnement (pydantic-settings)."""

from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Réglages runtime du service IA."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    internal_token: str = Field(
        default="dev-internal-token",
        alias="INTERNAL_TOKEN",
        description="Secret partagé inter-services (en-tête X-Internal-Token).",
    )
    port: int = Field(default=8000, alias="PORT")
    hf_home: Path = Field(default=Path("./.cache/huggingface"), alias="HF_HOME")
    models_dir: Path = Field(default=Path("./data/models"), alias="MODELS_DIR")
    demo_mode: bool = Field(default=False, alias="DEMO_MODE")
    hf_model_id: str = Field(
        default="MoritzLaurer/multilingual-MiniLMv2-L6-mnli-xnli",
        alias="HF_MODEL_ID",
    )
    # Alias documenté pour le Fraud Guard (même modèle unique).
    fraud_model_id: str | None = Field(default=None, alias="FRAUD_MODEL_ID")
    model_device: str = Field(default="cpu", alias="MODEL_DEVICE")
    model_max_length: int = Field(default=512, alias="MODEL_MAX_LENGTH")
    # True en tests unitaires : pas de téléchargement HF au lifespan.
    skip_model_load: bool = Field(default=False, alias="SKIP_MODEL_LOAD")

    def resolved_model_id(self) -> str:
        return self.fraud_model_id or self.hf_model_id


@lru_cache
def get_settings() -> Settings:
    return Settings()
