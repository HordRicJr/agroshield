package com.agroshield.infrastructure.persistence.repo;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.agroshield.infrastructure.persistence.entity.IncidentEntity;

public interface IncidentRepository extends JpaRepository<IncidentEntity, UUID> {

    List<IncidentEntity> findByOrganizationIdAndStatus(UUID organizationId, String status);

    List<IncidentEntity> findTop50ByOrganizationIdOrderByDetectedAtDesc(UUID organizationId);

    long countByOrganizationIdAndStatusAndDetectedAtAfter(
            UUID organizationId, String status, Instant detectedAt);

    long countByOrganizationIdAndDetectedAtAfter(UUID organizationId, Instant detectedAt);

    long countByOrganizationIdAndStatus(UUID organizationId, String status);

    long countByOrganizationIdAndStatusAndSeverity(UUID organizationId, String status, String severity);
}
