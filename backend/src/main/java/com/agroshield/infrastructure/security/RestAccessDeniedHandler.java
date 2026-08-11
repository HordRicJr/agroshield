package com.agroshield.infrastructure.security;

import java.io.IOException;
import java.util.Map;

import org.slf4j.MDC;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import com.agroshield.interfaces.rest.dto.ApiError;
import com.agroshield.interfaces.rest.dto.ApiResponse;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/** 403 uniquement quand l'utilisateur EST authentifié mais n'a pas la permission requise. */
@Component
public class RestAccessDeniedHandler implements AccessDeniedHandler {

    private final ObjectMapper objectMapper;

    public RestAccessDeniedHandler(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public void handle(
            HttpServletRequest request, HttpServletResponse response, AccessDeniedException accessDeniedException)
            throws IOException {
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        String requestId = MDC.get(CorrelationIdFilter.MDC_KEY);
        ApiResponse<Void> body = ApiResponse.fail(
                new ApiError("FORBIDDEN", "Accès refusé.", Map.of()),
                requestId != null ? requestId : "unknown");
        response.getWriter().write(objectMapper.writeValueAsString(body));
    }
}
