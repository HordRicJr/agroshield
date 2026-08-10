package com.agroshield;

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
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "agroshield.auth-rate-limit.max-attempts=3",
        "agroshield.auth-rate-limit.max-attempts-per-ip=50",
        "agroshield.auth-rate-limit.window-seconds=600"
})
class LoginSecurityTest {

    @Autowired
    MockMvc mockMvc;

    @Test
    void failedLoginsAreRateLimited() throws Exception {
        String email = "lock-" + UUID.randomUUID() + "@agroshield.local";
        String registerBody = """
                {
                  "email": "%s",
                  "password": "JurySecure!2026",
                  "fullName": "Lock Tester",
                  "organizationName": "Coop Lock %s"
                }
                """.formatted(email, UUID.randomUUID().toString().substring(0, 8));
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerBody))
                .andExpect(status().isCreated());

        String badLogin = """
                {"email":"%s","password":"WrongPassword!999"}
                """.formatted(email);

        for (int i = 0; i < 3; i++) {
            mockMvc.perform(post("/api/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(badLogin))
                    .andExpect(status().isUnauthorized());
        }

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(badLogin))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.error.code").value("RATE_LIMITED"));
    }
}
