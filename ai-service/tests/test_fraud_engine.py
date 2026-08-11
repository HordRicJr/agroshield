"""Tests unitaires Risk Engine + règles (sans modèle HF)."""

from app.schemas.fraud import ModelCategory, Signal, SignalType
from app.services.fraud.risk_engine import compute_risk, score_to_risk_level
from app.services.fraud.rules import apply_fraud_rules


def test_score_bands():
    assert score_to_risk_level(0).value == "LOW"
    assert score_to_risk_level(24).value == "LOW"
    assert score_to_risk_level(25).value == "MEDIUM"
    assert score_to_risk_level(50).value == "HIGH"
    assert score_to_risk_level(75).value == "CRITICAL"


def test_rules_scenario_b_beneficiary_urgency():
    text = (
        "URGENT. Le compte de paiement a changé. "
        "Envoyez immédiatement les fonds sur ce nouveau compte."
    )
    signals = apply_fraud_rules(text)
    types = {s.type for s in signals}
    assert SignalType.URGENCY in types
    assert SignalType.FINANCIAL_REQUEST in types
    assert SignalType.BENEFICIARY_CHANGE in types


def test_rules_scenario_c_credentials_url():
    text = (
        "Votre compte sera supprimé dans 10 minutes. "
        "Cliquez ici http://bit.ly/abc et entrez votre mot de passe et votre code OTP."
    )
    signals = apply_fraud_rules(text)
    types = {s.type for s in signals}
    assert SignalType.URGENCY in types
    assert SignalType.CREDENTIAL_HARVEST in types
    assert SignalType.SUSPICIOUS_URL in types


def test_rules_legitimate_low_signals():
    text = "Bonjour, voici le rapport de production de la coopérative pour cette semaine."
    signals = apply_fraud_rules(text)
    assert all(s.type != SignalType.CREDENTIAL_HARVEST for s in signals)
    assert all(s.type != SignalType.BENEFICIARY_CHANGE for s in signals)


def test_risk_engine_critical_on_credential_harvest():
    cats = [
        ModelCategory(label="vol d'identifiants", score=0.8),
        ModelCategory(label="demande légitime", score=0.1),
    ]
    signals = [
        Signal(type=SignalType.CREDENTIAL_HARVEST, weight=25, label="OTP"),
        Signal(type=SignalType.URGENCY, weight=20, label="urgent"),
    ]
    result = compute_risk(cats, signals)
    assert 0 <= result.score <= 100
    assert result.score >= 75
    assert result.risk_level.value == "CRITICAL"
    assert 0.0 <= result.confidence <= 1.0


def test_risk_engine_low_when_legit():
    cats = [
        ModelCategory(label="demande légitime", score=0.9),
        ModelCategory(label="phishing", score=0.05),
    ]
    result = compute_risk(cats, [])
    assert result.score <= 24
    assert result.risk_level.value == "LOW"


def test_risk_engine_low_without_signals_even_if_model_is_noisy():
    """Régression : un message bénin (« Bonjour », un lien légitime...) sans
    aucun signal de règle ne doit jamais dépasser LOW, même si le zero-shot
    (bruyant sur les textes courts) donne un score de suspicion élevé et un
    score « légitime » faible — les règles décident, l'IA n'invente pas un
    risque à elle seule."""
    cats = [
        ModelCategory(label="demande suspecte", score=0.94),
        ModelCategory(label="phishing", score=0.83),
        ModelCategory(label="demande légitime", score=0.18),
    ]
    result = compute_risk(cats, [])
    assert result.score <= 24
    assert result.risk_level.value == "LOW"
