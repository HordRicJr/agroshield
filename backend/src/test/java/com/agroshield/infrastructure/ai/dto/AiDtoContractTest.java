package com.agroshield.infrastructure.ai.dto;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

import com.fasterxml.jackson.databind.ObjectMapper;

class AiDtoContractTest {

    private final ObjectMapper mapper = new ObjectMapper().findAndRegisterModules();

    @Test
    void analyzeMessageResponse_snakeCase() throws Exception {
        String json = """
                {
                  "risk_level": "HIGH",
                  "score": 91,
                  "signals": [
                    {"type": "URGENCY", "weight": 20, "label": "délai court"}
                  ],
                  "model_categories": [
                    {"label": "fraude au paiement", "score": 0.87}
                  ],
                  "recommendation": "Vérifier",
                  "confidence": 0.79
                }
                """;
        AnalyzeMessageResponse r = mapper.readValue(json, AnalyzeMessageResponse.class);
        assertThat(r.riskLevel()).isEqualTo(RiskLevel.HIGH);
        assertThat(r.score()).isEqualTo(91);
        assertThat(r.modelCategories()).hasSize(1);
        assertThat(r.signals().get(0).type()).isEqualTo(SignalType.URGENCY);
    }

    @Test
    void classifyRequest_roundTrip() throws Exception {
        ClassifyRequest req = new ClassifyRequest(
                java.util.List.of(new ColumnInput("telephone", java.util.List.of("+22890123456"))));
        String json = mapper.writeValueAsString(req);
        assertThat(json).contains("\"columns\"");
        assertThat(json).contains("telephone");
        ClassifyRequest back = mapper.readValue(json, ClassifyRequest.class);
        assertThat(back.columns()).hasSize(1);
    }
}
