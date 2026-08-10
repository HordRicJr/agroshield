package com.agroshield.infrastructure.ai.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
@JsonInclude(JsonInclude.Include.NON_NULL)
public record AnalyzeMessageResponse(
        RiskLevel riskLevel,
        int score,
        List<Signal> signals,
        List<ModelCategory> modelCategories,
        String recommendation,
        double confidence,
        Boolean stub
) {
}
