package com.agroshield.interfaces.rest;

import java.util.List;
import java.util.UUID;

import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.agroshield.application.farm.ProducerFarmService;
import com.agroshield.application.farm.dto.FarmDtos.CreateFarmRequest;
import com.agroshield.application.farm.dto.FarmDtos.FarmView;
import com.agroshield.application.farm.dto.FarmDtos.UpdateFarmRequest;
import com.agroshield.application.farm.dto.ProducerDtos.CreateProducerRequest;
import com.agroshield.application.farm.dto.ProducerDtos.ProducerView;
import com.agroshield.application.farm.dto.ProducerDtos.UpdateProducerRequest;
import com.agroshield.infrastructure.security.CorrelationIdFilter;
import com.agroshield.interfaces.rest.dto.ApiResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1")
@Validated
public class ProducerFarmController {

    private final ProducerFarmService service;

    public ProducerFarmController(ProducerFarmService service) {
        this.service = service;
    }

    @PostMapping("/producers")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('DATA_WRITE')")
    public ApiResponse<ProducerView> createProducer(@Valid @RequestBody CreateProducerRequest request) {
        return ApiResponse.ok(service.createProducer(request), corr());
    }

    @GetMapping("/producers")
    @PreAuthorize("hasAuthority('DATA_READ')")
    public ApiResponse<List<ProducerView>> listProducers() {
        return ApiResponse.ok(service.listProducers(), corr());
    }

    @GetMapping("/producers/{id}")
    @PreAuthorize("hasAuthority('DATA_READ')")
    public ApiResponse<ProducerView> getProducer(@PathVariable UUID id) {
        return ApiResponse.ok(service.getProducer(id), corr());
    }

    @PutMapping("/producers/{id}")
    @PreAuthorize("hasAuthority('DATA_WRITE')")
    public ApiResponse<ProducerView> updateProducer(
            @PathVariable UUID id, @Valid @RequestBody UpdateProducerRequest request) {
        return ApiResponse.ok(service.updateProducer(id, request), corr());
    }

    @DeleteMapping("/producers/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAuthority('DATA_DELETE') or hasAuthority('DATA_WRITE')")
    public void deleteProducer(@PathVariable UUID id) {
        service.deleteProducer(id);
    }

    @PostMapping("/farms")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('DATA_WRITE')")
    public ApiResponse<FarmView> createFarm(@Valid @RequestBody CreateFarmRequest request) {
        return ApiResponse.ok(service.createFarm(request), corr());
    }

    @GetMapping("/farms")
    @PreAuthorize("hasAuthority('DATA_READ')")
    public ApiResponse<List<FarmView>> listFarms() {
        return ApiResponse.ok(service.listFarms(), corr());
    }

    @GetMapping("/farms/{id}")
    @PreAuthorize("hasAuthority('DATA_READ')")
    public ApiResponse<FarmView> getFarm(@PathVariable UUID id) {
        return ApiResponse.ok(service.getFarm(id), corr());
    }

    @PutMapping("/farms/{id}")
    @PreAuthorize("hasAuthority('DATA_WRITE')")
    public ApiResponse<FarmView> updateFarm(
            @PathVariable UUID id, @Valid @RequestBody UpdateFarmRequest request) {
        return ApiResponse.ok(service.updateFarm(id, request), corr());
    }

    @DeleteMapping("/farms/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAuthority('DATA_DELETE') or hasAuthority('DATA_WRITE')")
    public void deleteFarm(@PathVariable UUID id) {
        service.deleteFarm(id);
    }

    private static String corr() {
        String id = MDC.get(CorrelationIdFilter.MDC_KEY);
        return id != null ? id : "unknown";
    }
}
