package com.agroshield.infrastructure.persistence.repo;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.agroshield.infrastructure.persistence.entity.AlertEntity;

public interface AlertRepository extends JpaRepository<AlertEntity, UUID> {

    List<AlertEntity> findTop50ByOrganizationIdOrderByCreatedAtDesc(UUID organizationId);

    long countByOrganizationIdAndAcknowledgedAtIsNull(UUID organizationId);
}
