package com.agroshield.application.audit.dto;

import java.time.Instant;
import java.util.UUID;

public record AuditLogView(
        UUID id,
        String action,
        String resourceType,
        String resourceId,
        String result,
        Integer riskScore,
        String riskLevel,
        Instant createdAt
) {
}
