package com.agroshield.application.ai.fallback;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import org.springframework.stereotype.Component;

import com.agroshield.infrastructure.ai.dto.AnalyzeMessageRequest;
import com.agroshield.infrastructure.ai.dto.AnalyzeMessageResponse;
import com.agroshield.infrastructure.ai.dto.ModelCategory;
import com.agroshield.infrastructure.ai.dto.RiskLevel;
import com.agroshield.infrastructure.ai.dto.Signal;
import com.agroshield.infrastructure.ai.dto.SignalType;

/**
 * Fallback fraude local (règles lexicales) si l'IA est down.
 * Vocabulaire : risque estimé — jamais de certitude d'arnaque.
 */
@Component
public class LocalFraudFallback {

    public AnalyzeMessageResponse analyze(AnalyzeMessageRequest request) {
        String text = request.content() == null ? "" : request.content().toLowerCase(Locale.ROOT);
        List<Signal> signals = new ArrayList<>();
        int score = 8;

        if (containsAny(text, "urgent", "immédiat", "immédiatement", "asap", "maintenant")) {
            signals.add(new Signal(SignalType.URGENCY, 18, "Urgence lexicale (fallback local)"));
            score += 18;
        }
        if (containsAny(text, "iban", "virement", "paiement", "fonds", "argent", "fcfa")) {
            signals.add(new Signal(SignalType.FINANCIAL_REQUEST, 22, "Demande financière (fallback local)"));
            score += 22;
        }
        if (containsAny(text, "nouveau compte", "changement de compte", "bénéficiaire", "rib")) {
            signals.add(new Signal(SignalType.BENEFICIARY_CHANGE, 28, "Changement bénéficiaire (fallback local)"));
            score += 28;
        }
        if (containsAny(text, "mot de passe", "password", "otp", "code secret", "identifiants")) {
            signals.add(new Signal(SignalType.CREDENTIAL_HARVEST, 35, "Récolte d'identifiants (fallback local)"));
            score += 35;
        }
        if (containsAny(text, "http://", "https://", "bit.ly", "tinyurl")) {
            signals.add(new Signal(SignalType.SUSPICIOUS_URL, 15, "URL détectée (fallback local)"));
            score += 15;
        }

        score = Math.min(100, score);
        RiskLevel level = riskFromScore(score);
        if (signals.isEmpty()) {
            signals.add(new Signal(SignalType.OTHER, 5, "Aucun signal fort (fallback local)"));
        }

        return new AnalyzeMessageResponse(
                level,
                score,
                signals,
                List.of(new ModelCategory("fallback_rules", score / 100.0)),
                "Analyse dégradée (IA indisponible) — risque estimé par règles locales uniquement.",
                0.35,
                true
        );
    }

    private static boolean containsAny(String text, String... needles) {
        for (String n : needles) {
            if (text.contains(n)) {
                return true;
            }
        }
        return false;
    }

    private static RiskLevel riskFromScore(int score) {
        if (score >= 75) {
            return RiskLevel.CRITICAL;
        }
        if (score >= 50) {
            return RiskLevel.HIGH;
        }
        if (score >= 25) {
            return RiskLevel.MEDIUM;
        }
        return RiskLevel.LOW;
    }
}
