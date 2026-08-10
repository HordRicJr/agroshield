package com.agroshield.infrastructure.ai.dto;

import com.fasterxml.jackson.annotation.JsonValue;

public enum SignalType {
    URGENCY,
    FINANCIAL_REQUEST,
    BENEFICIARY_CHANGE,
    CREDENTIAL_HARVEST,
    SUSPICIOUS_URL,
    IMPERSONATION,
    PRESSURE,
    OTHER;

    @JsonValue
    public String json() {
        return name();
    }
}
