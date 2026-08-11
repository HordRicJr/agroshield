package com.agroshield.application.ai;

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

/**
 * Port sortant vers le microservice FastAPI.
 * Les contrôleurs n'appellent jamais FastAPI directement.
 */
public interface AiServicePort {

    HealthResponse health();

    ReadyResponse ready();

    ClassifyResponse classifyData(ClassifyRequest request);

    AnalyzeMessageResponse analyzeMessage(AnalyzeMessageRequest request);

    DetectAnomalyResponse detectAnomaly(DetectAnomalyRequest request);

    TrainAnomalyResponse trainAnomaly(TrainAnomalyRequest request);

    OcrResponse ocrImage(byte[] imageBytes, String filename, String contentType);
}
