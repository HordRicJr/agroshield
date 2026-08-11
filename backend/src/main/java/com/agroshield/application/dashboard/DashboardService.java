package com.agroshield.application.dashboard;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.agroshield.application.dashboard.dto.DashboardDtos.CategoryScore;
import com.agroshield.application.dashboard.dto.DashboardDtos.DashboardSummary;
import com.agroshield.application.incident.IncidentQueryService;
import com.agroshield.application.incident.dto.AlertView;
import com.agroshield.application.security.SecurityContextHelper;
import com.agroshield.infrastructure.persistence.repo.AlertRepository;
import com.agroshield.infrastructure.persistence.repo.DataClassificationRepository;
import com.agroshield.infrastructure.persistence.repo.FarmRepository;
import com.agroshield.infrastructure.persistence.repo.FileMetadataRepository;
import com.agroshield.infrastructure.persistence.repo.IncidentRepository;
import com.agroshield.infrastructure.persistence.repo.ProducerRepository;
import com.agroshield.infrastructure.security.AuthUserPrincipal;

/**
 * Score cyber = moyenne de trois axes (incidents, alertes, données sensibles),
 * chacun partant de 100 et diminuant selon la gravité constatée — jamais une
 * boîte noire : chaque axe est traçable jusqu'à un compte réel en base.
 */
@Service
public class DashboardService {

    private static final int RECENT_ALERTS_LIMIT = 5;
    private static final List<String> SENSITIVE_RISK_LEVELS = List.of("HIGH", "CRITICAL");

    private final IncidentRepository incidentRepository;
    private final AlertRepository alertRepository;
    private final DataClassificationRepository classificationRepository;
    private final ProducerRepository producerRepository;
    private final FarmRepository farmRepository;
    private final FileMetadataRepository fileMetadataRepository;
    private final IncidentQueryService incidentQueryService;

    public DashboardService(
            IncidentRepository incidentRepository,
            AlertRepository alertRepository,
            DataClassificationRepository classificationRepository,
            ProducerRepository producerRepository,
            FarmRepository farmRepository,
            FileMetadataRepository fileMetadataRepository,
            IncidentQueryService incidentQueryService) {
        this.incidentRepository = incidentRepository;
        this.alertRepository = alertRepository;
        this.classificationRepository = classificationRepository;
        this.producerRepository = producerRepository;
        this.farmRepository = farmRepository;
        this.fileMetadataRepository = fileMetadataRepository;
        this.incidentQueryService = incidentQueryService;
    }

    @Transactional(readOnly = true)
    public DashboardSummary summary() {
        AuthUserPrincipal principal = SecurityContextHelper.requirePrincipal();
        UUID orgId = principal.getOrganizationId();
        Instant sevenDaysAgo = Instant.now().minus(7, ChronoUnit.DAYS);

        int threatsDetected7d = (int) incidentRepository.countByOrganizationIdAndDetectedAtAfter(orgId, sevenDaysAgo);
        int openIncidents = (int) incidentRepository.countByOrganizationIdAndStatus(orgId, "OPEN");
        int criticalOpenIncidents =
                (int) incidentRepository.countByOrganizationIdAndStatusAndSeverity(orgId, "OPEN", "CRITICAL");
        int unacknowledgedAlerts = (int) alertRepository.countByOrganizationIdAndAcknowledgedAtIsNull(orgId);
        int protectedRecords = (int) (producerRepository.countByOrganizationId(orgId)
                + farmRepository.countByOrganizationId(orgId)
                + fileMetadataRepository.countByOrganizationId(orgId));
        int sensitiveColumnsPendingReview = (int) classificationRepository
                .countByOrganizationIdAndHumanValidatedFalseAndRiskLevelIn(orgId, SENSITIVE_RISK_LEVELS);

        int incidentsScore = clamp(100 - (criticalOpenIncidents * 20 + (openIncidents - criticalOpenIncidents) * 8));
        int alertsScore = clamp(100 - unacknowledgedAlerts * 10);
        int dataScore = clamp(100 - sensitiveColumnsPendingReview * 12);
        int cyberScore = clamp((incidentsScore + alertsScore + dataScore) / 3);

        List<CategoryScore> categories = List.of(
                new CategoryScore("incidents", "Incidents de sécurité", incidentsScore),
                new CategoryScore("alerts", "Alertes traitées", alertsScore),
                new CategoryScore("data", "Données sensibles validées", dataScore));

        List<AlertView> recentAlerts = incidentQueryService.listAlerts().stream()
                .limit(RECENT_ALERTS_LIMIT)
                .toList();

        return new DashboardSummary(
                cyberScore,
                categories,
                threatsDetected7d,
                openIncidents,
                criticalOpenIncidents,
                unacknowledgedAlerts,
                protectedRecords,
                sensitiveColumnsPendingReview,
                recentAlerts);
    }

    private static int clamp(int score) {
        return Math.max(0, Math.min(100, score));
    }
}
