package com.agroshield.infrastructure.config;

import java.time.Duration;
import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

@Validated
@ConfigurationProperties(prefix = "agroshield")
public record AgroShieldProperties(
        SecurityProperties security,
        AiProperties ai,
        CorsProperties cors,
        StorageProperties storage,
        AuthRateLimitProperties authRateLimit
) {
    public record SecurityProperties(
            @NotBlank String jwtSecret,
            @NotBlank String jwtIssuer,
            @NotBlank String jwtAudience,
            @Min(60) long accessTokenTtlSeconds,
            @Min(300) long refreshTokenTtlSeconds,
            Argon2Properties argon2
    ) {
    }

    public record Argon2Properties(
            @Min(1) int memoryKb,
            @Min(1) int iterations,
            @Min(1) int parallelism,
            @Min(16) int saltLength,
            @Min(16) int hashLength
    ) {
    }

    public record AiProperties(
            @NotBlank String baseUrl,
            @NotBlank String internalToken,
            Duration connectTimeout,
            Duration readTimeout
    ) {
    }

    public record CorsProperties(
            @NotEmpty List<String> allowedOrigins
    ) {
    }

    public record StorageProperties(
            @NotBlank String basePath,
            @Min(1024) long maxFileBytes
    ) {
    }

    public record AuthRateLimitProperties(
            @Min(1) int maxAttempts,
            @Min(1) int maxAttemptsPerIp,
            @Min(30) long windowSeconds
    ) {
    }
}