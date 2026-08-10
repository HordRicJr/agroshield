package com.agroshield.infrastructure.persistence.repo;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.agroshield.infrastructure.persistence.entity.AiPredictionEntity;

public interface AiPredictionRepository extends JpaRepository<AiPredictionEntity, UUID> {
}
