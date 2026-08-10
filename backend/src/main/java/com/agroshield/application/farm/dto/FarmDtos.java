package com.agroshield.application.farm.dto;

import java.time.Instant;
import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class FarmDtos {

    private FarmDtos() {
    }

    public record CreateFarmRequest(
            @NotBlank @Size(max = 255) String name,
            UUID producerId
    ) {
    }

    public record UpdateFarmRequest(
            @NotBlank @Size(max = 255) String name,
            UUID producerId
    ) {
    }

    public record FarmView(
            UUID id,
            String name,
            UUID producerId,
            Instant createdAt
    ) {
    }
}
