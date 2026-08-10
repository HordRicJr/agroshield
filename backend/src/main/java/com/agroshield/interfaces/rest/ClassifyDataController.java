package com.agroshield.interfaces.rest;

import org.slf4j.MDC;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.agroshield.application.data.ClassifyDataService;
import com.agroshield.application.data.dto.ClassifyDataResult;
import com.agroshield.infrastructure.ai.dto.ClassifyRequest;
import com.agroshield.infrastructure.security.CorrelationIdFilter;
import com.agroshield.interfaces.rest.dto.ApiResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/data")
@Validated
public class ClassifyDataController {

    private final ClassifyDataService classifyDataService;

    public ClassifyDataController(ClassifyDataService classifyDataService) {
        this.classifyDataService = classifyDataService;
    }

    @PostMapping("/classify")
    @PreAuthorize("hasAuthority('DATA_READ') or hasAuthority('DATA_WRITE')")
    public ApiResponse<ClassifyDataResult> classify(@Valid @RequestBody ClassifyRequest request) {
        ClassifyDataResult result = classifyDataService.classify(request);
        return ApiResponse.ok(result, correlationId());
    }

    private static String correlationId() {
        String id = MDC.get(CorrelationIdFilter.MDC_KEY);
        return id != null ? id : "unknown";
    }
}
