package com.agroshield.infrastructure.ai.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum Language {
    FR("fr"),
    EN("en"),
    AUTO("auto");

    private final String value;

    Language(String value) {
        this.value = value;
    }

    @JsonValue
    public String json() {
        return value;
    }

    @JsonCreator
    public static Language from(String raw) {
        if (raw == null) {
            return AUTO;
        }
        for (Language l : values()) {
            if (l.value.equalsIgnoreCase(raw) || l.name().equalsIgnoreCase(raw)) {
                return l;
            }
        }
        throw new IllegalArgumentException("Unsupported language: " + raw);
    }
}
