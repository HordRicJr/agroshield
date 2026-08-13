package com.agroshield.application.share.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public final class ShareDtos {

    private ShareDtos() {
    }

    /**
     * Accepte camelCase (Swagger Java) et snake_case (clients / docs AI).
     */
    public record CreateShareRequest(
            @NotNull
            @JsonProperty("fileId")
            @JsonAlias({"file_id", "fileID"})
            UUID fileId,

            @Size(max = 255) String label,

            @Size(max = 50)
            @JsonProperty("allowedColumns")
            @JsonAlias({"allowed_columns"})
            List<@Size(max = 128) String> allowedColumns,

            @Min(5)
            @Max(10080)
            @JsonProperty("ttlMinutes")
            @JsonAlias({"ttl_minutes", "ttl"})
            Integer ttlMinutes
    ) {
    }

    public record CreateShareResponse(
            UUID shareId,
            String token,
            String publicPath,
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

    public record ShareSummaryView(
            UUID shareId,
            UUID fileId,
            String label,
            List<String> allowedColumns,
            Instant expiresAt,
            Instant revokedAt,
            Instant createdAt
    ) {
    }

    public record ColumnDisclosure(
            String column,
            String disclosure
    ) {
    }

    /** Vue publique : métadonnées + colonnes autorisées — jamais le binaire. */
    public record PublicShareView(
            String label,
            String originalName,
            long sizeBytes,
            String sha256Hex,
            boolean fileEncrypted,
            List<String> allowedColumns,
            List<String> maskedColumns,
            List<ColumnDisclosure> columnDisclosures,
            Instant expiresAt,
            String accessMode
    ) {
    }
}
