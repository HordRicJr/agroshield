package com.agroshield.interfaces.rest;

import org.slf4j.MDC;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.agroshield.application.security.AnalyzeMessageService;
import com.agroshield.application.security.ImageAnalyzeService;
import com.agroshield.application.security.dto.AnalyzeImageResult;
import com.agroshield.application.security.dto.AnalyzeMessageResult;
import com.agroshield.infrastructure.ai.dto.AnalyzeMessageRequest;
import com.agroshield.infrastructure.security.CorrelationIdFilter;
import com.agroshield.interfaces.rest.dto.ApiResponse;

import jakarta.validation.Valid;

/**
 * Fraud Guard via AI — avec fallback local, persistance et audit (Phase 4).
 */
@RestController
@RequestMapping("/api/v1/security")
@Validated
public class SecurityAnalyzeController {

    private final AnalyzeMessageService analyzeMessageService;
    private final ImageAnalyzeService imageAnalyzeService;

    public SecurityAnalyzeController(
            AnalyzeMessageService analyzeMessageService, ImageAnalyzeService imageAnalyzeService) {
        this.analyzeMessageService = analyzeMessageService;
        this.imageAnalyzeService = imageAnalyzeService;
    }

    @PostMapping("/analyze-message")
    @PreAuthorize("hasAuthority('SECURITY_VIEW')")
    public ApiResponse<AnalyzeMessageResult> analyze(
            @Valid @RequestBody AnalyzeMessageRequest request) {
        AnalyzeMessageResult result = analyzeMessageService.analyze(request);
        return ApiResponse.ok(result, correlationId());
    }

    /** Capture d'écran (SMS/WhatsApp) — extraction de texte (OCR) puis même analyse que le texte saisi. */
    @PostMapping(value = "/analyze-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('SECURITY_VIEW')")
    public ApiResponse<AnalyzeImageResult> analyzeImage(
            @RequestPart("file") MultipartFile file,
            @RequestParam(value = "additionalText", required = false) String additionalText,
            @RequestParam(value = "channel", required = false) String channel,
            @RequestParam(value = "language", required = false) String language) {
        AnalyzeImageResult result = imageAnalyzeService.analyze(file, additionalText, channel, language);
        return ApiResponse.ok(result, correlationId());
    }

    private static String correlationId() {
        String id = MDC.get(CorrelationIdFilter.MDC_KEY);
        return id != null ? id : "unknown";
    }
}
