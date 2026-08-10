package com.agroshield.domain.security;

/**
 * Hashage cryptographique applicatif (mots de passe, tokens, empreintes).
 * Ne jamais logger ni persister les valeurs en clair.
 */
public interface PasswordHasher {

    /** Hash Argon2id d'un mot de passe. */
    String hash(char[] password);

    boolean matches(char[] password, String hash);
}
