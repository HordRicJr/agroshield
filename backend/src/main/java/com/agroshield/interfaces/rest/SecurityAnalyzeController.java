package com.agroshield.interfaces.rest;

import org.slf4j.MDC;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.agroshield.application.security.AnalyzeMessageService;
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

    public SecurityAnalyzeController(AnalyzeMessageService analyzeMessageService) {
        this.analyzeMessageService = analyzeMessageService;
    }

    @PostMapping("/analyze-message")
    @PreAuthorize("hasAuthority('SECURITY_VIEW')")
    public ApiResponse<AnalyzeMessageResult> analyze(
            @Valid @RequestBody AnalyzeMessageRequest request) {
        AnalyzeMessageResult result = analyzeMessageService.analyze(request);
        return ApiResponse.ok(result, correlationId());
    }

    private static String correlationId() {
        String id = MDC.get(CorrelationIdFilter.MDC_KEY);
        return id != null ? id : "unknown";
    }
}
