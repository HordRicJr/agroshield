package com.agroshield.domain.security;

/**
 * Chiffrement applicatif at-rest (fichiers). Distinct du hashage (intégrité).
 */
public interface FileCipher {

    EncryptedPayload encrypt(byte[] plaintext);

    byte[] decrypt(byte[] ciphertext, String ivBase64);

    record EncryptedPayload(byte[] ciphertext, String ivBase64, String algorithm) {
    }
}
