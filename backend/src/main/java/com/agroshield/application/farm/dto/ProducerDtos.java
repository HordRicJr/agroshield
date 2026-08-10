package com.agroshield.application.farm.dto;

import java.time.Instant;
import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class ProducerDtos {

    private ProducerDtos() {
    }

    public record CreateProducerRequest(
            @NotBlank @Size(max = 64) String code,
            @NotBlank @Size(max = 255) String displayName
    ) {
    }

    public record UpdateProducerRequest(
            @NotBlank @Size(max = 255) String displayName
    ) {
    }

    public record ProducerView(
            UUID id,
            String code,
            String displayName,
            Instant createdAt
    ) {
    }
}
