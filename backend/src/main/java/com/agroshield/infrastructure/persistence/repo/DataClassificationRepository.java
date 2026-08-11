package com.agroshield.infrastructure.persistence.repo;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.agroshield.infrastructure.persistence.entity.DataClassificationEntity;

public interface DataClassificationRepository extends JpaRepository<DataClassificationEntity, UUID> {

    List<DataClassificationEntity> findTop200ByOrganizationIdOrderByCreatedAtDesc(UUID organizationId);

    Optional<DataClassificationEntity> findByIdAndOrganizationId(UUID id, UUID organizationId);

    long countByOrganizationIdAndHumanValidatedFalseAndRiskLevelIn(UUID organizationId, List<String> riskLevels);
}
