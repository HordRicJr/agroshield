package com.agroshield.domain.risk;

public record RiskFactor(
        String factor,
        String description,
        int weight,
        String source
) {
}
