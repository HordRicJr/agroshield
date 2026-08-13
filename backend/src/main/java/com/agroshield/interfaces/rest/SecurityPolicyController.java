package com.agroshield.interfaces.rest;

import java.util.List;

import org.slf4j.MDC;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.agroshield.application.policy.SecurityPolicyService;
import com.agroshield.application.policy.dto.SecurityPolicyView;
import com.agroshield.infrastructure.security.CorrelationIdFilter;
import com.agroshield.interfaces.rest.dto.ApiResponse;

@RestController
@Validated
@RequestMapping("/api/v1/security/policies")
public class SecurityPolicyController {

    private final SecurityPolicyService securityPolicyService;

    public SecurityPolicyController(SecurityPolicyService securityPolicyService) {
        this.securityPolicyService = securityPolicyService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('DATA_READ') or hasAuthority('SECURITY_VIEW') or hasAuthority('AUDIT_VIEW')")
    public ApiResponse<List<SecurityPolicyView>> list() {
        return ApiResponse.ok(securityPolicyService.listForCurrentOrg(), corr());
    }

    private static String corr() {
        String id = MDC.get(CorrelationIdFilter.MDC_KEY);
        return id != null ? id : "unknown";
    }
}
