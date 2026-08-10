package com.agroshield.infrastructure.security;

import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;

import org.bouncycastle.crypto.generators.Argon2BytesGenerator;
import org.bouncycastle.crypto.params.Argon2Parameters;
import org.springframework.stereotype.Component;

import com.agroshield.domain.security.PasswordHasher;
import com.agroshield.infrastructure.config.AgroShieldProperties;

/**
 * Argon2id (OWASP) — format stocké : argon2id$v=19$m=..,t=..,p=..$saltB64$hashB64
 */
@Component
public class Argon2PasswordHasher implements PasswordHasher {

    private final AgroShieldProperties.Argon2Properties cfg;
    private final SecureRandom secureRandom = new SecureRandom();

    public Argon2PasswordHasher(AgroShieldProperties properties) {
        this.cfg = properties.security().argon2();
    }

    @Override
    public String hash(char[] password) {
        byte[] salt = new byte[cfg.saltLength()];
        secureRandom.nextBytes(salt);
        byte[] hash = argon2(password, salt);
        return format(salt, hash);
    }

    @Override
    public boolean matches(char[] password, String encoded) {
        Parsed p = parse(encoded);
        byte[] candidate = argon2(password, p.salt());
        return constantTimeEquals(candidate, p.hash());
    }

    private byte[] argon2(char[] password, byte[] salt) {
        Argon2Parameters params = new Argon2Parameters.Builder(Argon2Parameters.ARGON2_id)
                .withVersion(Argon2Parameters.ARGON2_VERSION_13)
                .withMemoryAsKB(cfg.memoryKb())
                .withIterations(cfg.iterations())
                .withParallelism(cfg.parallelism())
                .withSalt(salt)
                .build();
        Argon2BytesGenerator gen = new Argon2BytesGenerator();
        gen.init(params);
        byte[] out = new byte[cfg.hashLength()];
        gen.generateBytes(new String(password).getBytes(StandardCharsets.UTF_8), out);
        return out;
    }

    private String format(byte[] salt, byte[] hash) {
        return "argon2id$v=19$m=" + cfg.memoryKb()
                + ",t=" + cfg.iterations()
                + ",p=" + cfg.parallelism()
                + "$" + b64(salt)
                + "$" + b64(hash);
    }

    private Parsed parse(String encoded) {
        String[] parts = encoded.split("\\$");
        if (parts.length != 5 || !"argon2id".equals(parts[0])) {
            throw new IllegalArgumentException("Invalid argon2id hash format");
        }
        return new Parsed(b64d(parts[3]), b64d(parts[4]));
    }

    private static boolean constantTimeEquals(byte[] a, byte[] b) {
        if (a.length != b.length) {
            return false;
        }
        int r = 0;
        for (int i = 0; i < a.length; i++) {
            r |= a[i] ^ b[i];
        }
        return r == 0;
    }

    private static String b64(byte[] data) {
        return java.util.Base64.getEncoder().withoutPadding().encodeToString(data);
    }

    private static byte[] b64d(String data) {
        return java.util.Base64.getDecoder().decode(data);
    }

    private record Parsed(byte[] salt, byte[] hash) {
    }
}
