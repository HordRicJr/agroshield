package com.agroshield.application.incident;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.agroshield.application.incident.dto.AlertView;
import com.agroshield.application.incident.dto.IncidentView;
import com.agroshield.application.security.SecurityContextHelper;
import com.agroshield.infrastructure.persistence.entity.AlertEntity;
import com.agroshield.infrastructure.persistence.entity.IncidentEntity;
import com.agroshield.infrastructure.persistence.repo.AlertRepository;
import com.agroshield.infrastructure.persistence.repo.IncidentRepository;
import com.agroshield.infrastructure.security.AuthUserPrincipal;

@Service
public class IncidentQueryService {

    private final IncidentRepository incidentRepository;
    private final AlertRepository alertRepository;

    public IncidentQueryService(IncidentRepository incidentRepository, AlertRepository alertRepository) {
        this.incidentRepository = incidentRepository;
        this.alertRepository = alertRepository;
    }

    @Transactional(readOnly = true)
    public List<IncidentView> listIncidents() {
        AuthUserPrincipal principal = SecurityContextHelper.requirePrincipal();
        return incidentRepository
                .findTop50ByOrganizationIdOrderByDetectedAtDesc(principal.getOrganizationId())
                .stream()
                .map(this::toIncident)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AlertView> listAlerts() {
        AuthUserPrincipal principal = SecurityContextHelper.requirePrincipal();
        return alertRepository
                .findTop50ByOrganizationIdOrderByCreatedAtDesc(principal.getOrganizationId())
                .stream()
                .map(this::toAlert)
                .toList();
    }

    @Transactional
    public AlertView acknowledgeAlert(java.util.UUID alertId) {
        AuthUserPrincipal principal = SecurityContextHelper.requirePrincipal();
        AlertEntity alert = alertRepository.findById(alertId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Alerte introuvable"));
        if (!alert.getOrganizationId().equals(principal.getOrganizationId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Alerte hors organisation");
        }
        if (alert.getAcknowledgedAt() == null) {
            alert.setAcknowledgedAt(java.time.Instant.now());
            alertRepository.save(alert);
        }
        return toAlert(alert);
    }

    private IncidentView toIncident(IncidentEntity e) {
        return new IncidentView(
                e.getId(),
                e.getType(),
                e.getSeverity(),
                e.getStatus(),
                e.getDetectedAt(),
                e.getDescription(),
                e.getRiskScore(),
                e.getSource());
    }

    private AlertView toAlert(AlertEntity e) {
        return new AlertView(
                e.getId(),
                e.getIncidentId(),
                e.getLevel(),
                e.getMessage(),
                e.getAcknowledgedAt(),
                e.getCreatedAt());
    }
}
