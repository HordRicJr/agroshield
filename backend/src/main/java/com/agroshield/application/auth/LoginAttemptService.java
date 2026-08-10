package com.agroshield.application.auth;

/**
 * Limitation des tentatives de login — par compte (hash email) et par IP (hash IP).
 */
public interface LoginAttemptService {

    /** Lève 429 si le compte ou l'IP est verrouillé. */
    void assertNotLocked(String accountKey, String ipKey);

    /**
     * Enregistre un échec.
     * @return true si le compte ou l'IP vient d'atteindre la limite (répondre 429).
     */
    boolean recordFailure(String accountKey, String ipKey);

    /** Succès login : reset du compteur compte (pas l'IP). */
    void clearAccount(String accountKey);
}
