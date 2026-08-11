"""Règles déterministes de sécurité (FR / EN / Afrique de l'Ouest)."""

from __future__ import annotations

import re
from dataclasses import dataclass
from urllib.parse import urlparse

from app.schemas.fraud import Signal, SignalType

# Domaines raccourcisseurs / TLD à risque (liste MVP, non exhaustive).
_SHORTENERS = {
    "bit.ly",
    "tinyurl.com",
    "t.co",
    "goo.gl",
    "ow.ly",
    "is.gd",
    "buff.ly",
    "cutt.ly",
    "rebrand.ly",
}
_RISKY_TLDS = {".tk", ".ml", ".ga", ".cf", ".gq", ".zip", ".mov", ".top", ".xyz"}

_URL_RE = re.compile(r"https?://[^\s<>\"']+|www\.[^\s<>\"']+", re.IGNORECASE)
_IP_HOST_RE = re.compile(r"^(?:\d{1,3}\.){3}\d{1,3}$")


@dataclass(frozen=True)
class RuleHit:
    signal_type: SignalType
    weight: int
    label: str


def _has_any(text_lower: str, patterns: list[str]) -> bool:
    return any(p in text_lower for p in patterns)


def apply_fraud_rules(text: str) -> list[Signal]:
    """Retourne les signaux déclenchés — jamais le contenu brut."""
    lower = text.lower()
    hits: list[RuleHit] = []

    # 1–2 Urgence / pression temporelle
    urgency = [
        "urgent",
        "immédiatement",
        "immediatement",
        "tout de suite",
        "dans 10 minutes",
        "dans 5 minutes",
        "avant minuit",
        "act now",
        "immediately",
        "right now",
        "asap",
        "dernière chance",
        "derniere chance",
        "compte sera supprimé",
        "compte sera supprime",
        "account will be deleted",
        "suspendu",
        "suspended",
    ]
    if _has_any(lower, urgency):
        hits.append(
            RuleHit(
                SignalType.URGENCY,
                20,
                "Le message impose une action dans un délai très court (risque estimé).",
            )
        )
        hits.append(
            RuleHit(
                SignalType.PRESSURE,
                10,
                "Formulation de pression temporelle détectée.",
            )
        )

    # 3 Demande de paiement / fonds
    payment = [
        "paiement",
        "payez",
        "virement",
        "envoyez les fonds",
        "envoyer l'argent",
        "envoyer les fonds",
        "mobile money",
        "orange money",
        "moov money",
        "wave",
        "western union",
        "moneygram",
        "wire transfer",
        "send money",
        "send funds",
        "payment",
        "fcfa",
        "xof",
    ]
    if _has_any(lower, payment):
        hits.append(
            RuleHit(
                SignalType.FINANCIAL_REQUEST,
                20,
                "Demande financière ou d'envoi de fonds détectée.",
            )
        )

    # 4 Changement de bénéficiaire
    beneficiary = [
        "nouveau compte",
        "nouveau rib",
        "changer le compte",
        "changez le compte",
        "compte de paiement a changé",
        "compte de paiement a change",
        "bénéficiaire",
        "beneficiaire",
        "iban",
        "new account",
        "change the account",
        "updated bank details",
        "new bank details",
        "wire to this account",
    ]
    if _has_any(lower, beneficiary):
        hits.append(
            RuleHit(
                SignalType.BENEFICIARY_CHANGE,
                25,
                "Demande de changement de compte / bénéficiaire détectée.",
            )
        )

    # 5–6 Mot de passe / OTP / secrets
    credentials = [
        "mot de passe",
        "password",
        "mdp",
        "code otp",
        "otp",
        "code de vérification",
        "code de verification",
        "verification code",
        "pin",
        "secret",
        "identifiants",
        "login and password",
        "entrez votre mot de passe",
        "enter your password",
    ]
    if _has_any(lower, credentials):
        hits.append(
            RuleHit(
                SignalType.CREDENTIAL_HARVEST,
                25,
                "Demande d'identifiants, mot de passe ou code OTP détectée.",
            )
        )

    # 7–9 Liens / URL suspectes — un lien seul n'est pas un signal ; seuls les
    # marqueurs de risque réels (raccourcisseur, IP nue, extension à risque)
    # comptent. Un lien légitime (site connu, domaine de la coopérative...)
    # ne doit jamais être signalé.
    urls = _URL_RE.findall(text)
    if urls:
        for raw in urls:
            url = raw if "://" in raw else f"http://{raw}"
            try:
                host = (urlparse(url).hostname or "").lower()
            except Exception:
                host = ""
            if host in _SHORTENERS:
                hits.append(
                    RuleHit(
                        SignalType.SUSPICIOUS_URL,
                        15,
                        "Lien via un service de raccourcissement d'URL (risque estimé).",
                    )
                )
            if host and _IP_HOST_RE.match(host):
                hits.append(
                    RuleHit(
                        SignalType.SUSPICIOUS_URL,
                        20,
                        "Lien pointant vers une adresse IP nue.",
                    )
                )
            if any(host.endswith(tld) for tld in _RISKY_TLDS):
                hits.append(
                    RuleHit(
                        SignalType.SUSPICIOUS_URL,
                        15,
                        "Nom de domaine avec une extension à risque élevé.",
                    )
                )

    # 10 Usurpation
    impersonation = [
        "banque centrale",
        "votre banque",
        "support officiel",
        "service client officiel",
        "ministre",
        "coopérative officielle",
        "cooperative officielle",
        "we are your bank",
        "official support",
        "it department",
        "service informatique",
    ]
    if _has_any(lower, impersonation):
        hits.append(
            RuleHit(
                SignalType.IMPERSONATION,
                15,
                "Indices d'usurpation d'identité d'une organisation ou d'un service.",
            )
        )

    # Dédupliquer par (type, label) en gardant le poids max
    merged: dict[tuple[SignalType, str], int] = {}
    for h in hits:
        key = (h.signal_type, h.label)
        merged[key] = max(merged.get(key, 0), h.weight)

    return [
        Signal(type=t, weight=w, label=lbl) for (t, lbl), w in merged.items()
    ]
