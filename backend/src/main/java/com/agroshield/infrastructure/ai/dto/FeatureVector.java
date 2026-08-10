package com.agroshield.infrastructure.ai.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
@JsonInclude(JsonInclude.Include.NON_NULL)
public record FeatureVector(
        @Min(0) @Max(23) int hourOfDay,
        @DecimalMin("0") double exportCount24h,
        @DecimalMin("0") double recordsAccessed,
        @DecimalMin("0") double failedLogins24h,
        boolean isNewDevice,
        boolean isUnusualLocation,
        @DecimalMin("0") double actionsPerMinute,
        @DecimalMin("0.0") @DecimalMax("1.0") double sensitiveResourceRatio
) {
}
