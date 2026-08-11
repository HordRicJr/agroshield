package com.agroshield.application.risk;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

import com.agroshield.domain.risk.PlatformRiskDecision;
import com.agroshield.domain.risk.RecommendedAction;
import com.agroshield.infrastructure.ai.dto.AnalyzeMessageResponse;
import com.agroshield.infrastructure.ai.dto.Channel;
import com.agroshield.infrastructure.ai.dto.ModelCategory;
import com.agroshield.infrastructure.ai.dto.RiskLevel;
import com.agroshield.infrastructure.ai.dto.Signal;
import com.agroshield.infrastructure.ai.dto.SignalType;

class PlatformRiskEngineTest {

    private final PlatformRiskEngine engine = new PlatformRiskEngine();

    @Test
    void elevatesWhatsappAndCriticalSignal() {
        AnalyzeMessageResponse ai = new AnalyzeMessageResponse(
                RiskLevel.HIGH,
                60,
                List.of(new Signal(SignalType.BENEFICIARY_CHANGE, 28, "chg")),
                List.of(new ModelCategory("scam", 0.7)),
                "risque estimé",
                0.8,
                false);

        PlatformRiskDecision d = engine.evaluate(ai, Channel.WHATSAPP, false, 0);

        assertThat(d.score()).isEqualTo(70); // 60 + 5 channel + 5 critical signal
        assertThat(d.riskLevel()).isEqualTo(RiskLevel.HIGH);
        assertThat(d.recommendedAction()).isEqualTo(RecommendedAction.ALERT);
        assertThat(d.factors()).hasSizeGreaterThanOrEqualTo(3);
    }

    @Test
    void criticalTriggersBlockRecommended() {
        AnalyzeMessageResponse ai = new AnalyzeMessageResponse(
                RiskLevel.CRITICAL,
                79,
                List.of(new Signal(SignalType.CREDENTIAL_HARVEST, 35, "pwd")),
                List.of(),
                "risque estimé",
                0.9,
                false);

        PlatformRiskDecision d = engine.evaluate(ai, Channel.EMAIL, false, 2);

        // 79 + 5 critical + min(12, 8)=8 incidents = 92
        assertThat(d.score()).isEqualTo(92);
        assertThat(d.riskLevel()).isEqualTo(RiskLevel.CRITICAL);
        assertThat(d.recommendedAction()).isEqualTo(RecommendedAction.BLOCK_RECOMMENDED);
    }

    @Test
    void noConcreteSignalStaysLowDespiteChannelAndIncidentContext() {
        // Message bénin (« Bonjour », un lien légitime...) : l'IA n'a détecté
        // aucun signal de règle et conclut LOW. Le contexte (SMS + incidents
        // récents) ne doit pas, à lui seul, faire basculer en MEDIUM+.
        AnalyzeMessageResponse ai = new AnalyzeMessageResponse(
                RiskLevel.LOW,
                20,
                List.of(),
                List.of(new ModelCategory("demande suspecte", 0.9)),
                "risque estimé faible",
                0.5,
                false);

        PlatformRiskDecision d = engine.evaluate(ai, Channel.SMS, false, 3);

        assertThat(d.score()).isLessThanOrEqualTo(24);
        assertThat(d.riskLevel()).isEqualTo(RiskLevel.LOW);
        assertThat(d.recommendedAction()).isEqualTo(RecommendedAction.MONITOR);
    }
}
