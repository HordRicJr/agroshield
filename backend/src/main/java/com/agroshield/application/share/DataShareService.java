package com.agroshield.application.share;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.agroshield.application.audit.AuditService;
import com.agroshield.application.files.FileStorageService;
import com.agroshield.application.security.SecurityContextHelper;
import com.agroshield.application.share.dto.ShareDtos.CreateShareRequest;
import com.agroshield.application.share.dto.ShareDtos.CreateShareResponse;
import com.agroshield.application.share.dto.ShareDtos.PublicShareView;
import com.agroshield.application.share.dto.ShareDtos.RevokeShareResponse;
import com.agroshield.application.share.dto.ShareDtos.ShareSummaryView;
import com.agroshield.domain.security.ContentHasher;
import com.agroshield.infrastructure.persistence.entity.DataShareEntity;
import com.agroshield.infrastructure.persistence.entity.FileMetadataEntity;
import com.agroshield.infrastructure.persistence.repo.DataShareRepository;
import com.agroshield.infrastructure.persistence.repo.FileMetadataRepository;
import com.agroshield.infrastructure.security.AuthUserPrincipal;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class DataShareService {

    private final DataShareRepository shareRepository;
    private final FileMetadataRepository fileRepository;
    private final FileStorageService fileStorageService;
    private final ContentHasher contentHasher;
    private final AuditService auditService;
    private final ObjectMapper objectMapper;
    private final SecureRandom secureRandom = new SecureRandom();

    public DataShareService(
            DataShareRepository shareRepository,
            FileMetadataRepository fileRepository,
            FileStorageService fileStorageService,
            ContentHasher contentHasher,
            AuditService auditService,
            ObjectMapper objectMapper) {
        this.shareRepository = shareRepository;
        this.fileRepository = fileRepository;
        this.fileStorageService = fileStorageService;
        this.contentHasher = contentHasher;
        this.auditService = auditService;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public CreateShareResponse create(CreateShareRequest request) {
        AuthUserPrincipal principal = SecurityContextHelper.requirePrincipal();
        FileMetadataEntity file = fileStorageService.requireOwned(request.fileId());

        List<String> columns = request.allowedColumns() == null ? List.of() : List.copyOf(request.allowedColumns());
        int ttl = request.ttlMinutes() == null ? 60 : request.ttlMinutes();
        String token = generateToken();
        String tokenHash = contentHasher.sha256Hex(token);

        DataShareEntity entity = new DataShareEntity();
        entity.setOrganizationId(principal.getOrganizationId());
        entity.setCreatedBy(principal.getUserId());
        entity.setFileId(file.getId());
        entity.setTokenHash(tokenHash);
        entity.setLabel(request.label());
        entity.setAllowedColumns(toJson(columns));
        entity.setExpiresAt(Instant.now().plus(ttl, ChronoUnit.MINUTES));
        entity = shareRepository.save(entity);

        auditService.record(principal, "DATA_SHARE_CREATE", "data_share", entity.getId().toString(),
                "SUCCESS", null, null,
                "{\"fileId\":\"" + file.getId() + "\",\"columns\":" + columns.size() + "}");

        return new CreateShareResponse(
                entity.getId(),
                token,
                "/api/v1/public/shares/" + token,
                entity.getExpiresAt(),
                columns,
                "Acces metadonnees + colonnes autorisees uniquement — pas de telechargement du fichier complet.");
    }

    @Transactional(readOnly = true)
    public List<ShareSummaryView> list() {
        AuthUserPrincipal principal = SecurityContextHelper.requirePrincipal();
        return shareRepository
                .findTop50ByOrganizationIdOrderByCreatedAtDesc(principal.getOrganizationId())
                .stream()
                .map(s -> new ShareSummaryView(
                        s.getId(),
                        s.getFileId(),
                        s.getLabel(),
                        fromJson(s.getAllowedColumns()),
                        s.getExpiresAt(),
                        s.getRevokedAt(),
                        s.getCreatedAt()))
                .toList();
    }

    @Transactional
    public PublicShareView resolvePublic(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Partage introuvable");
        }
        String decoded = java.net.URLDecoder.decode(rawToken.trim(), java.nio.charset.StandardCharsets.UTF_8);
        String hash = contentHasher.sha256Hex(decoded);
        DataShareEntity share = shareRepository.findByTokenHashAndRevokedAtIsNull(hash)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Partage introuvable"));
        if (share.getExpiresAt().isBefore(Instant.now())) {
            throw new ResponseStatusException(HttpStatus.GONE, "Partage expire");
        }
        FileMetadataEntity file = fileRepository.findById(share.getFileId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Fichier introuvable"));

        auditService.recordAnonymous(
                share.getOrganizationId(), null, "DATA_SHARE_ACCESS", "data_share", share.getId().toString(),
                "SUCCESS", null, null, null);

        return new PublicShareView(
                share.getLabel(),
                file.getOriginalName(),
                file.getSizeBytes(),
                file.getSha256Hex(),
                fromJson(share.getAllowedColumns()),
                share.getExpiresAt(),
                "METADATA_ONLY");
    }

    @Transactional
    public RevokeShareResponse revoke(UUID shareId) {
        AuthUserPrincipal principal = SecurityContextHelper.requirePrincipal();
        DataShareEntity share = shareRepository.findByIdAndOrganizationId(shareId, principal.getOrganizationId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Partage introuvable"));
        share.setRevokedAt(Instant.now());
        shareRepository.save(share);
        auditService.record(principal, "DATA_SHARE_REVOKE", "data_share", shareId.toString(),
                "SUCCESS", null, null, null);
        return new RevokeShareResponse(shareId, true);
    }

    private String generateToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String toJson(List<String> columns) {
        try {
            return objectMapper.writeValueAsString(columns);
        } catch (JsonProcessingException e) {
            return "[]";
        }
    }

    private List<String> fromJson(String json) {
        try {
            return objectMapper.readValue(json, new TypeReference<>() {
            });
        } catch (JsonProcessingException e) {
            return List.of();
        }
    }
}
