package com.agroshield.infrastructure.persistence.repo;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.agroshield.infrastructure.persistence.entity.ProducerEntity;

public interface ProducerRepository extends JpaRepository<ProducerEntity, UUID> {

    List<ProducerEntity> findByOrganizationIdOrderByCreatedAtDesc(UUID organizationId);

    Optional<ProducerEntity> findByIdAndOrganizationId(UUID id, UUID organizationId);

    boolean existsByOrganizationIdAndCodeIgnoreCase(UUID organizationId, String code);
}
