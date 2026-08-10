package com.agroshield;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.charset.StandardCharsets;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import com.fasterxml.jackson.databind.ObjectMapper;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ProductCoreFlowTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    ObjectMapper objectMapper;

    @Test
    void producersFarmsFilesAndSelectiveShare() throws Exception {
        String email = "core-" + UUID.randomUUID() + "@agroshield.local";
        String registerBody = """
                {
                  "email": "%s",
                  "password": "JurySecure!2026",
                  "fullName": "Core Tester",
                  "organizationName": "Coop Core %s"
                }
                """.formatted(email, UUID.randomUUID().toString().substring(0, 8));

        MvcResult reg = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerBody))
                .andExpect(status().isCreated())
                .andReturn();
        String access = objectMapper.readTree(reg.getResponse().getContentAsString())
                .path("data").path("accessToken").asText();

        MvcResult producer = mockMvc.perform(post("/api/v1/producers")
                        .header("Authorization", "Bearer " + access)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"code":"P-001","displayName":"Amadou Diallo"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.code").value("P-001"))
                .andReturn();
        String producerId = objectMapper.readTree(producer.getResponse().getContentAsString())
                .path("data").path("id").asText();

        mockMvc.perform(post("/api/v1/farms")
                        .header("Authorization", "Bearer " + access)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Parcelle Nord","producerId":"%s"}
                                """.formatted(producerId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.name").value("Parcelle Nord"));

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "rendements.csv",
                "text/csv",
                "parcelle,superficie,iban\nN1,12,FR76SECRET\n".getBytes(StandardCharsets.UTF_8));

        MvcResult upload = mockMvc.perform(multipart("/api/v1/files")
                        .file(file)
                        .header("Authorization", "Bearer " + access))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.sha256Hex").isNotEmpty())
                .andReturn();
        String fileId = objectMapper.readTree(upload.getResponse().getContentAsString())
                .path("data").path("id").asText();

        MvcResult share = mockMvc.perform(post("/api/v1/shares")
                        .header("Authorization", "Bearer " + access)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "fileId": "%s",
                                  "label": "Partenaire coop",
                                  "allowedColumns": ["parcelle","superficie"],
                                  "ttlMinutes": 30
                                }
                                """.formatted(fileId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.token").isNotEmpty())
                .andExpect(jsonPath("$.data.publicPath").isNotEmpty())
                .andExpect(jsonPath("$.data.note").isNotEmpty())
                .andReturn();

        String token = objectMapper.readTree(share.getResponse().getContentAsString())
                .path("data").path("token").asText();
        String shareId = objectMapper.readTree(share.getResponse().getContentAsString())
                .path("data").path("shareId").asText();

        // snake_case aussi accepté (clients / docs mixtes)
        mockMvc.perform(post("/api/v1/shares")
                        .header("Authorization", "Bearer " + access)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "file_id": "%s",
                                  "label": "Partenaire snake",
                                  "allowed_columns": ["parcelle"],
                                  "ttl_minutes": 15
                                }
                                """.formatted(fileId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.token").isNotEmpty());

        mockMvc.perform(get("/api/v1/shares")
                        .header("Authorization", "Bearer " + access))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray());

        mockMvc.perform(get("/api/v1/public/shares/" + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accessMode").value("METADATA_ONLY"))
                .andExpect(jsonPath("$.data.allowedColumns[0]").value("parcelle"))
                .andExpect(jsonPath("$.data.originalName").value("rendements.csv"));

        mockMvc.perform(delete("/api/v1/shares/" + shareId)
                        .header("Authorization", "Bearer " + access))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.revoked").value(true));

        mockMvc.perform(get("/api/v1/public/shares/" + token))
                .andExpect(status().isNotFound());
    }
}
