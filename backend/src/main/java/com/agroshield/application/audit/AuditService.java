package com.agroshield.application.audit;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.agroshield.infrastructure.persistence.entity.AuditLogEntity;
import com.agroshield.infrastructure.persistence.repo.AuditLogRepository;
import com.agroshield.infrastructure.security.AuthUserPrincipal;

@Service
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional
    public void record(
            AuthUserPrincipal principal,
            String action,
            String resourceType,
            String resourceId,
            String result,
            Integer riskScore,
            String riskLevel,
            String metadataJson) {
        AuditLogEntity entity = new AuditLogEntity();
        entity.setOrganizationId(principal.getOrganizationId());
        entity.setUserId(principal.getUserId());
        entity.setAction(action);
        entity.setResourceType(resourceType);
        entity.setResourceId(resourceId);
        entity.setResult(result);
        entity.setRiskScore(riskScore);
        entity.setRiskLevel(riskLevel);
        entity.setMetadataJson(metadataJson);
        auditLogRepository.save(entity);
    }

    /** Événements pré-auth (login échoué) — pas de principal. */
    @Transactional
    public void recordAnonymous(
            UUID organizationId,
            UUID userId,
            String action,
            String resourceType,
            String resourceId,
            String result,
            String emailHash,
            String ipHash,
            String metadataJson) {
        AuditLogEntity entity = new AuditLogEntity();
        entity.setOrganizationId(organizationId);
        entity.setUserId(userId);
        entity.setAction(action);
        entity.setResourceType(resourceType);
        entity.setResourceId(resourceId);
        entity.setResult(result);
        entity.setEmailHash(emailHash);
        entity.setIpHash(ipHash);
        entity.setMetadataJson(metadataJson);
        auditLogRepository.save(entity);
    }
}
