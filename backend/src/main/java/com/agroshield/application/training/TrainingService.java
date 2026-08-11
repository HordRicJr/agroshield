package com.agroshield.application.training;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.agroshield.application.audit.AuditService;
import com.agroshield.application.security.SecurityContextHelper;
import com.agroshield.application.training.dto.TrainingDtos.CompleteModuleRequest;
import com.agroshield.application.training.dto.TrainingDtos.CreateModuleRequest;
import com.agroshield.application.training.dto.TrainingDtos.ModuleView;
import com.agroshield.application.training.dto.TrainingDtos.ResultView;
import com.agroshield.infrastructure.persistence.entity.TrainingModuleEntity;
import com.agroshield.infrastructure.persistence.entity.TrainingResultEntity;
import com.agroshield.infrastructure.persistence.repo.TrainingModuleRepository;
import com.agroshield.infrastructure.persistence.repo.TrainingResultRepository;
import com.agroshield.infrastructure.security.AuthUserPrincipal;

@Service
public class TrainingService {

    private final TrainingModuleRepository moduleRepository;
    private final TrainingResultRepository resultRepository;
    private final AuditService auditService;

    public TrainingService(
            TrainingModuleRepository moduleRepository,
            TrainingResultRepository resultRepository,
            AuditService auditService) {
        this.moduleRepository = moduleRepository;
        this.resultRepository = resultRepository;
        this.auditService = auditService;
    }

    @Transactional
    public ModuleView createModule(CreateModuleRequest request) {
        AuthUserPrincipal principal = SecurityContextHelper.requirePrincipal();
        String code = request.code().trim().toUpperCase();
        if (moduleRepository.existsByCodeIgnoreCase(code)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Code module déjà utilisé");
        }
        TrainingModuleEntity entity = new TrainingModuleEntity();
        entity.setCode(code);
        entity.setTitle(request.title().trim());
        entity.setTopic(request.topic().trim());
        entity.setContentUrl(request.contentUrl() == null ? null : request.contentUrl().trim());
        entity = moduleRepository.save(entity);

        auditService.record(principal, "TRAINING_MODULE_CREATE", "training_module", entity.getId().toString(),
                "SUCCESS", null, null, null);
        return toModuleView(entity);
    }

    @Transactional(readOnly = true)
    public List<ModuleView> listModules() {
        return moduleRepository.findAllByOrderByTopicAscTitleAsc().stream().map(this::toModuleView).toList();
    }

    @Transactional
    public ResultView complete(UUID moduleId, CompleteModuleRequest request) {
        AuthUserPrincipal principal = SecurityContextHelper.requirePrincipal();
        if (!moduleRepository.existsById(moduleId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Module introuvable");
        }

        TrainingResultEntity entity = new TrainingResultEntity();
        entity.setOrganizationId(principal.getOrganizationId());
        entity.setUserId(principal.getUserId());
        entity.setModuleId(moduleId);
        entity.setScore(request.score());
        entity.setCompletedAt(Instant.now());
        entity = resultRepository.save(entity);

        auditService.record(principal, "TRAINING_COMPLETE", "training_module", moduleId.toString(),
                "SUCCESS", request.score(), null, null);
        return toResultView(entity);
    }

    @Transactional(readOnly = true)
    public List<ResultView> listMyResults() {
        AuthUserPrincipal principal = SecurityContextHelper.requirePrincipal();
        return resultRepository
                .findByOrganizationIdAndUserIdOrderByCreatedAtDesc(principal.getOrganizationId(), principal.getUserId())
                .stream().map(this::toResultView).toList();
    }

    @Transactional(readOnly = true)
    public List<ResultView> listOrganizationResults() {
        AuthUserPrincipal principal = SecurityContextHelper.requirePrincipal();
        return resultRepository.findByOrganizationIdOrderByCreatedAtDesc(principal.getOrganizationId())
                .stream().map(this::toResultView).toList();
    }

    private ModuleView toModuleView(TrainingModuleEntity e) {
        return new ModuleView(e.getId(), e.getCode(), e.getTitle(), e.getTopic(), e.getContentUrl(), e.getCreatedAt());
    }

    private ResultView toResultView(TrainingResultEntity e) {
        return new ResultView(e.getId(), e.getModuleId(), e.getUserId(), e.getScore(), e.getCompletedAt(), e.getCreatedAt());
    }
}
