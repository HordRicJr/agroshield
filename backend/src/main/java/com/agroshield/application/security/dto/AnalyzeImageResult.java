package com.agroshield.application.security.dto;

public record AnalyzeImageResult(
        String extractedText,
        double ocrConfidence,
        boolean ocrDegraded,
        AnalyzeMessageResult analysis
) {
}
