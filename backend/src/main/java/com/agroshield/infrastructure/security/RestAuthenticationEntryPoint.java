package com.agroshield.infrastructure.security;

import java.io.IOException;
import java.util.Map;

import org.slf4j.MDC;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import com.agroshield.interfaces.rest.dto.ApiError;
import com.agroshield.interfaces.rest.dto.ApiResponse;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * 401 pour toute requête non authentifiée (jeton absent, expiré ou invalide).
 * Jamais 403 ici — 403 est réservé au refus de permission (voir {@link RestAccessDeniedHandler}).
 * Distinction essentielle : le frontend ne tente un rafraîchissement de session que sur 401.
 */
@Component
public class RestAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper;

    public RestAuthenticationEntryPoint(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public void commence(
            HttpServletRequest request, HttpServletResponse response, AuthenticationException authException)
            throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        String requestId = MDC.get(CorrelationIdFilter.MDC_KEY);
        ApiResponse<Void> body = ApiResponse.fail(
                new ApiError("UNAUTHORIZED", "Authentification requise.", Map.of()),
                requestId != null ? requestId : "unknown");
        response.getWriter().write(objectMapper.writeValueAsString(body));
    }
}
