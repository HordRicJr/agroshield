package com.agroshield.domain.risk;

/**
 * Action recommandée par Spring (décision plateforme) — l'IA ne décide pas.
 */
public enum RecommendedAction {
    MONITOR,
    REVIEW,
    ALERT,
    BLOCK_RECOMMENDED
}
