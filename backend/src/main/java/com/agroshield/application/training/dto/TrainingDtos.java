package com.agroshield.application.training.dto;

import java.time.Instant;
import java.util.UUID;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class TrainingDtos {

    private TrainingDtos() {
    }

    public record CreateModuleRequest(
            @NotBlank @Size(max = 64) String code,
            @NotBlank @Size(max = 255) String title,
            @NotBlank @Size(max = 128) String topic,
            @Size(max = 1024) String contentUrl
    ) {
    }

    public record ModuleView(
            UUID id,
            String code,
            String title,
            String topic,
            String contentUrl,
            Instant createdAt
    ) {
    }

    public record CompleteModuleRequest(
            @Min(0) @Max(100) Integer score
    ) {
    }

    public record ResultView(
            UUID id,
            UUID moduleId,
            UUID userId,
            Integer score,
            Instant completedAt,
            Instant createdAt
    ) {
    }
}
