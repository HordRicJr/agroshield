package com.agroshield.infrastructure.ai.dto;

public record OcrResponse(
        String text,
        double confidence,
        boolean degraded
) {
}
