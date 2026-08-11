package com.agroshield.infrastructure.persistence.repo;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.agroshield.infrastructure.persistence.entity.TrainingResultEntity;

public interface TrainingResultRepository extends JpaRepository<TrainingResultEntity, UUID> {

    List<TrainingResultEntity> findByOrganizationIdAndUserIdOrderByCreatedAtDesc(UUID organizationId, UUID userId);

    List<TrainingResultEntity> findByOrganizationIdOrderByCreatedAtDesc(UUID organizationId);
}
