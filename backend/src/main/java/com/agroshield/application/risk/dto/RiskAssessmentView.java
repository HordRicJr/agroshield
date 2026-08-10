package com.agroshield.application.risk.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record RiskAssessmentView(
        UUID id,
        String source,
        int riskScore,
        String riskLevel,
        UUID aiPredictionId,
        String explanation,
        Instant createdAt,
        List<RiskFactorView> factors
) {
    public record RiskFactorView(
            String factor,
            String description,
            int weight,
            String source
    ) {
    }
}
