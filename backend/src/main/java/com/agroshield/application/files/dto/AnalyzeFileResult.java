package com.agroshield.application.files.dto;

import java.util.UUID;

import com.agroshield.application.data.dto.ClassifyDataResult;

public record AnalyzeFileResult(
        UUID fileId,
        String fileName,
        int rowCount,
        int columnCount,
        ClassifyDataResult classification
) {
}
