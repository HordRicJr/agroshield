"""Accès singleton aux modèles chargés (une seule fois au lifespan)."""

from typing import Any


class ModelRegistry:
    """Conteneur process-wide. Rempli uniquement par `load_models()` au démarrage."""

    def __init__(self) -> None:
        self.zero_shot: Any | None = None
        self.loaded: bool = False
        self.load_seconds: float | None = None
        self.model_id: str | None = None
        self.warmup_seconds: float | None = None


registry = ModelRegistry()
