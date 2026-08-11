package com.agroshield.infrastructure.persistence.repo;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.agroshield.infrastructure.persistence.entity.TrainingModuleEntity;

public interface TrainingModuleRepository extends JpaRepository<TrainingModuleEntity, UUID> {

    List<TrainingModuleEntity> findAllByOrderByTopicAscTitleAsc();

    boolean existsByCodeIgnoreCase(String code);
}
