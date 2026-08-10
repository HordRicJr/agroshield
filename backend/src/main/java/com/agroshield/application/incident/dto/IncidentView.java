package com.agroshield.application.incident.dto;

import java.time.Instant;
import java.util.UUID;

public record IncidentView(
        UUID id,
        String type,
        String severity,
        String status,
        Instant detectedAt,
        String description,
        Integer riskScore,
        String source
) {
}
