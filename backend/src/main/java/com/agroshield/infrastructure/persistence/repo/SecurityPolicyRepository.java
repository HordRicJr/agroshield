package com.agroshield.infrastructure.persistence.repo;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.agroshield.infrastructure.persistence.entity.SecurityPolicyEntity;

public interface SecurityPolicyRepository extends JpaRepository<SecurityPolicyEntity, UUID> {

    List<SecurityPolicyEntity> findByOrganizationIdOrderByCodeAsc(UUID organizationId);

    Optional<SecurityPolicyEntity> findByOrganizationIdAndCode(UUID organizationId, String code);

    boolean existsByOrganizationIdAndCodeAndEnabledTrue(UUID organizationId, String code);
}
