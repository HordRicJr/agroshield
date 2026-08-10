package com.agroshield.interfaces.rest;

import java.util.Map;

import org.slf4j.MDC;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.agroshield.infrastructure.persistence.repo.OrganizationRepository;
import com.agroshield.infrastructure.persistence.repo.PermissionRepository;
import com.agroshield.infrastructure.persistence.repo.RoleRepository;
import com.agroshield.infrastructure.security.CorrelationIdFilter;
import com.agroshield.interfaces.rest.dto.ApiResponse;

@RestController
@RequestMapping("/api/v1/system")
public class SystemSchemaController {

    private final OrganizationRepository organizationRepository;
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;

    public SystemSchemaController(
            OrganizationRepository organizationRepository,
            RoleRepository roleRepository,
            PermissionRepository permissionRepository) {
        this.organizationRepository = organizationRepository;
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
    }

    @GetMapping("/schema-status")
    public ApiResponse<Map<String, Object>> schemaStatus() {
        return ApiResponse.ok(Map.of(
                "organizations", organizationRepository.count(),
                "roles", roleRepository.count(),
                "permissions", permissionRepository.count(),
                "flyway", "V1 applied if counts roles=6 permissions=10"), correlationId());
    }

    private static String correlationId() {
        String id = MDC.get(CorrelationIdFilter.MDC_KEY);
        return id != null ? id : "unknown";
    }
}
