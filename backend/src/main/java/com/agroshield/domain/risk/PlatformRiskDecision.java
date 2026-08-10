package com.agroshield.domain.risk;

import java.util.List;

import com.agroshield.infrastructure.ai.dto.RiskLevel;

public record PlatformRiskDecision(
        int score,
        RiskLevel riskLevel,
        RecommendedAction recommendedAction,
        String explanation,
        List<RiskFactor> factors
) {
}
