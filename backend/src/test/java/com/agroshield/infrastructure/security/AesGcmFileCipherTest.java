package com.agroshield.infrastructure.security;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;

import org.junit.jupiter.api.Test;

import com.agroshield.domain.security.FileCipher;
import com.agroshield.infrastructure.config.AgroShieldProperties;

class AesGcmFileCipherTest {

    @Test
    void encryptThenDecryptRoundTrip() {
        String keyB64 = Base64.getEncoder().encodeToString("AgroShieldLocalDevKey32BytesOK!!".getBytes(StandardCharsets.UTF_8));
        AgroShieldProperties props = new AgroShieldProperties(
                null,
                null,
                new AgroShieldProperties.CorsProperties(List.of("http://localhost:3000")),
                new AgroShieldProperties.StorageProperties(
                        "./target/x",
                        1024,
                        new AgroShieldProperties.EncryptionProperties(true, keyB64, "t")),
                null);

        AesGcmFileCipher cipher = new AesGcmFileCipher(props);
        byte[] plain = "parcelle,iban\nA1,FR76SECRET\n".getBytes(StandardCharsets.UTF_8);
        FileCipher.EncryptedPayload enc = cipher.encrypt(plain);

        assertFalse(new String(enc.ciphertext(), StandardCharsets.UTF_8).contains("FR76SECRET"));
        assertNotEquals(plain.length, enc.ciphertext().length); // GCM tag adds bytes
        byte[] back = cipher.decrypt(enc.ciphertext(), enc.ivBase64());
        assertArrayEquals(plain, back);
    }
}
