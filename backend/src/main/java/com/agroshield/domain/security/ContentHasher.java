package com.agroshield.domain.security;

/**
 * Empreintes SHA-256 pour fichiers, payloads AI (traçabilité sans stocker le contenu).
 */
public interface ContentHasher {

    /** Hex SHA-256 lowercase d'octets bruts. */
    String sha256Hex(byte[] data);

    /** Hex SHA-256 d'une chaîne UTF-8. */
    String sha256Hex(String utf8);
}
