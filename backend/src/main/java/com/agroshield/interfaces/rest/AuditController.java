package com.agroshield.interfaces.rest;

import java.util.List;

import org.slf4j.MDC;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.agroshield.application.audit.AuditQueryService;
import com.agroshield.application.audit.dto.AuditLogView;
import com.agroshield.infrastructure.security.CorrelationIdFilter;
import com.agroshield.interfaces.rest.dto.ApiResponse;

@RestController
@RequestMapping("/api/v1/audit")
public class AuditController {

    private final AuditQueryService auditQueryService;

    public AuditController(AuditQueryService auditQueryService) {
        this.auditQueryService = auditQueryService;
    }

    @GetMapping("/recent")
    @PreAuthorize("hasAuthority('AUDIT_VIEW')")
    public ApiResponse<List<AuditLogView>> recent() {
        return ApiResponse.ok(auditQueryService.listRecent(), corr());
    }

    private static String corr() {
        String id = MDC.get(CorrelationIdFilter.MDC_KEY);
        return id != null ? id : "unknown";
    }
}
