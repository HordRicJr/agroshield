"""Tests Phase 2 — chargement modèle (mock) et readiness."""

from unittest.mock import MagicMock, patch

from app.config import get_settings
from app.models.loader import load_models
from app.models.registry import registry


def test_ready_503_when_not_loaded(client):
    r = client.get("/health/ready")
    assert r.status_code == 503
    body = r.json()
    assert body["models_loaded"] is False
    assert body["status"] == "not_ready"


def test_ready_200_when_registry_loaded(client):
    registry.zero_shot = object()  # sentinel non-None
    registry.loaded = True
    registry.load_seconds = 12.5
    registry.model_id = "MoritzLaurer/multilingual-MiniLMv2-L6-mnli-xnli"

    r = client.get("/health/ready")
    assert r.status_code == 200
    body = r.json()
    assert body["models_loaded"] is True
    assert body["status"] == "ready"
    assert body["models_load_seconds"] == 12.5
    assert body["model_id"] == "MoritzLaurer/multilingual-MiniLMv2-L6-mnli-xnli"


def test_load_models_skip_flag(monkeypatch):
    monkeypatch.setenv("SKIP_MODEL_LOAD", "true")
    get_settings.cache_clear()
    registry.loaded = True  # doit être remis à False

    load_models()

    assert registry.loaded is False
    assert registry.zero_shot is None
    get_settings.cache_clear()


def test_load_models_warmup_and_registry(monkeypatch):
    monkeypatch.setenv("SKIP_MODEL_LOAD", "false")
    monkeypatch.setenv(
        "HF_MODEL_ID", "MoritzLaurer/multilingual-MiniLMv2-L6-mnli-xnli"
    )
    get_settings.cache_clear()

    fake_pipe = MagicMock(return_value={"labels": ["agriculture"], "scores": [0.9]})

    with patch("app.models.loader._build_zero_shot_pipeline", return_value=fake_pipe):
        load_models()

    assert registry.loaded is True
    assert registry.zero_shot is fake_pipe
    assert registry.model_id == "MoritzLaurer/multilingual-MiniLMv2-L6-mnli-xnli"
    assert registry.load_seconds is not None
    assert registry.warmup_seconds is not None
    fake_pipe.assert_called_once()
    get_settings.cache_clear()


def test_zero_shot_runs_in_threadpool():
    import asyncio

    from app.models import inference

    called = {}

    def fake_sync(text, candidate_labels, multi_label=False):
        called["text_len"] = len(text)
        return {"labels": candidate_labels, "scores": [0.8] * len(candidate_labels)}

    registry.loaded = True
    registry.zero_shot = object()

    with patch.object(inference, "zero_shot_sync", side_effect=fake_sync):
        result = asyncio.run(inference.zero_shot("abc", ["phishing", "légitime"]))

    assert called["text_len"] == 3
    assert result["labels"] == ["phishing", "légitime"]
    registry.loaded = False
    registry.zero_shot = None
