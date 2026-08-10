package com.agroshield.application.incident.dto;

import java.time.Instant;
import java.util.UUID;

public record AlertView(
        UUID id,
        UUID incidentId,
        String level,
        String message,
        Instant acknowledgedAt,
        Instant createdAt
) {
}
