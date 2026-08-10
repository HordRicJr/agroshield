package com.agroshield.application.share.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public final class ShareDtos {

    private ShareDtos() {
    }

    public record CreateShareRequest(
            @NotNull UUID fileId,
            @Size(max = 255) String label,
            @Size(max = 50) List<@Size(max = 128) String> allowedColumns,
            @Min(5) @Max(10080) Integer ttlMinutes
    ) {
    }

    public record CreateShareResponse(
            UUID shareId,
            String token,
            Instant expiresAt,
            List<String> allowedColumns,
            String note
    ) {
    }

    public record RevokeShareResponse(
            UUID shareId,
            boolean revoked
    ) {
    }

    /** Vue publique : métadonnées + colonnes autorisées — jamais le binaire. */
    public record PublicShareView(
            String label,
            String originalName,
            long sizeBytes,
            String sha256Hex,
            List<String> allowedColumns,
            Instant expiresAt,
            String accessMode
    ) {
    }
}
