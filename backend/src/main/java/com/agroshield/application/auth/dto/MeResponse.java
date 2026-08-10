package com.agroshield.application.auth.dto;

import java.util.List;
import java.util.UUID;

public record MeResponse(
        UUID userId,
        String email,
        String fullName,
        UUID organizationId,
        List<String> roles,
        List<String> permissions
) {
}
