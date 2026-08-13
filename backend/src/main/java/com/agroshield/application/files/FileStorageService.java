package com.agroshield.application.files;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.agroshield.application.audit.AuditService;
import com.agroshield.application.files.dto.FileMetadataView;
import com.agroshield.application.policy.SecurityPolicyService;
import com.agroshield.application.security.SecurityContextHelper;
import com.agroshield.domain.security.ContentHasher;
import com.agroshield.domain.security.FileCipher;
import com.agroshield.infrastructure.config.AgroShieldProperties;
import com.agroshield.infrastructure.persistence.entity.FileMetadataEntity;
import com.agroshield.infrastructure.persistence.repo.FileMetadataRepository;
import com.agroshield.infrastructure.security.AuthUserPrincipal;

@Service
public class FileStorageService {

    private final FileMetadataRepository fileRepository;
    private final ContentHasher contentHasher;
    private final FileCipher fileCipher;
    private final SecurityPolicyService securityPolicyService;
    private final AuditService auditService;
    private final Path basePath;
    private final long maxFileBytes;
    private final boolean encryptionEnabled;
    private final String encryptionKeyId;

    public FileStorageService(
            FileMetadataRepository fileRepository,
            ContentHasher contentHasher,
            FileCipher fileCipher,
            SecurityPolicyService securityPolicyService,
            AuditService auditService,
            AgroShieldProperties properties) {
        this.fileRepository = fileRepository;
        this.contentHasher = contentHasher;
        this.fileCipher = fileCipher;
        this.securityPolicyService = securityPolicyService;
        this.auditService = auditService;
        this.basePath = Path.of(properties.storage().basePath()).toAbsolutePath().normalize();
        this.maxFileBytes = properties.storage().maxFileBytes();
        var enc = properties.storage().encryption();
        this.encryptionEnabled = enc != null && enc.enabled();
        this.encryptionKeyId = enc != null && enc.keyId() != null ? enc.keyId() : "local-v1";
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
            byte[] plaintext = file.getBytes();
            String sha = contentHasher.sha256Hex(plaintext);

            boolean encrypt = shouldEncrypt(principal.getOrganizationId());
            byte[] toStore = plaintext;
            String ivB64 = null;
            String alg = null;
            String keyId = null;

            if (encrypt) {
                FileCipher.EncryptedPayload payload = fileCipher.encrypt(plaintext);
                toStore = payload.ciphertext();
                ivB64 = payload.ivBase64();
                alg = payload.algorithm();
                keyId = encryptionKeyId;
            }

            Files.write(target, toStore);

            FileMetadataEntity entity = new FileMetadataEntity();
            entity.setOrganizationId(principal.getOrganizationId());
            entity.setUploadedBy(principal.getUserId());
            entity.setOriginalName(original);
            entity.setStoredName(storedName);
            entity.setContentType(file.getContentType());
            entity.setSizeBytes(plaintext.length);
            entity.setSha256Hex(sha);
            entity.setStoragePath(target.toString());
            entity.setEncrypted(encrypt);
            entity.setEncryptionAlg(alg);
            entity.setIvB64(ivB64);
            entity.setKeyId(keyId);
            entity = fileRepository.save(entity);

            auditService.record(principal, "FILE_UPLOAD", "file", entity.getId().toString(),
                    "SUCCESS", null, null,
                    "{\"sha256Prefix\":\"" + sha.substring(0, 12) + "\",\"size\":" + plaintext.length
                            + ",\"encrypted\":" + encrypt + "}");
            if (encrypt) {
                auditService.record(principal, "FILE_ENCRYPT", "file", entity.getId().toString(),
                        "SUCCESS", null, null,
                        "{\"alg\":\"" + alg + "\",\"keyId\":\"" + keyId + "\"}");
            }
            return toView(entity);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Echec stockage fichier");
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

    @Transactional
    public Resource loadContent(UUID id) {
        AuthUserPrincipal principal = SecurityContextHelper.requirePrincipal();
        FileMetadataEntity meta = requireOwned(id);
        byte[] plain = readPlainBytes(meta);
        auditService.record(principal, "FILE_DOWNLOAD", "file", id.toString(), "SUCCESS", null, null,
                "{\"encrypted\":" + meta.isEncrypted() + "}");
        if (meta.isEncrypted()) {
            auditService.record(principal, "FILE_DECRYPT", "file", id.toString(), "SUCCESS", null, null, null);
        }
        return new ByteArrayResource(plain) {
            @Override
            public String getFilename() {
                return meta.getOriginalName();
            }
        };
    }

    /** Lecture claire (déchiffre si besoin) — analyze / traitements métier. */
    @Transactional(readOnly = true)
    public byte[] readPlainBytes(FileMetadataEntity meta) {
        try {
            Path path = Path.of(meta.getStoragePath());
            if (!Files.isRegularFile(path)) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Contenu fichier introuvable");
            }
            byte[] onDisk = Files.readAllBytes(path);
            if (!meta.isEncrypted()) {
                return onDisk;
            }
            return fileCipher.decrypt(onDisk, meta.getIvB64());
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Lecture du fichier impossible");
        }
    }

    /**
     * Chiffre un fichier encore en clair si une classification / policy l'exige.
     */
    @Transactional
    public void encryptExistingIfNeeded(UUID fileId, boolean requireByClassification) {
        AuthUserPrincipal principal = SecurityContextHelper.requirePrincipal();
        FileMetadataEntity meta = requireOwned(fileId);
        if (meta.isEncrypted()) {
            return;
        }
        boolean enforce = shouldEncrypt(principal.getOrganizationId()) || requireByClassification;
        if (!enforce) {
            return;
        }
        try {
            Path path = Path.of(meta.getStoragePath());
            byte[] plaintext = Files.readAllBytes(path);
            FileCipher.EncryptedPayload payload = fileCipher.encrypt(plaintext);
            Files.write(path, payload.ciphertext());
            meta.setEncrypted(true);
            meta.setEncryptionAlg(payload.algorithm());
            meta.setIvB64(payload.ivBase64());
            meta.setKeyId(encryptionKeyId);
            fileRepository.save(meta);
            auditService.record(principal, "FILE_ENCRYPT", "file", fileId.toString(),
                    "SUCCESS", null, null,
                    "{\"alg\":\"" + payload.algorithm() + "\",\"trigger\":\"post_classify\"}");
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Echec chiffrement post-classification");
        }
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

    private boolean shouldEncrypt(UUID organizationId) {
        return encryptionEnabled
                || securityPolicyService.isEnforced(organizationId, SecurityPolicyService.ENCRYPT_AT_REST);
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
                e.isEncrypted(),
                e.getEncryptionAlg(),
                e.getCreatedAt());
    }
}
