package com.agroshield.application.ai;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.agroshield.infrastructure.persistence.entity.AiPredictionEntity;
import com.agroshield.infrastructure.persistence.repo.AiPredictionRepository;
import com.agroshield.infrastructure.security.AuthUserPrincipal;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class AiPredictionRecorder {

    private final AiPredictionRepository repository;
    private final ObjectMapper objectMapper;

    public AiPredictionRecorder(AiPredictionRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public UUID save(
            AuthUserPrincipal principal,
            String predictionType,
            String modelName,
            String modelVersion,
            String inputHash,
            BigDecimal score,
            BigDecimal confidence,
            String riskLevel,
            Object result) {
        AiPredictionEntity entity = new AiPredictionEntity();
        entity.setOrganizationId(principal.getOrganizationId());
        entity.setUserId(principal.getUserId());
        entity.setPredictionType(predictionType);
        entity.setModelName(modelName);
        entity.setModelVersion(modelVersion);
        entity.setInputHash(inputHash);
        entity.setScore(score);
        entity.setConfidence(scaleConfidence(confidence));
        entity.setRiskLevel(riskLevel);
        entity.setResultJson(toJson(result));
        return repository.save(entity).getId();
    }

    private static BigDecimal scaleConfidence(BigDecimal confidence) {
        if (confidence == null) {
            return null;
        }
        return confidence.setScale(4, RoundingMode.HALF_UP);
    }

    private String toJson(Object result) {
        try {
            return objectMapper.writeValueAsString(result);
        } catch (JsonProcessingException e) {
            return "{\"error\":\"serialization_failed\"}";
        }
    }
}
