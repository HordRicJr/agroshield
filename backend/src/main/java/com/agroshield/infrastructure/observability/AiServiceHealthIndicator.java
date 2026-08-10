package com.agroshield.infrastructure.observability;

import java.util.Map;

import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

import com.agroshield.application.ai.AiServicePort;
import com.agroshield.infrastructure.ai.AiServiceException;
import com.agroshield.infrastructure.ai.dto.ReadyResponse;

/**
 * Reflète l'état du service IA dans Actuator (/actuator/health).
 */
@Component
public class AiServiceHealthIndicator implements HealthIndicator {

    private final AiServicePort aiServicePort;

    public AiServiceHealthIndicator(AiServicePort aiServicePort) {
        this.aiServicePort = aiServicePort;
    }

    @Override
    public Health health() {
        try {
            ReadyResponse ready = aiServicePort.ready();
            if (ready.modelsLoaded()) {
                return Health.up()
                        .withDetails(Map.of(
                                "modelsLoaded", true,
                                "modelId", String.valueOf(ready.modelId()),
                                "status", ready.status()))
                        .build();
            }
            return Health.down()
                    .withDetails(Map.of(
                            "modelsLoaded", false,
                            "detail", String.valueOf(ready.detail())))
                    .build();
        } catch (AiServiceException ex) {
            return Health.down()
                    .withDetail("errorCode", ex.getErrorCode())
                    .withDetail("message", "AI service unreachable")
                    .build();
        }
    }
}
