package com.agroshield.application.auth.dto;

import java.util.List;
import java.util.UUID;

public record TokenResponse(
        String accessToken,
        String refreshToken,
        String tokenType,
        long expiresIn,
        UUID userId,
        UUID organizationId,
        String email,
        List<String> roles,
        List<String> permissions
) {
}
