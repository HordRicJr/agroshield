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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.agroshield.application.share.DataShareService;
import com.agroshield.application.share.dto.ShareDtos.CreateShareRequest;
import com.agroshield.application.share.dto.ShareDtos.CreateShareResponse;
import com.agroshield.application.share.dto.ShareDtos.PublicShareView;
import com.agroshield.application.share.dto.ShareDtos.RevokeShareResponse;
import com.agroshield.application.share.dto.ShareDtos.ShareSummaryView;
import com.agroshield.infrastructure.security.CorrelationIdFilter;
import com.agroshield.interfaces.rest.dto.ApiResponse;

import jakarta.validation.Valid;

@RestController
@Validated
public class ShareController {

    private final DataShareService dataShareService;

    public ShareController(DataShareService dataShareService) {
        this.dataShareService = dataShareService;
    }

    @PostMapping("/api/v1/shares")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('DATA_SHARE')")
    public ApiResponse<CreateShareResponse> create(@Valid @RequestBody CreateShareRequest request) {
        return ApiResponse.ok(dataShareService.create(request), corr());
    }

    @GetMapping("/api/v1/shares")
    @PreAuthorize("hasAuthority('DATA_SHARE') or hasAuthority('DATA_READ')")
    public ApiResponse<List<ShareSummaryView>> list() {
        return ApiResponse.ok(dataShareService.list(), corr());
    }

    @DeleteMapping("/api/v1/shares/{id}")
    @PreAuthorize("hasAuthority('DATA_SHARE') or hasAuthority('DATA_WRITE')")
    public ApiResponse<RevokeShareResponse> revoke(@PathVariable UUID id) {
        return ApiResponse.ok(dataShareService.revoke(id), corr());
    }

    /** Accès public tokenisé — métadonnées + colonnes autorisées uniquement. */
    @GetMapping("/api/v1/public/shares/{token}")
    public ApiResponse<PublicShareView> resolvePublic(@PathVariable String token) {
        return ApiResponse.ok(dataShareService.resolvePublic(token), corr());
    }

    private static String corr() {
        String id = MDC.get(CorrelationIdFilter.MDC_KEY);
        return id != null ? id : "unknown";
    }
}
