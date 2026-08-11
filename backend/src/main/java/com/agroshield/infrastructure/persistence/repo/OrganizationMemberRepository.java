package com.agroshield.infrastructure.persistence.repo;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.agroshield.infrastructure.persistence.entity.OrganizationMemberEntity;

public interface OrganizationMemberRepository extends JpaRepository<OrganizationMemberEntity, UUID> {
    List<OrganizationMemberEntity> findByOrganizationId(UUID organizationId);
    List<OrganizationMemberEntity> findByUserId(UUID userId);
    Optional<OrganizationMemberEntity> findByOrganizationIdAndUserId(UUID organizationId, UUID userId);
}
