package com.agroshield;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Phase 4 — classify + analyze avec IA down (port 9) → fallback local + persistence.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ClassifyAndFraudFlowTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    ObjectMapper objectMapper;

    @Test
    void classifyAndAnalyzeDegradedWhenAiDown() throws Exception {
        String email = "phase4-" + UUID.randomUUID() + "@agroshield.local";
        String registerBody = """
                {
                  "email": "%s",
                  "password": "JurySecure!2026",
                  "fullName": "Phase4 Tester",
                  "organizationName": "Coop P4 %s"
                }
                """.formatted(email, UUID.randomUUID().toString().substring(0, 8));

        MvcResult reg = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerBody))
                .andExpect(status().isCreated())
                .andReturn();

        String access = objectMapper.readTree(reg.getResponse().getContentAsString())
                .path("data").path("accessToken").asText();

        mockMvc.perform(post("/api/v1/data/classify")
                        .header("Authorization", "Bearer " + access)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "columns": [
                                    {"name": "iban_beneficiaire", "samples": []},
                                    {"name": "superficie_ha", "samples": ["12"]}
                                  ]
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.degraded").value(true))
                .andExpect(jsonPath("$.data.predictionId").isNotEmpty())
                .andExpect(jsonPath("$.data.results[0].classification").value("FINANCIAL_SENSITIVE"));

        mockMvc.perform(post("/api/v1/security/analyze-message")
                        .header("Authorization", "Bearer " + access)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "content": "URGENT. Changez le bénéficiaire et envoyez le paiement immédiatement.",
                                  "channel": "WHATSAPP",
                                  "language": "fr"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.degraded").value(true))
                .andExpect(jsonPath("$.data.predictionId").isNotEmpty())
                .andExpect(jsonPath("$.data.aiScore").isNumber())
                .andExpect(jsonPath("$.data.score").isNumber())
                .andExpect(jsonPath("$.data.riskAssessmentId").isNotEmpty())
                .andExpect(jsonPath("$.data.recommendedAction").isNotEmpty());

        mockMvc.perform(get("/api/v1/risks/recent")
                        .header("Authorization", "Bearer " + access))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].riskScore").isNumber());

        mockMvc.perform(post("/api/v1/security/analyze-message")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"content":"hello","channel":"EMAIL","language":"fr"}
                                """))
                .andExpect(status().isForbidden());
    }
}
