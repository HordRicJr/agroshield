package com.agroshield.application.data;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.StringJoiner;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.agroshield.application.ai.AiPredictionRecorder;
import com.agroshield.application.ai.AiServicePort;
import com.agroshield.application.ai.fallback.LocalClassifyFallback;
import com.agroshield.application.audit.AuditService;
import com.agroshield.application.data.dto.ClassifyDataResult;
import com.agroshield.application.security.SecurityContextHelper;
import com.agroshield.domain.security.ContentHasher;
import com.agroshield.infrastructure.ai.AiServiceException;
import com.agroshield.infrastructure.ai.dto.ClassifyRequest;
import com.agroshield.infrastructure.ai.dto.ClassifyResponse;
import com.agroshield.infrastructure.ai.dto.ColumnClassification;
import com.agroshield.infrastructure.ai.dto.ColumnInput;
import com.agroshield.infrastructure.persistence.entity.DataClassificationEntity;
import com.agroshield.infrastructure.persistence.repo.DataClassificationRepository;
import com.agroshield.infrastructure.security.AuthUserPrincipal;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import io.github.resilience4j.circuitbreaker.CallNotPermittedException;

@Service
public class ClassifyDataService {

    private static final Logger log = LoggerFactory.getLogger(ClassifyDataService.class);

    private final AiServicePort aiServicePort;
    private final LocalClassifyFallback localClassifyFallback;
    private final AiPredictionRecorder predictionRecorder;
    private final DataClassificationRepository classificationRepository;
    private final AuditService auditService;
    private final ContentHasher contentHasher;
    private final ObjectMapper objectMapper;

    public ClassifyDataService(
            AiServicePort aiServicePort,
            LocalClassifyFallback localClassifyFallback,
            AiPredictionRecorder predictionRecorder,
            DataClassificationRepository classificationRepository,
            AuditService auditService,
            ContentHasher contentHasher,
            ObjectMapper objectMapper) {
        this.aiServicePort = aiServicePort;
        this.localClassifyFallback = localClassifyFallback;
        this.predictionRecorder = predictionRecorder;
        this.classificationRepository = classificationRepository;
        this.auditService = auditService;
        this.contentHasher = contentHasher;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public ClassifyDataResult classify(ClassifyRequest request) {
        return classify(request, null);
    }

    @Transactional
    public ClassifyDataResult classify(ClassifyRequest request, UUID fileId) {
        AuthUserPrincipal principal = SecurityContextHelper.requirePrincipal();
        String inputHash = contentHasher.sha256Hex(columnFingerprint(request));

        boolean degraded = false;
        ClassifyResponse aiResponse;
        try {
            aiResponse = aiServicePort.classifyData(request);
        } catch (CallNotPermittedException | AiServiceException ex) {
            log.warn("classify_fallback reason={}", ex.getClass().getSimpleName());
            aiResponse = localClassifyFallback.classify(request);
            degraded = true;
        }

        UUID predictionId = predictionRecorder.save(
                principal,
                "CLASSIFY_DATA",
                degraded ? "local-rules" : "ai-service",
                degraded ? "fallback-1" : "v1",
                inputHash,
                null,
                avgConfidence(aiResponse),
                maxRisk(aiResponse),
                aiResponse);

        for (ColumnClassification col : aiResponse.results()) {
            DataClassificationEntity entity = new DataClassificationEntity();
            entity.setOrganizationId(principal.getOrganizationId());
            entity.setFileId(fileId);
            entity.setColumnName(col.column());
            entity.setClassification(col.classification().name());
            entity.setRiskLevel(col.riskLevel().name());
            entity.setConfidence(BigDecimal.valueOf(col.confidence()).setScale(4, RoundingMode.HALF_UP));
            entity.setMethod(col.method() == null ? null : col.method().name());
            entity.setRecommendedPolicy(toJson(col.recommendedPolicy()));
            entity.setHumanValidated(false);
            classificationRepository.save(entity);
        }

        auditService.record(
                principal,
                "DATA_CLASSIFY",
                "ai_prediction",
                predictionId.toString(),
                degraded ? "DEGRADED" : "SUCCESS",
                null,
                maxRisk(aiResponse),
                "{\"columns\":" + request.columns().size() + ",\"degraded\":" + degraded + "}");

        return new ClassifyDataResult(
                aiResponse.results(),
                maxRisk(aiResponse),
                countSensitive(aiResponse),
                aiResponse.stub(),
                degraded,
                predictionId);
    }

    private static int countSensitive(ClassifyResponse response) {
        if (response.results() == null) {
            return 0;
        }
        return (int) response.results().stream()
                .filter(c -> c.riskLevel() == com.agroshield.infrastructure.ai.dto.RiskLevel.HIGH
                        || c.riskLevel() == com.agroshield.infrastructure.ai.dto.RiskLevel.CRITICAL)
                .count();
    }

    private static String columnFingerprint(ClassifyRequest request) {
        StringJoiner joiner = new StringJoiner("|");
        for (ColumnInput col : request.columns()) {
            joiner.add(col.name() == null ? "" : col.name().toLowerCase());
            joiner.add(String.valueOf(col.samples() == null ? 0 : col.samples().size()));
        }
        return joiner.toString();
    }

    private static BigDecimal avgConfidence(ClassifyResponse response) {
        if (response.results() == null || response.results().isEmpty()) {
            return null;
        }
        double sum = response.results().stream().mapToDouble(ColumnClassification::confidence).sum();
        return BigDecimal.valueOf(sum / response.results().size()).setScale(4, RoundingMode.HALF_UP);
    }

    private static String maxRisk(ClassifyResponse response) {
        if (response.results() == null || response.results().isEmpty()) {
            return "LOW";
        }
        return response.results().stream()
                .map(c -> c.riskLevel().name())
                .max((a, b) -> Integer.compare(rank(a), rank(b)))
                .orElse("LOW");
    }

    private static int rank(String risk) {
        return switch (risk) {
            case "CRITICAL" -> 4;
            case "HIGH" -> 3;
            case "MEDIUM" -> 2;
            default -> 1;
        };
    }

    private String toJson(Object value) {
        if (value == null) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            return null;
        }
    }
}
