package com.agroshield.application.security;

import java.io.IOException;
import java.util.Locale;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.agroshield.application.ai.AiServicePort;
import com.agroshield.application.security.dto.AnalyzeImageResult;
import com.agroshield.infrastructure.ai.AiServiceException;
import com.agroshield.infrastructure.ai.dto.AnalyzeMessageRequest;
import com.agroshield.infrastructure.ai.dto.Channel;
import com.agroshield.infrastructure.ai.dto.Language;
import com.agroshield.infrastructure.ai.dto.OcrResponse;

import io.github.resilience4j.circuitbreaker.CallNotPermittedException;

/** Capture d'écran (SMS/WhatsApp) → OCR → même pipeline d'analyse que le texte saisi. */
@Service
public class ImageAnalyzeService {

    private static final int MIN_EXTRACTED_CHARS = 8;
    private static final long MAX_BYTES = 5L * 1024 * 1024;

    private final AiServicePort aiServicePort;
    private final AnalyzeMessageService analyzeMessageService;

    public ImageAnalyzeService(AiServicePort aiServicePort, AnalyzeMessageService analyzeMessageService) {
        this.aiServicePort = aiServicePort;
        this.analyzeMessageService = analyzeMessageService;
    }

    @Transactional
    public AnalyzeImageResult analyze(
            MultipartFile file, String additionalText, String channelRaw, String languageRaw) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Image manquante");
        }
        if (file.getSize() > MAX_BYTES) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "Image trop volumineuse (5 Mo max)");
        }
        String contentType = file.getContentType();
        if (contentType != null && !contentType.startsWith("image/")) {
            throw new ResponseStatusException(
                    HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Fichier non reconnu comme une image");
        }

        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Lecture de l'image impossible");
        }

        OcrResponse ocr;
        try {
            ocr = aiServicePort.ocrImage(bytes, file.getOriginalFilename(), contentType);
        } catch (CallNotPermittedException | AiServiceException ex) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Lecture d'image indisponible pour le moment — réessayez dans un instant");
        }

        String combined = combine(additionalText, ocr.text());
        if (combined.trim().length() < MIN_EXTRACTED_CHARS) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Aucun texte lisible détecté dans l'image — recopiez le message manuellement");
        }

        var analysis = analyzeMessageService.analyze(
                new AnalyzeMessageRequest(combined, parseChannel(channelRaw), Language.from(languageRaw)));

        return new AnalyzeImageResult(ocr.text(), ocr.confidence(), ocr.degraded(), analysis);
    }

    private static String combine(String additionalText, String ocrText) {
        String extra = additionalText == null ? "" : additionalText.trim();
        String fromImage = ocrText == null ? "" : ocrText.trim();
        if (extra.isEmpty()) {
            return fromImage;
        }
        if (fromImage.isEmpty()) {
            return extra;
        }
        return extra + "\n" + fromImage;
    }

    private static Channel parseChannel(String raw) {
        if (raw == null || raw.isBlank()) {
            return Channel.OTHER;
        }
        try {
            return Channel.valueOf(raw.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            return Channel.OTHER;
        }
    }
}
