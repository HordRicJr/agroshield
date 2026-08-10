"""Risk Engine fraude — combinaison déterministe modèle + règles."""

from __future__ import annotations

from dataclasses import dataclass

from app.schemas.classify import RiskLevel
from app.schemas.fraud import ModelCategory, Signal, SignalType

# Catégories sémantiques « suspectes » (vs légitime).
_SUSPICIOUS_LABELS = {
    "phishing",
    "fraude au paiement",
    "vol d'identifiants",
    "usurpation d'identité",
    "demande suspecte",
    "arnaque",
}

_LEGIT_LABEL = "demande légitime"

_CRITICAL_TYPES = {
    SignalType.CREDENTIAL_HARVEST,
    SignalType.BENEFICIARY_CHANGE,
}


@dataclass(frozen=True)
class RiskResult:
    score: int
    risk_level: RiskLevel
    confidence: float
    recommendation: str


def score_to_risk_level(score: int) -> RiskLevel:
    if score >= 75:
        return RiskLevel.CRITICAL
    if score >= 50:
        return RiskLevel.HIGH
    if score >= 25:
        return RiskLevel.MEDIUM
    return RiskLevel.LOW


def compute_risk(
    model_categories: list[ModelCategory],
    signals: list[Signal],
) -> RiskResult:
    """
    Formule documentée (déterministe) :

    model_component = round(max(scores_suspects) * 100)   # 0–100
        — si top label == légitime et score >= 0.55 : model_component *= 0.35

    rule_component  = min(100, sum(weights))              # 0–100

    final_score = clamp(0,100, round(0.45 * model + 0.55 * rules))

    Majoration critique : si CREDENTIAL_HARVEST ou
    (BENEFICIARY_CHANGE + FINANCIAL_REQUEST) → max(final, 75)

    confidence = 0.35 + 0.4*|top-0.5|*2 + 0.25*min(1, n_signals/4)
    """
    by_label = {c.label: float(c.score) for c in model_categories}
    suspect_scores = [by_label[k] for k in _SUSPICIOUS_LABELS if k in by_label]
    model_component = int(round(max(suspect_scores) * 100)) if suspect_scores else 0

    legit = by_label.get(_LEGIT_LABEL, 0.0)
    top_label = max(by_label, key=by_label.get) if by_label else _LEGIT_LABEL
    top_score = by_label.get(top_label, 0.0)

    if top_label == _LEGIT_LABEL and legit >= 0.55:
        model_component = int(round(model_component * 0.35))

    rule_component = min(100, sum(s.weight for s in signals))
    final = int(round(0.45 * model_component + 0.55 * rule_component))
    final = max(0, min(100, final))

    types = {s.type for s in signals}
    has_fin = SignalType.FINANCIAL_REQUEST in types
    has_ben = SignalType.BENEFICIARY_CHANGE in types
    if SignalType.CREDENTIAL_HARVEST in types or (has_fin and has_ben):
        final = max(final, 75)

    # Si très peu de signaux et légitime fort → plafonner
    if not signals and legit >= 0.65:
        final = min(final, 20)

    risk = score_to_risk_level(final)
    confidence = 0.35 + 0.4 * abs(top_score - 0.5) * 2 + 0.25 * min(1.0, len(signals) / 4.0)
    confidence = max(0.0, min(1.0, round(confidence, 3)))

    recommendation = _recommendation(risk)
    return RiskResult(
        score=final,
        risk_level=risk,
        confidence=confidence,
        recommendation=recommendation,
    )


def _recommendation(risk: RiskLevel) -> str:
    if risk == RiskLevel.CRITICAL:
        return (
            "Risque estimé critique. Ne pas effectuer de paiement ni communiquer "
            "d'identifiants. Vérifier le destinataire par un autre canal sécurisé "
            "et alerter le responsable sécurité."
        )
    if risk == RiskLevel.HIGH:
        return (
            "Risque estimé élevé. Ne pas effectuer le paiement. Vérifier le "
            "bénéficiaire et l'expéditeur par un canal indépendant avant toute action."
        )
    if risk == RiskLevel.MEDIUM:
        return (
            "Risque estimé moyen. Signaux suspects détectés — vérifier l'origine "
            "du message avant toute opération sensible."
        )
    return (
        "Risque estimé faible. Aucun signal critique détecté par l'analyse "
        "automatique — rester vigilant."
    )
