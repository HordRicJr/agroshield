package com.agroshield.interfaces.rest;

import java.util.Map;

import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import com.agroshield.infrastructure.ai.AiServiceException;
import com.agroshield.infrastructure.security.CorrelationIdFilter;
import com.agroshield.interfaces.rest.dto.ApiError;
import com.agroshield.interfaces.rest.dto.ApiResponse;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiResponse<Void>> handleStatus(ResponseStatusException ex) {
        String code = ex.getStatusCode().is4xxClientError() ? "CLIENT_ERROR" : "SERVER_ERROR";
        if (ex.getStatusCode() == HttpStatus.UNAUTHORIZED) {
            code = "UNAUTHORIZED";
        } else if (ex.getStatusCode() == HttpStatus.CONFLICT) {
            code = "CONFLICT";
        } else if (ex.getStatusCode() == HttpStatus.FORBIDDEN) {
            code = "FORBIDDEN";
        } else if (ex.getStatusCode() == HttpStatus.TOO_MANY_REQUESTS) {
            code = "RATE_LIMITED";
        } else if (ex.getStatusCode() == HttpStatus.GONE) {
            code = "GONE";
        }
        return ResponseEntity.status(ex.getStatusCode()).body(ApiResponse.fail(
                new ApiError(code, ex.getReason() != null ? ex.getReason() : "Erreur", Map.of()),
                requestId()));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccessDenied(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.fail(
                new ApiError("FORBIDDEN", "Accès refusé.", Map.of()),
                requestId()));
    }

    @ExceptionHandler(AiServiceException.class)
    public ResponseEntity<ApiResponse<Void>> handleAi(AiServiceException ex) {
        // Les use-cases appliquent un fallback ; ce handler couvre les appels hors use-case.
        HttpStatus status = ex.getStatusCode() >= 400 && ex.getStatusCode() < 600
                ? HttpStatus.valueOf(ex.getStatusCode())
                : HttpStatus.SERVICE_UNAVAILABLE;
        return ResponseEntity.status(status).body(ApiResponse.fail(
                new ApiError(ex.getErrorCode(), "Service IA indisponible ou en erreur.", Map.of()),
                requestId()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidation(MethodArgumentNotValidException ex) {
        return ResponseEntity.badRequest().body(ApiResponse.fail(
                new ApiError("VALIDATION_ERROR", "Requête invalide.", Map.of(
                        "fieldErrors", ex.getBindingResult().getFieldErrors().stream()
                                .map(fe -> Map.of("field", fe.getField(), "message",
                                        String.valueOf(fe.getDefaultMessage())))
                                .toList())),
                requestId()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGeneric(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse.fail(
                new ApiError("INTERNAL_ERROR", "Erreur interne.", Map.of()),
                requestId()));
    }

    private static String requestId() {
        String id = MDC.get(CorrelationIdFilter.MDC_KEY);
        return id != null ? id : "unknown";
    }
}
