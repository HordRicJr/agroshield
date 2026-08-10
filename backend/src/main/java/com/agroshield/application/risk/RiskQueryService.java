package com.agroshield.application.risk;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.agroshield.application.risk.dto.RiskAssessmentView;
import com.agroshield.application.security.SecurityContextHelper;
import com.agroshield.infrastructure.persistence.entity.RiskAssessmentEntity;
import com.agroshield.infrastructure.persistence.entity.RiskFactorEntity;
import com.agroshield.infrastructure.persistence.repo.RiskAssessmentRepository;
import com.agroshield.infrastructure.persistence.repo.RiskFactorRepository;
import com.agroshield.infrastructure.security.AuthUserPrincipal;

@Service
public class RiskQueryService {

    private final RiskAssessmentRepository assessmentRepository;
    private final RiskFactorRepository factorRepository;

    public RiskQueryService(
            RiskAssessmentRepository assessmentRepository,
            RiskFactorRepository factorRepository) {
        this.assessmentRepository = assessmentRepository;
        this.factorRepository = factorRepository;
    }

    @Transactional(readOnly = true)
    public List<RiskAssessmentView> listRecent() {
        AuthUserPrincipal principal = SecurityContextHelper.requirePrincipal();
        return assessmentRepository
                .findTop20ByOrganizationIdOrderByCreatedAtDesc(principal.getOrganizationId())
                .stream()
                .map(this::toView)
                .toList();
    }

    private RiskAssessmentView toView(RiskAssessmentEntity entity) {
        List<RiskAssessmentView.RiskFactorView> factors = factorRepository
                .findByRiskAssessmentId(entity.getId())
                .stream()
                .map(this::toFactor)
                .toList();
        return new RiskAssessmentView(
                entity.getId(),
                entity.getSource(),
                entity.getRiskScore(),
                entity.getRiskLevel(),
                entity.getAiPredictionId(),
                entity.getExplanation(),
                entity.getCreatedAt(),
                factors);
    }

    private RiskAssessmentView.RiskFactorView toFactor(RiskFactorEntity f) {
        return new RiskAssessmentView.RiskFactorView(
                f.getFactor(), f.getDescription(), f.getWeight(), f.getSource());
    }
}
