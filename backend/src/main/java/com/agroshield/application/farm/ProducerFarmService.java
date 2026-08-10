package com.agroshield.application.farm;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.agroshield.application.audit.AuditService;
import com.agroshield.application.farm.dto.FarmDtos.CreateFarmRequest;
import com.agroshield.application.farm.dto.FarmDtos.FarmView;
import com.agroshield.application.farm.dto.FarmDtos.UpdateFarmRequest;
import com.agroshield.application.farm.dto.ProducerDtos.CreateProducerRequest;
import com.agroshield.application.farm.dto.ProducerDtos.ProducerView;
import com.agroshield.application.farm.dto.ProducerDtos.UpdateProducerRequest;
import com.agroshield.application.security.SecurityContextHelper;
import com.agroshield.infrastructure.persistence.entity.FarmEntity;
import com.agroshield.infrastructure.persistence.entity.ProducerEntity;
import com.agroshield.infrastructure.persistence.repo.FarmRepository;
import com.agroshield.infrastructure.persistence.repo.ProducerRepository;
import com.agroshield.infrastructure.security.AuthUserPrincipal;

@Service
public class ProducerFarmService {

    private final ProducerRepository producerRepository;
    private final FarmRepository farmRepository;
    private final AuditService auditService;

    public ProducerFarmService(
            ProducerRepository producerRepository,
            FarmRepository farmRepository,
            AuditService auditService) {
        this.producerRepository = producerRepository;
        this.farmRepository = farmRepository;
        this.auditService = auditService;
    }

    @Transactional
    public ProducerView createProducer(CreateProducerRequest request) {
        AuthUserPrincipal principal = SecurityContextHelper.requirePrincipal();
        String code = request.code().trim().toUpperCase(Locale.ROOT);
        if (producerRepository.existsByOrganizationIdAndCodeIgnoreCase(principal.getOrganizationId(), code)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Code producteur déjà utilisé");
        }
        ProducerEntity entity = new ProducerEntity();
        entity.setOrganizationId(principal.getOrganizationId());
        entity.setCode(code);
        entity.setDisplayName(request.displayName().trim());
        entity = producerRepository.save(entity);
        auditService.record(principal, "PRODUCER_CREATE", "producer", entity.getId().toString(),
                "SUCCESS", null, null, null);
        return toProducer(entity);
    }

    @Transactional(readOnly = true)
    public List<ProducerView> listProducers() {
        AuthUserPrincipal principal = SecurityContextHelper.requirePrincipal();
        return producerRepository.findByOrganizationIdOrderByCreatedAtDesc(principal.getOrganizationId())
                .stream().map(this::toProducer).toList();
    }

    @Transactional(readOnly = true)
    public ProducerView getProducer(UUID id) {
        return toProducer(requireProducer(id));
    }

    @Transactional
    public ProducerView updateProducer(UUID id, UpdateProducerRequest request) {
        AuthUserPrincipal principal = SecurityContextHelper.requirePrincipal();
        ProducerEntity entity = requireProducer(id);
        entity.setDisplayName(request.displayName().trim());
        entity = producerRepository.save(entity);
        auditService.record(principal, "PRODUCER_UPDATE", "producer", id.toString(),
                "SUCCESS", null, null, null);
        return toProducer(entity);
    }

    @Transactional
    public void deleteProducer(UUID id) {
        AuthUserPrincipal principal = SecurityContextHelper.requirePrincipal();
        ProducerEntity entity = requireProducer(id);
        producerRepository.delete(entity);
        auditService.record(principal, "PRODUCER_DELETE", "producer", id.toString(),
                "SUCCESS", null, null, null);
    }

    @Transactional
    public FarmView createFarm(CreateFarmRequest request) {
        AuthUserPrincipal principal = SecurityContextHelper.requirePrincipal();
        if (request.producerId() != null) {
            requireProducer(request.producerId());
        }
        FarmEntity entity = new FarmEntity();
        entity.setOrganizationId(principal.getOrganizationId());
        entity.setProducerId(request.producerId());
        entity.setName(request.name().trim());
        entity = farmRepository.save(entity);
        auditService.record(principal, "FARM_CREATE", "farm", entity.getId().toString(),
                "SUCCESS", null, null, null);
        return toFarm(entity);
    }

    @Transactional(readOnly = true)
    public List<FarmView> listFarms() {
        AuthUserPrincipal principal = SecurityContextHelper.requirePrincipal();
        return farmRepository.findByOrganizationIdOrderByCreatedAtDesc(principal.getOrganizationId())
                .stream().map(this::toFarm).toList();
    }

    @Transactional(readOnly = true)
    public FarmView getFarm(UUID id) {
        return toFarm(requireFarm(id));
    }

    @Transactional
    public FarmView updateFarm(UUID id, UpdateFarmRequest request) {
        AuthUserPrincipal principal = SecurityContextHelper.requirePrincipal();
        FarmEntity entity = requireFarm(id);
        if (request.producerId() != null) {
            requireProducer(request.producerId());
        }
        entity.setName(request.name().trim());
        entity.setProducerId(request.producerId());
        entity = farmRepository.save(entity);
        auditService.record(principal, "FARM_UPDATE", "farm", id.toString(),
                "SUCCESS", null, null, null);
        return toFarm(entity);
    }

    @Transactional
    public void deleteFarm(UUID id) {
        AuthUserPrincipal principal = SecurityContextHelper.requirePrincipal();
        FarmEntity entity = requireFarm(id);
        farmRepository.delete(entity);
        auditService.record(principal, "FARM_DELETE", "farm", id.toString(),
                "SUCCESS", null, null, null);
    }

    private ProducerEntity requireProducer(UUID id) {
        AuthUserPrincipal principal = SecurityContextHelper.requirePrincipal();
        return producerRepository.findByIdAndOrganizationId(id, principal.getOrganizationId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Producteur introuvable"));
    }

    private FarmEntity requireFarm(UUID id) {
        AuthUserPrincipal principal = SecurityContextHelper.requirePrincipal();
        return farmRepository.findByIdAndOrganizationId(id, principal.getOrganizationId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Exploitation introuvable"));
    }

    private ProducerView toProducer(ProducerEntity e) {
        return new ProducerView(e.getId(), e.getCode(), e.getDisplayName(), e.getCreatedAt());
    }

    private FarmView toFarm(FarmEntity e) {
        return new FarmView(e.getId(), e.getName(), e.getProducerId(), e.getCreatedAt());
    }
}
