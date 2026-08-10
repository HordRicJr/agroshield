package com.agroshield.application.incident;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.agroshield.domain.risk.PlatformRiskDecision;
import com.agroshield.domain.risk.RecommendedAction;
import com.agroshield.infrastructure.ai.dto.RiskLevel;
import com.agroshield.infrastructure.persistence.entity.AlertEntity;
import com.agroshield.infrastructure.persistence.entity.IncidentEntity;
import com.agroshield.infrastructure.persistence.repo.AlertRepository;
import com.agroshield.infrastructure.persistence.repo.IncidentRepository;
import com.agroshield.infrastructure.security.AuthUserPrincipal;

@Service
public class IncidentAlertService {

    private final IncidentRepository incidentRepository;
    private final AlertRepository alertRepository;

    public IncidentAlertService(IncidentRepository incidentRepository, AlertRepository alertRepository) {
        this.incidentRepository = incidentRepository;
        this.alertRepository = alertRepository;
    }

    public long countOpenIncidentsLast7Days(UUID organizationId) {
        Instant since = Instant.now().minus(7, ChronoUnit.DAYS);
        return incidentRepository.countByOrganizationIdAndStatusAndDetectedAtAfter(
                organizationId, "OPEN", since);
    }

    /**
     * Crée incident + alerte uniquement pour HIGH / CRITICAL.
     * @return [incidentId, alertId] — nulls si pas d'escalade
     */
    @Transactional
    public EscalationResult escalateIfNeeded(
            AuthUserPrincipal principal,
            PlatformRiskDecision decision,
            UUID predictionId,
            UUID riskAssessmentId) {
        if (decision.riskLevel() != RiskLevel.HIGH && decision.riskLevel() != RiskLevel.CRITICAL) {
            return EscalationResult.none();
        }

        IncidentEntity incident = new IncidentEntity();
        incident.setOrganizationId(principal.getOrganizationId());
        incident.setType("SUSPICIOUS_MESSAGE");
        incident.setSeverity(decision.riskLevel().name());
        incident.setStatus("OPEN");
        incident.setDescription(decision.explanation());
        incident.setRiskScore(decision.score());
        incident.setSource("FRAUD_GUARD");
        incident.setMetadataJson("{\"predictionId\":\"" + predictionId
                + "\",\"riskAssessmentId\":\"" + riskAssessmentId
                + "\",\"action\":\"" + decision.recommendedAction().name() + "\"}");
        UUID incidentId = incidentRepository.save(incident).getId();

        AlertEntity alert = new AlertEntity();
        alert.setOrganizationId(principal.getOrganizationId());
        alert.setIncidentId(incidentId);
        alert.setLevel(decision.riskLevel().name());
        alert.setMessage(alertMessage(decision));
        UUID alertId = alertRepository.save(alert).getId();

        return new EscalationResult(incidentId, alertId);
    }

    private static String alertMessage(PlatformRiskDecision decision) {
        String verb = decision.recommendedAction() == RecommendedAction.BLOCK_RECOMMENDED
                ? "Bloquer / vérifier avant toute action"
                : "Alerte sécurité — revue requise";
        return verb + " (score plateforme " + decision.score() + ", " + decision.riskLevel().name() + ").";
    }

    public record EscalationResult(UUID incidentId, UUID alertId) {
        static EscalationResult none() {
            return new EscalationResult(null, null);
        }
    }
}
