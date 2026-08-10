package com.agroshield.infrastructure.persistence.repo;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.agroshield.infrastructure.persistence.entity.FarmEntity;

public interface FarmRepository extends JpaRepository<FarmEntity, UUID> {

    List<FarmEntity> findByOrganizationIdOrderByCreatedAtDesc(UUID organizationId);

    Optional<FarmEntity> findByIdAndOrganizationId(UUID id, UUID organizationId);

    List<FarmEntity> findByOrganizationIdAndProducerId(UUID organizationId, UUID producerId);
}
