"""Classification de colonnes — stub déterministe (Phase 1)."""

import hashlib

from app.schemas.classify import (
    ClassifyRequest,
    ClassifyResponse,
    ColumnClassification,
    DataCategory,
    Method,
    RecommendedPolicy,
    RiskLevel,
)

# Heuristique légère sur le nom de colonne uniquement (pas sur samples — privacy).
_NAME_HINTS: list[tuple[tuple[str, ...], DataCategory, RiskLevel]] = [
    (("tel", "phone", "mobile", "whatsapp"), DataCategory.PERSONAL_SENSITIVE, RiskLevel.HIGH),
    (("iban", "rib", "compte", "bank"), DataCategory.FINANCIAL_SENSITIVE, RiskLevel.CRITICAL),
    (("montant", "prix", "amount", "fcfa", "xof"), DataCategory.FINANCIAL, RiskLevel.MEDIUM),
    (("lat", "lon", "gps", "coord", "localisation"), DataCategory.LOCATION, RiskLevel.HIGH),
    (("email", "mail", "nom", "prenom", "name"), DataCategory.PERSONAL, RiskLevel.MEDIUM),
    (("culture", "parcelle", "superficie", "rendement", "hectare"), DataCategory.AGRICULTURAL, RiskLevel.LOW),
]

_POLICY = {
    DataCategory.PERSONAL_SENSITIVE: RecommendedPolicy(encrypt_at_rest=True, mask_by_default=True),
    DataCategory.FINANCIAL_SENSITIVE: RecommendedPolicy(encrypt_at_rest=True, mask_by_default=True),
    DataCategory.LOCATION: RecommendedPolicy(encrypt_at_rest=True, mask_by_default=True),
    DataCategory.PERSONAL: RecommendedPolicy(encrypt_at_rest=True, mask_by_default=True),
    DataCategory.FINANCIAL: RecommendedPolicy(encrypt_at_rest=True, mask_by_default=False),
    DataCategory.AGRICULTURAL: RecommendedPolicy(encrypt_at_rest=False, mask_by_default=False),
    DataCategory.UNKNOWN: RecommendedPolicy(encrypt_at_rest=False, mask_by_default=False),
}


def _hint(name: str) -> tuple[DataCategory, RiskLevel]:
    lower = name.lower()
    for keys, cat, risk in _NAME_HINTS:
        if any(k in lower for k in keys):
            return cat, risk
    # Déterministe mais "inconnu" si pas de hint
    digest = int(hashlib.sha256(name.encode()).hexdigest()[:4], 16)
    if digest % 7 == 0:
        return DataCategory.UNKNOWN, RiskLevel.LOW
    return DataCategory.UNKNOWN, RiskLevel.LOW


def classify_columns(request: ClassifyRequest) -> ClassifyResponse:
    results: list[ColumnClassification] = []
    for col in request.columns:
        category, risk = _hint(col.name)
        n = len(col.samples)
        results.append(
            ColumnClassification(
                column=col.name,
                classification=category,
                confidence=0.55 if category == DataCategory.UNKNOWN else 0.72,
                method=Method.RULE,
                risk_level=risk,
                evidence=[
                    f"Stub Phase 1 — classification provisoire sur le nom de colonne "
                    f"« {col.name} » ({n} échantillon(s) reçus, contenu non analysé)."
                ],
                recommended_policy=_POLICY[category],
            )
        )
    return ClassifyResponse(results=results, stub=True)
