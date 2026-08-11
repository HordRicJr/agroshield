package com.agroshield.application.dashboard.dto;

import java.util.List;

import com.agroshield.application.incident.dto.AlertView;

public final class DashboardDtos {

    private DashboardDtos() {
    }

    public record CategoryScore(
            String key,
            String label,
            int score
    ) {
    }

    public record DashboardSummary(
            int cyberScore,
            List<CategoryScore> categories,
            int threatsDetected7d,
            int openIncidents,
            int criticalOpenIncidents,
            int unacknowledgedAlerts,
            int protectedRecords,
            int sensitiveColumnsPendingReview,
            List<AlertView> recentAlerts
    ) {
    }
}
