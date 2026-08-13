package com.agroshield.application.policy.dto;

import java.time.Instant;
import java.util.UUID;

public record SecurityPolicyView(
        UUID id,
        String code,
        String action,
        boolean enabled,
        String configJson,
        Instant createdAt
) {
}
