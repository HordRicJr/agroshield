package com.agroshield.infrastructure.security;

import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.util.Base64;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import com.agroshield.domain.security.FileCipher;
import com.agroshield.infrastructure.config.AgroShieldProperties;

@Component
public class AesGcmFileCipher implements FileCipher {

    public static final String ALGORITHM = "AES-256-GCM";
    private static final String TRANSFORMATION = "AES/GCM/NoPadding";
    private static final int IV_LENGTH = 12;
    private static final int TAG_BITS = 128;

    private final SecretKey secretKey;
    private final SecureRandom secureRandom = new SecureRandom();

    public AesGcmFileCipher(AgroShieldProperties properties) {
        var enc = properties.storage().encryption();
        if (enc == null || enc.masterKeyBase64() == null || enc.masterKeyBase64().isBlank()) {
            throw new IllegalStateException("agroshield.storage.encryption.master-key-base64 is required");
        }
        byte[] keyBytes = Base64.getDecoder().decode(enc.masterKeyBase64().trim());
        if (keyBytes.length != 32) {
            throw new IllegalStateException("Encryption master key must decode to 32 bytes (AES-256)");
        }
        this.secretKey = new SecretKeySpec(keyBytes, "AES");
    }

    @Override
    public EncryptedPayload encrypt(byte[] plaintext) {
        try {
            byte[] iv = new byte[IV_LENGTH];
            secureRandom.nextBytes(iv);
            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, new GCMParameterSpec(TAG_BITS, iv));
            byte[] ciphertext = cipher.doFinal(plaintext);
            return new EncryptedPayload(ciphertext, Base64.getEncoder().encodeToString(iv), ALGORITHM);
        } catch (GeneralSecurityException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Echec chiffrement fichier");
        }
    }

    @Override
    public byte[] decrypt(byte[] ciphertext, String ivBase64) {
        if (ivBase64 == null || ivBase64.isBlank()) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "IV chiffrement manquant");
        }
        try {
            byte[] iv = Base64.getDecoder().decode(ivBase64);
            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, new GCMParameterSpec(TAG_BITS, iv));
            return cipher.doFinal(ciphertext);
        } catch (GeneralSecurityException | IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Echec dechiffrement fichier");
        }
    }
}
