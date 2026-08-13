package com.agroshield.application.files.dto;

import java.time.Instant;
import java.util.UUID;

public record FileMetadataView(
        UUID id,
        String originalName,
        String contentType,
        long sizeBytes,
        String sha256Hex,
        boolean encrypted,
        String encryptionAlg,
        Instant createdAt
) {
}
