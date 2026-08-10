package com.agroshield.infrastructure.persistence.repo;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.agroshield.infrastructure.persistence.entity.DataShareEntity;

public interface DataShareRepository extends JpaRepository<DataShareEntity, UUID> {

    Optional<DataShareEntity> findByTokenHashAndRevokedAtIsNull(String tokenHash);

    Optional<DataShareEntity> findByIdAndOrganizationId(UUID id, UUID organizationId);
}
