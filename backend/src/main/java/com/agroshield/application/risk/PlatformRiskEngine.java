package com.agroshield.application.risk;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Component;

import com.agroshield.domain.risk.PlatformRiskDecision;
import com.agroshield.domain.risk.RecommendedAction;
import com.agroshield.domain.risk.RiskFactor;
import com.agroshield.infrastructure.ai.dto.AnalyzeMessageResponse;
import com.agroshield.infrastructure.ai.dto.Channel;
import com.agroshield.infrastructure.ai.dto.RiskLevel;
import com.agroshield.infrastructure.ai.dto.Signal;
import com.agroshield.infrastructure.ai.dto.SignalType;

/**
 * Risk Engine plateforme : l'IA conseille (score message) ; Spring décide
 * en enrichissant avec le contexte organisationnel / canal / mode dégradé.
 */
@Component
public class PlatformRiskEngine {

    public PlatformRiskDecision evaluate(
            AnalyzeMessageResponse ai,
            Channel channel,
            boolean degraded,
            long openIncidentsLast7Days) {
        List<RiskFactor> factors = new ArrayList<>();
        int aiScore = Math.max(0, Math.min(100, ai.score()));

        factors.add(new RiskFactor(
                "AI_MESSAGE_SCORE",
                "Score Fraud Guard (conseil IA) = " + aiScore,
                aiScore,
                "AI"));

        int adjustment = 0;

        if (degraded) {
            adjustment += 8;
            factors.add(new RiskFactor(
                    "DEGRADED_MODE",
                    "IA indisponible — fallback local, incertitude accrue",
                    8,
                    "CONTEXT"));
        }

        if (channel == Channel.WHATSAPP || channel == Channel.SMS) {
            adjustment += 5;
            factors.add(new RiskFactor(
                    "HIGH_RISK_CHANNEL",
                    "Canal " + channel.name() + " — surface d'ingénierie sociale élevée",
                    5,
                    "CONTEXT"));
        }

        if (openIncidentsLast7Days > 0) {
            int incidentBoost = (int) Math.min(12, openIncidentsLast7Days * 4);
            adjustment += incidentBoost;
            factors.add(new RiskFactor(
                    "RECENT_OPEN_INCIDENTS",
                    openIncidentsLast7Days + " incident(s) ouvert(s) sur 7 jours",
                    incidentBoost,
                    "CONTEXT"));
        }

        if (hasSignal(ai, SignalType.CREDENTIAL_HARVEST) || hasSignal(ai, SignalType.BENEFICIARY_CHANGE)) {
            int criticalBoost = 5;
            adjustment += criticalBoost;
            factors.add(new RiskFactor(
                    "CRITICAL_SIGNAL",
                    "Signal critique (identifiants ou changement bénéficiaire)",
                    criticalBoost,
                    "POLICY"));
        }

        int platformScore = Math.min(100, aiScore + adjustment);
        RiskLevel level = levelFromScore(platformScore);
        RecommendedAction action = actionFromLevel(level);

        String explanation = "Décision plateforme : score " + platformScore + " (" + level.name()
                + ") à partir du conseil IA (" + aiScore + "/" + ai.riskLevel().name()
                + ") + contexte métier. Action recommandée : " + action.name() + ".";

        return new PlatformRiskDecision(platformScore, level, action, explanation, List.copyOf(factors));
    }

    private static boolean hasSignal(AnalyzeMessageResponse ai, SignalType type) {
        if (ai.signals() == null) {
            return false;
        }
        for (Signal s : ai.signals()) {
            if (s.type() == type) {
                return true;
            }
        }
        return false;
    }

    static RiskLevel levelFromScore(int score) {
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

    static RecommendedAction actionFromLevel(RiskLevel level) {
        return switch (level) {
            case CRITICAL -> RecommendedAction.BLOCK_RECOMMENDED;
            case HIGH -> RecommendedAction.ALERT;
            case MEDIUM -> RecommendedAction.REVIEW;
            case LOW -> RecommendedAction.MONITOR;
        };
    }
}
