package com.agroshield.application.risk;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.agroshield.domain.risk.PlatformRiskDecision;
import com.agroshield.domain.risk.RiskFactor;
import com.agroshield.infrastructure.persistence.entity.RiskAssessmentEntity;
import com.agroshield.infrastructure.persistence.entity.RiskFactorEntity;
import com.agroshield.infrastructure.persistence.repo.RiskAssessmentRepository;
import com.agroshield.infrastructure.persistence.repo.RiskFactorRepository;
import com.agroshield.infrastructure.security.AuthUserPrincipal;

@Service
public class RiskAssessmentService {

    private final RiskAssessmentRepository assessmentRepository;
    private final RiskFactorRepository factorRepository;

    public RiskAssessmentService(
            RiskAssessmentRepository assessmentRepository,
            RiskFactorRepository factorRepository) {
        this.assessmentRepository = assessmentRepository;
        this.factorRepository = factorRepository;
    }

    @Transactional
    public UUID persist(
            AuthUserPrincipal principal,
            String source,
            UUID predictionId,
            PlatformRiskDecision decision) {
        RiskAssessmentEntity entity = new RiskAssessmentEntity();
        entity.setOrganizationId(principal.getOrganizationId());
        entity.setUserId(principal.getUserId());
        entity.setSource(source);
        entity.setRiskScore(decision.score());
        entity.setRiskLevel(decision.riskLevel().name());
        entity.setAiPredictionId(predictionId);
        entity.setExplanation(decision.explanation());
        UUID assessmentId = assessmentRepository.save(entity).getId();

        for (RiskFactor factor : decision.factors()) {
            RiskFactorEntity row = new RiskFactorEntity();
            row.setRiskAssessmentId(assessmentId);
            row.setFactor(factor.factor());
            row.setDescription(factor.description());
            row.setWeight(factor.weight());
            row.setSource(factor.source());
            factorRepository.save(row);
        }
        return assessmentId;
    }
}
