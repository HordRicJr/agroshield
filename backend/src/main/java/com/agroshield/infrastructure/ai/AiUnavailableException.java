package com.agroshield.infrastructure.ai;

/**
 * IA injoignable (réseau / timeout) — seule exception retentée par Resilience4j.
 * Les erreurs HTTP 4xx/5xx du service IA restent {@link AiServiceException} (pas de retry).
 */
public class AiUnavailableException extends AiServiceException {

    public AiUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }
}
