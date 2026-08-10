package com.agroshield.infrastructure.persistence.repo;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.agroshield.infrastructure.persistence.entity.RiskAssessmentEntity;

public interface RiskAssessmentRepository extends JpaRepository<RiskAssessmentEntity, UUID> {

    List<RiskAssessmentEntity> findTop20ByOrganizationIdOrderByCreatedAtDesc(UUID organizationId);
}
