package com.agroshield.infrastructure.security;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

import org.springframework.stereotype.Component;

import com.agroshield.domain.security.ContentHasher;

/**
 * SHA-256 pour empreintes fichiers / input_hash AI (pas de contenu sensible stocké).
 */
@Component
public class Sha256ContentHasher implements ContentHasher {

    @Override
    public String sha256Hex(byte[] data) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(md.digest(data));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }

    @Override
    public String sha256Hex(String utf8) {
        return sha256Hex(utf8.getBytes(StandardCharsets.UTF_8));
    }
}
