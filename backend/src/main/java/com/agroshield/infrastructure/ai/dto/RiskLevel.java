package com.agroshield.infrastructure.ai.dto;

import com.fasterxml.jackson.annotation.JsonValue;

public enum RiskLevel {
    LOW,
    MEDIUM,
    HIGH,
    CRITICAL;

    @JsonValue
    public String json() {
        return name();
    }
}
