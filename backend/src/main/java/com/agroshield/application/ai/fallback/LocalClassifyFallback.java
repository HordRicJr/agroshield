package com.agroshield.application.ai.fallback;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import org.springframework.stereotype.Component;

import com.agroshield.infrastructure.ai.dto.ClassifyRequest;
import com.agroshield.infrastructure.ai.dto.ClassifyResponse;
import com.agroshield.infrastructure.ai.dto.ColumnClassification;
import com.agroshield.infrastructure.ai.dto.ColumnInput;
import com.agroshield.infrastructure.ai.dto.DataCategory;
import com.agroshield.infrastructure.ai.dto.Method;
import com.agroshield.infrastructure.ai.dto.RecommendedPolicy;
import com.agroshield.infrastructure.ai.dto.RiskLevel;

/**
 * Fallback local (règles sur noms de colonnes uniquement) si l'IA est indisponible.
 * Jamais d'analyse du contenu des samples — privacy.
 */
@Component
public class LocalClassifyFallback {

    private record Hint(String[] keys, DataCategory category, RiskLevel risk) {
    }

    private static final List<Hint> HINTS = List.of(
            new Hint(new String[]{"tel", "phone", "mobile", "whatsapp"}, DataCategory.PERSONAL_SENSITIVE, RiskLevel.HIGH),
            new Hint(new String[]{"iban", "rib", "compte", "bank"}, DataCategory.FINANCIAL_SENSITIVE, RiskLevel.CRITICAL),
            new Hint(new String[]{"montant", "prix", "amount", "fcfa", "xof"}, DataCategory.FINANCIAL, RiskLevel.MEDIUM),
            new Hint(new String[]{"lat", "lon", "gps", "coord", "localisation"}, DataCategory.LOCATION, RiskLevel.HIGH),
            new Hint(new String[]{"email", "mail", "nom", "prenom", "name"}, DataCategory.PERSONAL, RiskLevel.MEDIUM),
            new Hint(new String[]{"culture", "parcelle", "superficie", "rendement", "hectare"}, DataCategory.AGRICULTURAL, RiskLevel.LOW)
    );

    public ClassifyResponse classify(ClassifyRequest request) {
        List<ColumnClassification> results = new ArrayList<>();
        for (ColumnInput col : request.columns()) {
            var hint = hint(col.name());
            results.add(new ColumnClassification(
                    col.name(),
                    hint.category(),
                    hint.category() == DataCategory.UNKNOWN ? 0.40 : 0.60,
                    Method.RULE,
                    hint.risk(),
                    List.of("Fallback local Spring — IA indisponible ; heuristique sur le nom de colonne uniquement."),
                    policyFor(hint.category())
            ));
        }
        return new ClassifyResponse(results, true);
    }

    private static Hint hint(String name) {
        String lower = name == null ? "" : name.toLowerCase(Locale.ROOT);
        for (Hint h : HINTS) {
            for (String key : h.keys()) {
                if (lower.contains(key)) {
                    return h;
                }
            }
        }
        return new Hint(new String[0], DataCategory.UNKNOWN, RiskLevel.LOW);
    }

    private static RecommendedPolicy policyFor(DataCategory category) {
        return switch (category) {
            case PERSONAL_SENSITIVE, FINANCIAL_SENSITIVE, LOCATION, PERSONAL ->
                    new RecommendedPolicy(true, true);
            case FINANCIAL -> new RecommendedPolicy(true, false);
            case AGRICULTURAL, UNKNOWN -> new RecommendedPolicy(false, false);
        };
    }
}
