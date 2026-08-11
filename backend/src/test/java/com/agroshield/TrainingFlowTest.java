package com.agroshield;

import static org.assertj.core.api.Assertions.assertThat;
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

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class TrainingFlowTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    ObjectMapper objectMapper;

    private String registerAndGetToken() throws Exception {
        String email = "training-" + UUID.randomUUID() + "@agroshield.local";
        String registerBody = """
                {
                  "email": "%s",
                  "password": "TrainingSecure!2026",
                  "fullName": "Training Tester",
                  "organizationName": "Coop Training %s"
                }
                """.formatted(email, UUID.randomUUID().toString().substring(0, 8));

        MvcResult reg = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerBody))
                .andExpect(status().isCreated())
                .andReturn();
        return objectMapper.readTree(reg.getResponse().getContentAsString())
                .get("data").get("accessToken").asText();
    }

    @Test
    void catalogIsSeeded() throws Exception {
        String access = registerAndGetToken();

        mockMvc.perform(get("/api/v1/training/modules"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/v1/training/modules")
                        .header("Authorization", "Bearer " + access))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.length()").value(org.hamcrest.Matchers.greaterThanOrEqualTo(4)))
                .andExpect(jsonPath("$.data[?(@.code == 'PHISHING-101')]").exists());
    }

    @Test
    void completeModuleThenSeeItInMyResultsAndOrgResults() throws Exception {
        String access = registerAndGetToken();

        MvcResult modules = mockMvc.perform(get("/api/v1/training/modules")
                        .header("Authorization", "Bearer " + access))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode first = objectMapper.readTree(modules.getResponse().getContentAsString()).get("data").get(0);
        String moduleId = first.get("id").asText();

        MvcResult completion = mockMvc.perform(post("/api/v1/training/modules/" + moduleId + "/complete")
                        .header("Authorization", "Bearer " + access)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"score\":85}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.moduleId").value(moduleId))
                .andExpect(jsonPath("$.data.score").value(85))
                .andReturn();
        JsonNode data = objectMapper.readTree(completion.getResponse().getContentAsString()).get("data");
        assertThat(data.get("completedAt").asText()).isNotBlank();

        mockMvc.perform(get("/api/v1/training/results/me")
                        .header("Authorization", "Bearer " + access))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].score").value(85));

        // RESPONSABLE (rôle par défaut à l'inscription) possède SECURITY_VIEW.
        mockMvc.perform(get("/api/v1/training/results")
                        .header("Authorization", "Bearer " + access))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1));
    }

    @Test
    void completingUnknownModuleReturnsNotFound() throws Exception {
        String access = registerAndGetToken();
        mockMvc.perform(post("/api/v1/training/modules/" + UUID.randomUUID() + "/complete")
                        .header("Authorization", "Bearer " + access)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"score\":50}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void creatingModuleRequiresSecurityManagePermission() throws Exception {
        // Rôle RESPONSABLE (attribué par défaut à l'inscription) n'a pas SECURITY_MANAGE.
        String access = registerAndGetToken();
        mockMvc.perform(post("/api/v1/training/modules")
                        .header("Authorization", "Bearer " + access)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"code":"TEST-403","title":"Test","topic":"test"}
                                """))
                .andExpect(status().isForbidden());
    }
}
