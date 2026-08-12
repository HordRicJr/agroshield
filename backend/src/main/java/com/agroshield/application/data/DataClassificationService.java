package com.agroshield.application.data;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.agroshield.application.audit.AuditService;
import com.agroshield.application.data.dto.DataClassificationDtos.ClassificationView;
import com.agroshield.application.data.dto.DataClassificationDtos.ReclassifyRequest;
import com.agroshield.application.security.SecurityContextHelper;
import com.agroshield.infrastructure.ai.dto.DataCategory;
import com.agroshield.infrastructure.persistence.entity.DataClassificationEntity;
import com.agroshield.infrastructure.persistence.repo.DataClassificationRepository;
import com.agroshield.infrastructure.security.AuthUserPrincipal;

/** Consultation et correction humaine des classifications persistées (« l'IA ne doit pas avoir le dernier mot »). */
@Service
public class DataClassificationService {

    private final DataClassificationRepository classificationRepository;
    private final AuditService auditService;

    public DataClassificationService(
            DataClassificationRepository classificationRepository, AuditService auditService) {
        this.classificationRepository = classificationRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<ClassificationView> listRecent() {
        AuthUserPrincipal principal = SecurityContextHelper.requirePrincipal();
        return classificationRepository
                .findTop200ByOrganizationIdOrderByCreatedAtDesc(principal.getOrganizationId())
                .stream()
                .map(this::toView)
                .toList();
    }

    @Transactional
    public ClassificationView reclassify(UUID id, ReclassifyRequest request) {
        AuthUserPrincipal principal = SecurityContextHelper.requirePrincipal();
        DataClassificationEntity entity = classificationRepository
                .findByIdAndOrganizationId(id, principal.getOrganizationId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Classification introuvable"));

        String normalized = request.classification().trim().toUpperCase();
        try {
            DataCategory.valueOf(normalized);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Catégorie inconnue : " + normalized);
        }

        entity.setClassification(normalized);
        entity.setHumanValidated(true);
        entity = classificationRepository.save(entity);

        auditService.record(principal, "DATA_RECLASSIFY", "data_classification", id.toString(),
                "SUCCESS", null, null, "{\"classification\":\"" + normalized + "\"}");

        return toView(entity);
    }

    private ClassificationView toView(DataClassificationEntity e) {
        return new ClassificationView(
                e.getId(),
                e.getFileId(),
                e.getColumnName(),
                e.getClassification(),
                e.getRiskLevel(),
                e.getConfidence() == null ? null : e.getConfidence().doubleValue(),
                e.getMethod(),
                e.isHumanValidated(),
                e.getCreatedAt());
    }
}
