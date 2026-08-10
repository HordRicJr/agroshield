"""Tests contrat analyze-message — modèle mocké (pas d'Internet)."""

from unittest.mock import AsyncMock, patch

from app.models.registry import registry
from app.schemas.fraud import ModelCategory


def _mock_ready():
    registry.loaded = True
    registry.zero_shot = object()


def test_analyze_requires_token(client):
    r = client.post(
        "/ai/analyze-message",
        json={"content": "test message", "channel": "SMS"},
    )
    assert r.status_code == 401


def test_analyze_503_when_model_not_loaded(client, token):
    registry.loaded = False
    registry.zero_shot = None
    r = client.post(
        "/ai/analyze-message",
        json={"content": "Bonjour rapport coopérative", "channel": "EMAIL"},
        headers={"X-Internal-Token": token},
    )
    assert r.status_code == 503
    assert r.json()["error"]["code"] == "MODEL_NOT_READY"


def test_analyze_scenario_a_legitimate(client, token):
    _mock_ready()
    cats = [
        ModelCategory(label="demande légitime", score=0.88),
        ModelCategory(label="phishing", score=0.05),
        ModelCategory(label="fraude au paiement", score=0.04),
        ModelCategory(label="vol d'identifiants", score=0.02),
        ModelCategory(label="usurpation d'identité", score=0.01),
        ModelCategory(label="demande suspecte", score=0.03),
    ]
    with patch(
        "app.services.fraud.service.predict_categories",
        new=AsyncMock(return_value=cats),
    ):
        r = client.post(
            "/ai/analyze-message",
            json={
                "content": (
                    "Bonjour, voici le rapport de production de la "
                    "coopérative pour cette semaine."
                ),
                "channel": "EMAIL",
                "language": "fr",
            },
            headers={"X-Internal-Token": token},
        )
    assert r.status_code == 200
    body = r.json()
    assert body.get("stub") is not True
    assert body["risk_level"] in ("LOW", "MEDIUM")
    assert body["score"] < 50
    assert 0.0 <= body["confidence"] <= 1.0
    assert isinstance(body["score"], int)


def test_analyze_scenario_b_payment_fraud(client, token):
    _mock_ready()
    cats = [
        ModelCategory(label="fraude au paiement", score=0.82),
        ModelCategory(label="demande légitime", score=0.08),
        ModelCategory(label="phishing", score=0.4),
        ModelCategory(label="vol d'identifiants", score=0.1),
        ModelCategory(label="usurpation d'identité", score=0.2),
        ModelCategory(label="demande suspecte", score=0.5),
    ]
    with patch(
        "app.services.fraud.service.predict_categories",
        new=AsyncMock(return_value=cats),
    ):
        r = client.post(
            "/ai/analyze-message",
            json={
                "content": (
                    "URGENT. Le compte de paiement a changé. "
                    "Envoyez immédiatement les fonds sur ce nouveau compte."
                ),
                "channel": "WHATSAPP",
                "language": "fr",
            },
            headers={"X-Internal-Token": token},
        )
    assert r.status_code == 200
    body = r.json()
    assert body["score"] >= 50
    assert body["risk_level"] in ("HIGH", "CRITICAL")
    types = {s["type"] for s in body["signals"]}
    assert "URGENCY" in types
    assert "BENEFICIARY_CHANGE" in types
    assert "FINANCIAL_REQUEST" in types


def test_analyze_scenario_c_credentials(client, token):
    _mock_ready()
    cats = [
        ModelCategory(label="vol d'identifiants", score=0.85),
        ModelCategory(label="phishing", score=0.7),
        ModelCategory(label="demande légitime", score=0.05),
        ModelCategory(label="fraude au paiement", score=0.1),
        ModelCategory(label="usurpation d'identité", score=0.3),
        ModelCategory(label="demande suspecte", score=0.6),
    ]
    with patch(
        "app.services.fraud.service.predict_categories",
        new=AsyncMock(return_value=cats),
    ):
        r = client.post(
            "/ai/analyze-message",
            json={
                "content": (
                    "Votre compte sera supprimé dans 10 minutes. "
                    "Cliquez ici https://bit.ly/x et entrez votre mot de passe "
                    "et votre code OTP."
                ),
                "channel": "SMS",
                "language": "fr",
            },
            headers={"X-Internal-Token": token},
        )
    assert r.status_code == 200
    body = r.json()
    assert body["score"] >= 75
    assert body["risk_level"] == "CRITICAL"
    types = {s["type"] for s in body["signals"]}
    assert "CREDENTIAL_HARVEST" in types
    assert "SUSPICIOUS_URL" in types


def test_analyze_empty_rejected(client, token):
    r = client.post(
        "/ai/analyze-message",
        json={"content": "", "channel": "SMS"},
        headers={"X-Internal-Token": token},
    )
    assert r.status_code == 422
