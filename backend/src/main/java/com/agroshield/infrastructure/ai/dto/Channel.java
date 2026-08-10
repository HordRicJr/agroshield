package com.agroshield.infrastructure.ai.dto;

import com.fasterxml.jackson.annotation.JsonValue;

public enum Channel {
    SMS,
    EMAIL,
    WHATSAPP,
    OTHER;

    @JsonValue
    public String json() {
        return name();
    }
}
