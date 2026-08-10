package com.agroshield.application.security.dto;

import java.util.List;
import java.util.UUID;

import com.agroshield.domain.risk.RecommendedAction;
import com.agroshield.infrastructure.ai.dto.ModelCategory;
import com.agroshield.infrastructure.ai.dto.RiskLevel;
import com.agroshield.infrastructure.ai.dto.Signal;

/**
 * Conseil IA + décision plateforme (Risk Engine Spring).
 */
public record AnalyzeMessageResult(
        RiskLevel aiRiskLevel,
        int aiScore,
        List<Signal> signals,
        List<ModelCategory> modelCategories,
        String aiRecommendation,
        double confidence,
        Boolean stub,
        boolean degraded,
        UUID predictionId,
        RiskLevel riskLevel,
        int score,
        RecommendedAction recommendedAction,
        String explanation,
        UUID riskAssessmentId,
        UUID incidentId,
        UUID alertId
) {
}
