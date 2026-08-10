package com.agroshield.application.security;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.agroshield.application.ai.AiPredictionRecorder;
import com.agroshield.application.ai.AiServicePort;
import com.agroshield.application.ai.fallback.LocalFraudFallback;
import com.agroshield.application.audit.AuditService;
import com.agroshield.application.incident.IncidentAlertService;
import com.agroshield.application.risk.PlatformRiskEngine;
import com.agroshield.application.risk.RiskAssessmentService;
import com.agroshield.application.security.dto.AnalyzeMessageResult;
import com.agroshield.domain.risk.PlatformRiskDecision;
import com.agroshield.domain.security.ContentHasher;
import com.agroshield.infrastructure.ai.AiServiceException;
import com.agroshield.infrastructure.ai.dto.AnalyzeMessageRequest;
import com.agroshield.infrastructure.ai.dto.AnalyzeMessageResponse;
import com.agroshield.infrastructure.security.AuthUserPrincipal;

import io.github.resilience4j.circuitbreaker.CallNotPermittedException;

@Service
public class AnalyzeMessageService {

    private static final Logger log = LoggerFactory.getLogger(AnalyzeMessageService.class);

    private final AiServicePort aiServicePort;
    private final LocalFraudFallback localFraudFallback;
    private final AiPredictionRecorder predictionRecorder;
    private final AuditService auditService;
    private final ContentHasher contentHasher;
    private final PlatformRiskEngine riskEngine;
    private final RiskAssessmentService riskAssessmentService;
    private final IncidentAlertService incidentAlertService;

    public AnalyzeMessageService(
            AiServicePort aiServicePort,
            LocalFraudFallback localFraudFallback,
            AiPredictionRecorder predictionRecorder,
            AuditService auditService,
            ContentHasher contentHasher,
            PlatformRiskEngine riskEngine,
            RiskAssessmentService riskAssessmentService,
            IncidentAlertService incidentAlertService) {
        this.aiServicePort = aiServicePort;
        this.localFraudFallback = localFraudFallback;
        this.predictionRecorder = predictionRecorder;
        this.auditService = auditService;
        this.contentHasher = contentHasher;
        this.riskEngine = riskEngine;
        this.riskAssessmentService = riskAssessmentService;
        this.incidentAlertService = incidentAlertService;
    }

    @Transactional
    public AnalyzeMessageResult analyze(AnalyzeMessageRequest request) {
        AuthUserPrincipal principal = SecurityContextHelper.requirePrincipal();
        String inputHash = contentHasher.sha256Hex(
                request.channel() + "|" + request.language() + "|" + request.content());

        boolean degraded = false;
        AnalyzeMessageResponse ai;
        try {
            ai = aiServicePort.analyzeMessage(request);
        } catch (CallNotPermittedException | AiServiceException ex) {
            log.warn("fraud_fallback reason={}", ex.getClass().getSimpleName());
            ai = localFraudFallback.analyze(request);
            degraded = true;
        }

        UUID predictionId = predictionRecorder.save(
                principal,
                "ANALYZE_MESSAGE",
                degraded ? "local-rules" : "ai-service-fraud-guard",
                degraded ? "fallback-1" : "v1",
                inputHash,
                BigDecimal.valueOf(ai.score()),
                BigDecimal.valueOf(ai.confidence()).setScale(4, RoundingMode.HALF_UP),
                ai.riskLevel().name(),
                ai);

        long openIncidents = incidentAlertService.countOpenIncidentsLast7Days(principal.getOrganizationId());
        PlatformRiskDecision decision = riskEngine.evaluate(ai, request.channel(), degraded, openIncidents);

        UUID riskAssessmentId = riskAssessmentService.persist(
                principal, "ANALYZE_MESSAGE", predictionId, decision);

        var escalation = incidentAlertService.escalateIfNeeded(
                principal, decision, predictionId, riskAssessmentId);

        auditService.record(
                principal,
                "SECURITY_ANALYZE_MESSAGE",
                "risk_assessment",
                riskAssessmentId.toString(),
                degraded ? "DEGRADED" : "SUCCESS",
                decision.score(),
                decision.riskLevel().name(),
                "{\"channel\":\"" + request.channel()
                        + "\",\"degraded\":" + degraded
                        + ",\"action\":\"" + decision.recommendedAction().name()
                        + "\",\"inputHashPrefix\":\"" + inputHash.substring(0, 12) + "\"}");

        return new AnalyzeMessageResult(
                ai.riskLevel(),
                ai.score(),
                ai.signals(),
                ai.modelCategories(),
                ai.recommendation(),
                ai.confidence(),
                ai.stub(),
                degraded,
                predictionId,
                decision.riskLevel(),
                decision.score(),
                decision.recommendedAction(),
                decision.explanation(),
                riskAssessmentId,
                escalation.incidentId(),
                escalation.alertId());
    }
}
