package com.agroshield.interfaces.rest;

import java.util.List;
import java.util.UUID;

import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.agroshield.application.training.TrainingService;
import com.agroshield.application.training.dto.TrainingDtos.CompleteModuleRequest;
import com.agroshield.application.training.dto.TrainingDtos.CreateModuleRequest;
import com.agroshield.application.training.dto.TrainingDtos.ModuleView;
import com.agroshield.application.training.dto.TrainingDtos.ResultView;
import com.agroshield.infrastructure.security.CorrelationIdFilter;
import com.agroshield.interfaces.rest.dto.ApiResponse;

import jakarta.validation.Valid;

/** CyberÉducation — modules de sensibilisation et suivi de complétion (Mission 3, brique complémentaire). */
@RestController
@RequestMapping("/api/v1/training")
@Validated
public class TrainingController {

    private final TrainingService trainingService;

    public TrainingController(TrainingService trainingService) {
        this.trainingService = trainingService;
    }

    @PostMapping("/modules")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('SECURITY_MANAGE')")
    public ApiResponse<ModuleView> createModule(@Valid @RequestBody CreateModuleRequest request) {
        return ApiResponse.ok(trainingService.createModule(request), corr());
    }

    @GetMapping("/modules")
    public ApiResponse<List<ModuleView>> listModules() {
        return ApiResponse.ok(trainingService.listModules(), corr());
    }

    @PostMapping("/modules/{id}/complete")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ResultView> complete(
            @PathVariable UUID id, @Valid @RequestBody CompleteModuleRequest request) {
        return ApiResponse.ok(trainingService.complete(id, request), corr());
    }

    @GetMapping("/results/me")
    public ApiResponse<List<ResultView>> myResults() {
        return ApiResponse.ok(trainingService.listMyResults(), corr());
    }

    @GetMapping("/results")
    @PreAuthorize("hasAuthority('SECURITY_VIEW') or hasAuthority('AUDIT_VIEW')")
    public ApiResponse<List<ResultView>> organizationResults() {
        return ApiResponse.ok(trainingService.listOrganizationResults(), corr());
    }

    private static String corr() {
        String id = MDC.get(CorrelationIdFilter.MDC_KEY);
        return id != null ? id : "unknown";
    }
}
