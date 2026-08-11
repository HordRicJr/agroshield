package com.agroshield.infrastructure.persistence.repo;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.agroshield.infrastructure.persistence.entity.FileMetadataEntity;

public interface FileMetadataRepository extends JpaRepository<FileMetadataEntity, UUID> {

    List<FileMetadataEntity> findByOrganizationIdOrderByCreatedAtDesc(UUID organizationId);

    Optional<FileMetadataEntity> findByIdAndOrganizationId(UUID id, UUID organizationId);

    long countByOrganizationId(UUID organizationId);
}
