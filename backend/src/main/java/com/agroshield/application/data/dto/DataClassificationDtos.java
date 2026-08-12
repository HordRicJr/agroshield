package com.agroshield.application.data.dto;

import java.time.Instant;
import java.util.UUID;

import jakarta.validation.constraints.NotBlank;

public final class DataClassificationDtos {

    private DataClassificationDtos() {
    }

    public record ClassificationView(
            UUID id,
            UUID fileId,
            String columnName,
            String classification,
            String riskLevel,
            Double confidence,
            String method,
            boolean humanValidated,
            Instant createdAt
    ) {
    }

    public record ReclassifyRequest(
            @NotBlank String classification
    ) {
    }
}
