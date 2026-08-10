package com.agroshield.infrastructure.ai.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ColumnInput(
        @NotBlank @Size(max = 256) String name,
        @Size(max = 50) List<String> samples
) {
    public ColumnInput {
        if (samples == null) {
            samples = List.of();
        }
    }
}
