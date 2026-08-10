package com.agroshield.infrastructure.ai.dto;

import com.fasterxml.jackson.annotation.JsonValue;

public enum Method {
    RULE,
    MODEL,
    HYBRID;

    @JsonValue
    public String json() {
        return name();
    }
}
