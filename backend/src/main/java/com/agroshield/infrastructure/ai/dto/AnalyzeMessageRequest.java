package com.agroshield.infrastructure.ai.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
@JsonInclude(JsonInclude.Include.NON_NULL)
public record AnalyzeMessageRequest(
        @NotBlank @Size(max = 10_000) String content,
        Channel channel,
        Language language
) {
    public AnalyzeMessageRequest {
        if (channel == null) {
            channel = Channel.OTHER;
        }
        if (language == null) {
            language = Language.AUTO;
        }
    }
}
