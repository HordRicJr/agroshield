package com.agroshield.interfaces.rest.dto;

import java.util.Map;

public record ApiError(
        String code,
        String message,
        Map<String, Object> details
) {
    public ApiError {
        if (details == null) {
            details = Map.of();
        }
    }
}
