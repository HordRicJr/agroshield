package com.agroshield.application.files;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.agroshield.application.audit.AuditService;
import com.agroshield.application.files.dto.FileMetadataView;
import com.agroshield.application.security.SecurityContextHelper;
import com.agroshield.domain.security.ContentHasher;
import com.agroshield.infrastructure.config.AgroShieldProperties;
import com.agroshield.infrastructure.persistence.entity.FileMetadataEntity;
import com.agroshield.infrastructure.persistence.repo.FileMetadataRepository;
import com.agroshield.infrastructure.security.AuthUserPrincipal;

@Service
public class FileStorageService {

    private final FileMetadataRepository fileRepository;
    private final ContentHasher contentHasher;
    private final AuditService auditService;
    private final Path basePath;
    private final long maxFileBytes;

    public FileStorageService(
            FileMetadataRepository fileRepository,
            ContentHasher contentHasher,
            AuditService auditService,
            AgroShieldProperties properties) {
        this.fileRepository = fileRepository;
        this.contentHasher = contentHasher;
        this.auditService = auditService;
        this.basePath = Path.of(properties.storage().basePath()).toAbsolutePath().normalize();
        this.maxFileBytes = properties.storage().maxFileBytes();
        try {
            Files.createDirectories(this.basePath);
        } catch (IOException e) {
            throw new IllegalStateException("Cannot create storage directory: " + this.basePath, e);
        }
    }

    @Transactional
    public FileMetadataView upload(MultipartFile file) {
        AuthUserPrincipal principal = SecurityContextHelper.requirePrincipal();
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Fichier vide");
        }
        if (file.getSize() > maxFileBytes) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "Fichier trop volumineux");
        }

        String original = sanitizeName(file.getOriginalFilename());
        String storedName = UUID.randomUUID() + "_" + original;
        Path orgDir = basePath.resolve(principal.getOrganizationId().toString());
        Path target = orgDir.resolve(storedName).normalize();
        if (!target.startsWith(orgDir)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nom de fichier invalide");
        }

        try {
            Files.createDirectories(orgDir);
            try (InputStream in = file.getInputStream()) {
                Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
            }
            byte[] bytes = Files.readAllBytes(target);
            String sha = contentHasher.sha256Hex(bytes);

            FileMetadataEntity entity = new FileMetadataEntity();
            entity.setOrganizationId(principal.getOrganizationId());
            entity.setUploadedBy(principal.getUserId());
            entity.setOriginalName(original);
            entity.setStoredName(storedName);
            entity.setContentType(file.getContentType());
            entity.setSizeBytes(bytes.length);
            entity.setSha256Hex(sha);
            entity.setStoragePath(target.toString());
            entity = fileRepository.save(entity);

            auditService.record(principal, "FILE_UPLOAD", "file", entity.getId().toString(),
                    "SUCCESS", null, null,
                    "{\"sha256Prefix\":\"" + sha.substring(0, 12) + "\",\"size\":" + bytes.length + "}");
            return toView(entity);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Échec stockage fichier");
        }
    }

    @Transactional(readOnly = true)
    public List<FileMetadataView> list() {
        AuthUserPrincipal principal = SecurityContextHelper.requirePrincipal();
        return fileRepository.findByOrganizationIdOrderByCreatedAtDesc(principal.getOrganizationId())
                .stream().map(this::toView).toList();
    }

    @Transactional(readOnly = true)
    public FileMetadataView get(UUID id) {
        return toView(requireOwned(id));
    }

    @Transactional(readOnly = true)
    public Resource loadContent(UUID id) {
        FileMetadataEntity meta = requireOwned(id);
        Path path = Path.of(meta.getStoragePath());
        if (!Files.isRegularFile(path)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Contenu fichier introuvable");
        }
        return new FileSystemResource(path);
    }

    @Transactional(readOnly = true)
    public FileMetadataEntity requireOwned(UUID id) {
        AuthUserPrincipal principal = SecurityContextHelper.requirePrincipal();
        return fileRepository.findByIdAndOrganizationId(id, principal.getOrganizationId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Fichier introuvable"));
    }

    @Transactional
    public void delete(UUID id) {
        AuthUserPrincipal principal = SecurityContextHelper.requirePrincipal();
        FileMetadataEntity meta = requireOwned(id);
        try {
            Files.deleteIfExists(Path.of(meta.getStoragePath()));
        } catch (IOException ignored) {
            // métadonnées supprimées quand même
        }
        fileRepository.delete(meta);
        auditService.record(principal, "FILE_DELETE", "file", id.toString(), "SUCCESS", null, null, null);
    }

    private static String sanitizeName(String name) {
        if (name == null || name.isBlank()) {
            return "upload.bin";
        }
        String cleaned = name.replaceAll("[\\\\/]+", "_").trim();
        if (cleaned.length() > 200) {
            cleaned = cleaned.substring(cleaned.length() - 200);
        }
        return cleaned.toLowerCase(Locale.ROOT);
    }

    private FileMetadataView toView(FileMetadataEntity e) {
        return new FileMetadataView(
                e.getId(),
                e.getOriginalName(),
                e.getContentType(),
                e.getSizeBytes(),
                e.getSha256Hex(),
                e.getCreatedAt());
    }
}
