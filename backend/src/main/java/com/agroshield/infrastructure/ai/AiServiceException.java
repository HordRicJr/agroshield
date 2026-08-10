package com.agroshield.infrastructure.ai;

/**
 * Exception technique — l'IA est injoignable ou a renvoyé une erreur.
 * Les couches métier appliquent le fallback (Phase 4+).
 */
public class AiServiceException extends RuntimeException {

    private final int statusCode;
    private final String errorCode;

    public AiServiceException(String message, int statusCode, String errorCode) {
        super(message);
        this.statusCode = statusCode;
        this.errorCode = errorCode;
    }

    public AiServiceException(String message, Throwable cause) {
        super(message, cause);
        this.statusCode = 0;
        this.errorCode = "AI_UNAVAILABLE";
    }

    public int getStatusCode() {
        return statusCode;
    }

    public String getErrorCode() {
        return errorCode;
    }
}
