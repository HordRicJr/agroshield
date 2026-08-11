package com.agroshield.infrastructure.ai;

import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import com.agroshield.application.ai.AiServicePort;
import com.agroshield.infrastructure.ai.dto.AnalyzeMessageRequest;
import com.agroshield.infrastructure.ai.dto.AnalyzeMessageResponse;
import com.agroshield.infrastructure.ai.dto.ClassifyRequest;
import com.agroshield.infrastructure.ai.dto.ClassifyResponse;
import com.agroshield.infrastructure.ai.dto.DetectAnomalyRequest;
import com.agroshield.infrastructure.ai.dto.DetectAnomalyResponse;
import com.agroshield.infrastructure.ai.dto.HealthResponse;
import com.agroshield.infrastructure.ai.dto.OcrResponse;
import com.agroshield.infrastructure.ai.dto.ReadyResponse;
import com.agroshield.infrastructure.ai.dto.TrainAnomalyRequest;
import com.agroshield.infrastructure.ai.dto.TrainAnomalyResponse;
import com.agroshield.infrastructure.config.AgroShieldProperties;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;

/**
 * Client HTTP vers FastAPI — RestClient + X-Internal-Token + X-Correlation-ID.
 * Résilience : retry réseau + circuit breaker {@code aiService}.
 * Ne journalise jamais le contenu métier ni le token.
 */
@Component
public class AiServiceClient implements AiServicePort {

    private static final Logger log = LoggerFactory.getLogger(AiServiceClient.class);
    private static final String CB = "aiService";

    private final RestClient restClient;

    public AiServiceClient(AgroShieldProperties properties) {
        var ai = properties.ai();
        var factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout((int) ai.connectTimeout().toMillis());
        factory.setReadTimeout((int) ai.readTimeout().toMillis());

        this.restClient = RestClient.builder()
                .baseUrl(trimTrailingSlash(ai.baseUrl()))
                .requestFactory(factory)
                .defaultHeader("X-Internal-Token", ai.internalToken())
                .defaultHeader("Accept", MediaType.APPLICATION_JSON_VALUE)
                .build();

        log.info("ai_client_configured baseUrl={} connectTimeout={} readTimeout={}",
                ai.baseUrl(), ai.connectTimeout(), ai.readTimeout());
    }

    @Override
    public HealthResponse health() {
        return get("/health", HealthResponse.class);
    }

    @Override
    public ReadyResponse ready() {
        return get("/health/ready", ReadyResponse.class);
    }

    @Override
    @CircuitBreaker(name = CB)
    @Retry(name = CB)
    public ClassifyResponse classifyData(ClassifyRequest request) {
        return post("/ai/classify-data", request, ClassifyResponse.class);
    }

    @Override
    @CircuitBreaker(name = CB)
    @Retry(name = CB)
    public AnalyzeMessageResponse analyzeMessage(AnalyzeMessageRequest request) {
        return post("/ai/analyze-message", request, AnalyzeMessageResponse.class);
    }

    @Override
    @CircuitBreaker(name = CB)
    @Retry(name = CB)
    public DetectAnomalyResponse detectAnomaly(DetectAnomalyRequest request) {
        return post("/ai/detect-anomaly", request, DetectAnomalyResponse.class);
    }

    @Override
    @CircuitBreaker(name = CB)
    @Retry(name = CB)
    public TrainAnomalyResponse trainAnomaly(TrainAnomalyRequest request) {
        return post("/ai/anomaly/train", request, TrainAnomalyResponse.class);
    }

    @Override
    @CircuitBreaker(name = CB)
    @Retry(name = CB)
    public OcrResponse ocrImage(byte[] imageBytes, String filename, String contentType) {
        String correlationId = correlationId();
        try {
            ByteArrayResource resource = new ByteArrayResource(imageBytes) {
                @Override
                public String getFilename() {
                    return filename;
                }
            };
            HttpHeaders filePartHeaders = new HttpHeaders();
            filePartHeaders.setContentType(
                    MediaType.parseMediaType(contentType != null ? contentType : "application/octet-stream"));
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", new HttpEntity<>(resource, filePartHeaders));

            return restClient.post()
                    .uri("/ai/ocr")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .header("X-Correlation-ID", correlationId)
                    .body(body)
                    .retrieve()
                    .body(OcrResponse.class);
        } catch (RestClientResponseException ex) {
            log.warn("ai_http_error method=POST path=/ai/ocr status={} correlationId={}",
                    ex.getStatusCode().value(), correlationId);
            throw new AiServiceException(
                    "AI service error on /ai/ocr", ex.getStatusCode().value(), "AI_HTTP_ERROR");
        } catch (RestClientException ex) {
            log.warn("ai_unavailable method=POST path=/ai/ocr correlationId={} reason={}",
                    correlationId, ex.getClass().getSimpleName());
            throw new AiUnavailableException("AI service unavailable: /ai/ocr", ex);
        }
    }

    private <T> T get(String path, Class<T> type) {
        String correlationId = correlationId();
        try {
            return restClient.get()
                    .uri(path)
                    .header("X-Correlation-ID", correlationId)
                    .retrieve()
                    .body(type);
        } catch (RestClientResponseException ex) {
            log.warn("ai_http_error method=GET path={} status={} correlationId={}",
                    path, ex.getStatusCode().value(), correlationId);
            throw new AiServiceException(
                    "AI service error on " + path,
                    ex.getStatusCode().value(),
                    "AI_HTTP_ERROR");
        } catch (RestClientException ex) {
            log.warn("ai_unavailable method=GET path={} correlationId={} reason={}",
                    path, correlationId, ex.getClass().getSimpleName());
            throw new AiUnavailableException("AI service unavailable: " + path, ex);
        }
    }

    private <T> T post(String path, Object body, Class<T> type) {
        String correlationId = correlationId();
        try {
            return restClient.post()
                    .uri(path)
                    .contentType(MediaType.APPLICATION_JSON)
                    .header("X-Correlation-ID", correlationId)
                    .body(body)
                    .retrieve()
                    .body(type);
        } catch (RestClientResponseException ex) {
            log.warn("ai_http_error method=POST path={} status={} correlationId={}",
                    path, ex.getStatusCode().value(), correlationId);
            throw new AiServiceException(
                    "AI service error on " + path,
                    ex.getStatusCode().value(),
                    "AI_HTTP_ERROR");
        } catch (RestClientException ex) {
            log.warn("ai_unavailable method=POST path={} correlationId={} reason={}",
                    path, correlationId, ex.getClass().getSimpleName());
            throw new AiUnavailableException("AI service unavailable: " + path, ex);
        }
    }

    private static String correlationId() {
        return UUID.randomUUID().toString();
    }

    private static String trimTrailingSlash(String url) {
        if (url == null || url.isBlank()) {
            return url;
        }
        return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
    }
}
