package com.agroshield.infrastructure.ai.dto;

import com.fasterxml.jackson.annotation.JsonValue;

/** Miroir exact du contrat FastAPI. */
public enum DataCategory {
    PERSONAL,
    PERSONAL_SENSITIVE,
    AGRICULTURAL,
    FINANCIAL,
    FINANCIAL_SENSITIVE,
    LOCATION,
    UNKNOWN;

    @JsonValue
    public String json() {
        return name();
    }
}
