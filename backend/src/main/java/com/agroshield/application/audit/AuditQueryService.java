package com.agroshield.application.audit;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.agroshield.application.audit.dto.AuditLogView;
import com.agroshield.application.security.SecurityContextHelper;
import com.agroshield.infrastructure.persistence.repo.AuditLogRepository;
import com.agroshield.infrastructure.security.AuthUserPrincipal;

@Service
public class AuditQueryService {

    private final AuditLogRepository auditLogRepository;

    public AuditQueryService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional(readOnly = true)
    public List<AuditLogView> listRecent() {
        AuthUserPrincipal principal = SecurityContextHelper.requirePrincipal();
        return auditLogRepository
                .findTop50ByOrganizationIdOrderByCreatedAtDesc(principal.getOrganizationId())
                .stream()
                .map(e -> new AuditLogView(
                        e.getId(),
                        e.getAction(),
                        e.getResourceType(),
                        e.getResourceId(),
                        e.getResult(),
                        e.getRiskScore(),
                        e.getRiskLevel(),
                        e.getCreatedAt()))
                .toList();
    }
}
