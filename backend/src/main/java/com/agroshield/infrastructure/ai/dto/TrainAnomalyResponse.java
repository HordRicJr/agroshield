package com.agroshield.infrastructure.ai.dto;

import java.time.Instant;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
@JsonInclude(JsonInclude.Include.NON_NULL)
public record TrainAnomalyResponse(
        String organizationId,
        String modelVersion,
        int nSamples,
        Instant trainedAt,
        String status,
        Boolean stub
) {
}
