package com.agroshield.interfaces.rest;

import java.util.List;
import java.util.UUID;

import org.slf4j.MDC;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.agroshield.application.incident.IncidentQueryService;
import com.agroshield.application.incident.dto.AlertView;
import com.agroshield.application.incident.dto.IncidentView;
import com.agroshield.application.risk.RiskQueryService;
import com.agroshield.application.risk.dto.RiskAssessmentView;
import com.agroshield.infrastructure.security.CorrelationIdFilter;
import com.agroshield.interfaces.rest.dto.ApiResponse;

@RestController
@RequestMapping("/api/v1")
public class RiskIncidentController {

    private final RiskQueryService riskQueryService;
    private final IncidentQueryService incidentQueryService;

    public RiskIncidentController(
            RiskQueryService riskQueryService,
            IncidentQueryService incidentQueryService) {
        this.riskQueryService = riskQueryService;
        this.incidentQueryService = incidentQueryService;
    }

    @GetMapping("/risks/recent")
    @PreAuthorize("hasAuthority('SECURITY_VIEW')")
    public ApiResponse<List<RiskAssessmentView>> recentRisks() {
        return ApiResponse.ok(riskQueryService.listRecent(), correlationId());
    }

    @GetMapping("/incidents")
    @PreAuthorize("hasAuthority('SECURITY_VIEW') or hasAuthority('INCIDENT_MANAGE')")
    public ApiResponse<List<IncidentView>> incidents() {
        return ApiResponse.ok(incidentQueryService.listIncidents(), correlationId());
    }

    @GetMapping("/alerts")
    @PreAuthorize("hasAuthority('SECURITY_VIEW') or hasAuthority('SECURITY_MANAGE')")
    public ApiResponse<List<AlertView>> alerts() {
        return ApiResponse.ok(incidentQueryService.listAlerts(), correlationId());
    }

    @PostMapping("/alerts/{id}/acknowledge")
    @PreAuthorize("hasAuthority('SECURITY_VIEW') or hasAuthority('SECURITY_MANAGE')")
    public ApiResponse<AlertView> acknowledge(@PathVariable("id") UUID id) {
        return ApiResponse.ok(incidentQueryService.acknowledgeAlert(id), correlationId());
    }

    private static String correlationId() {
        String id = MDC.get(CorrelationIdFilter.MDC_KEY);
        return id != null ? id : "unknown";
    }
}
