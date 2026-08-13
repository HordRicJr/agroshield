package com.agroshield.application.policy;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.agroshield.application.audit.AuditService;
import com.agroshield.application.policy.dto.SecurityPolicyView;
import com.agroshield.application.security.SecurityContextHelper;
import com.agroshield.infrastructure.persistence.entity.SecurityPolicyEntity;
import com.agroshield.infrastructure.persistence.repo.SecurityPolicyRepository;
import com.agroshield.infrastructure.security.AuthUserPrincipal;

@Service
public class SecurityPolicyService {

    public static final String ENCRYPT_AT_REST = "ENCRYPT_AT_REST";
    public static final String MASK_SENSITIVE_COLUMNS = "MASK_SENSITIVE_COLUMNS";
    public static final String ACTION_ENFORCE = "ENFORCE";
    public static final String ACTION_RECOMMEND = "RECOMMEND";

    private final SecurityPolicyRepository policyRepository;
    private final AuditService auditService;

    public SecurityPolicyService(SecurityPolicyRepository policyRepository, AuditService auditService) {
        this.policyRepository = policyRepository;
        this.auditService = auditService;
    }

    @Transactional
    public void seedDefaults(UUID organizationId) {
        upsert(organizationId, ENCRYPT_AT_REST, ACTION_ENFORCE,
                "{\"scope\":\"files\",\"algorithm\":\"AES-256-GCM\"}");
        upsert(organizationId, MASK_SENSITIVE_COLUMNS, ACTION_ENFORCE,
                "{\"applyOn\":\"public_share\"}");
    }

    @Transactional(readOnly = true)
    public boolean isEnforced(UUID organizationId, String code) {
        return policyRepository.findByOrganizationIdAndCode(organizationId, code)
                .filter(SecurityPolicyEntity::isEnabled)
                .map(p -> ACTION_ENFORCE.equalsIgnoreCase(p.getAction()))
                .orElse(false);
    }

    @Transactional(readOnly = true)
    public List<SecurityPolicyView> listForCurrentOrg() {
        AuthUserPrincipal principal = SecurityContextHelper.requirePrincipal();
        return policyRepository.findByOrganizationIdOrderByCodeAsc(principal.getOrganizationId())
                .stream()
                .map(p -> new SecurityPolicyView(
                        p.getId(), p.getCode(), p.getAction(), p.isEnabled(), p.getConfigJson(), p.getCreatedAt()))
                .toList();
    }

    private void upsert(UUID organizationId, String code, String action, String configJson) {
        SecurityPolicyEntity entity = policyRepository.findByOrganizationIdAndCode(organizationId, code)
                .orElseGet(SecurityPolicyEntity::new);
        boolean created = entity.getId() == null;
        entity.setOrganizationId(organizationId);
        entity.setCode(code);
        entity.setAction(action);
        entity.setConfigJson(configJson);
        entity.setEnabled(true);
        policyRepository.save(entity);
        if (created) {
            auditService.recordAnonymous(
                    organizationId, null, "POLICY_SEED", "security_policy", code,
                    "SUCCESS", null, null, "{\"action\":\"" + action + "\"}");
        }
    }
}
