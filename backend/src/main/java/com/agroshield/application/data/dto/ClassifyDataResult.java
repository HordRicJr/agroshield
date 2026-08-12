package com.agroshield.application.data.dto;

import java.util.List;
import java.util.UUID;

import com.agroshield.infrastructure.ai.dto.ColumnClassification;

public record ClassifyDataResult(
        List<ColumnClassification> results,
        String highestRiskLevel,
        int sensitiveColumns,
        Boolean stub,
        boolean degraded,
        UUID predictionId
) {
}
