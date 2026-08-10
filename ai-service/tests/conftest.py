"""Fixtures de test — token interne partagé ; pas de téléchargement HF."""

import os

import pytest
from fastapi.testclient import TestClient

# Avant tout import app : token + skip du modèle réel.
os.environ.setdefault("INTERNAL_TOKEN", "test-internal-token")
os.environ["SKIP_MODEL_LOAD"] = "true"


@pytest.fixture
def token() -> str:
    return "test-internal-token"


@pytest.fixture
def client() -> TestClient:
    from app.config import get_settings
    from app.models.registry import registry

    get_settings.cache_clear()
    os.environ["INTERNAL_TOKEN"] = "test-internal-token"
    os.environ["SKIP_MODEL_LOAD"] = "true"

    # État propre entre tests.
    registry.zero_shot = None
    registry.loaded = False
    registry.load_seconds = None
    registry.warmup_seconds = None
    registry.model_id = None

    from app.main import app

    with TestClient(app) as c:
        yield c

    registry.zero_shot = None
    registry.loaded = False
