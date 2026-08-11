package com.agroshield.application.files;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.agroshield.application.data.ClassifyDataService;
import com.agroshield.application.data.dto.ClassifyDataResult;
import com.agroshield.application.files.dto.AnalyzeFileResult;
import com.agroshield.infrastructure.ai.dto.ClassifyRequest;
import com.agroshield.infrastructure.ai.dto.ColumnInput;
import com.agroshield.infrastructure.persistence.entity.FileMetadataEntity;

/** Parsing (CSV / XLSX) puis classification IA d'un fichier déjà importé. */
@Service
public class FileAnalyzeService {

    private static final int MAX_SAMPLES_PER_COLUMN = 5;
    private static final int MAX_COLUMNS = 100;

    private final FileStorageService fileStorageService;
    private final ClassifyDataService classifyDataService;

    public FileAnalyzeService(FileStorageService fileStorageService, ClassifyDataService classifyDataService) {
        this.fileStorageService = fileStorageService;
        this.classifyDataService = classifyDataService;
    }

    @Transactional
    public AnalyzeFileResult analyze(UUID fileId) {
        FileMetadataEntity meta = fileStorageService.requireOwned(fileId);
        byte[] bytes = readBytes(meta);
        String extension = extensionOf(meta.getOriginalName());

        ParsedTable table = switch (extension) {
            case "csv" -> parseCsv(bytes);
            case "xlsx", "xls" -> parseSpreadsheet(bytes);
            default -> throw new ResponseStatusException(
                    HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Format non supporté (.csv ou .xlsx attendu)");
        };

        List<ColumnInput> columns = table.headers().stream()
                .limit(MAX_COLUMNS)
                .map(header -> new ColumnInput(header, table.samples().getOrDefault(header, List.of())))
                .toList();

        ClassifyDataResult classification = classifyDataService.classify(new ClassifyRequest(columns), fileId);

        return new AnalyzeFileResult(
                fileId, meta.getOriginalName(), table.rowCount(), table.headers().size(), classification);
    }

    private byte[] readBytes(FileMetadataEntity meta) {
        try {
            return Files.readAllBytes(Path.of(meta.getStoragePath()));
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Lecture du fichier impossible");
        }
    }

    private static String extensionOf(String name) {
        int dot = name.lastIndexOf('.');
        return dot < 0 ? "" : name.substring(dot + 1).toLowerCase(Locale.ROOT);
    }

    private record ParsedTable(List<String> headers, java.util.Map<String, List<String>> samples, int rowCount) {
    }

    private ParsedTable parseCsv(byte[] bytes) {
        String text = new String(bytes, StandardCharsets.UTF_8);
        if (!text.isEmpty() && text.charAt(0) == '﻿') {
            text = text.substring(1);
        }
        String[] lines = text.split("\\r?\\n");
        if (lines.length == 0 || lines[0].isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Fichier CSV vide");
        }
        List<String> headers = List.of(lines[0].split(","))
                .stream().map(String::trim).toList();

        java.util.Map<String, List<String>> samples = new java.util.LinkedHashMap<>();
        int rowCount = 0;
        for (int i = 1; i < lines.length; i++) {
            if (lines[i].isBlank()) {
                continue;
            }
            rowCount++;
            if (rowCount <= MAX_SAMPLES_PER_COLUMN) {
                String[] cells = lines[i].split(",", -1);
                for (int c = 0; c < headers.size() && c < cells.length; c++) {
                    samples.computeIfAbsent(headers.get(c), k -> new ArrayList<>()).add(cells[c].trim());
                }
            }
        }
        return new ParsedTable(headers, samples, rowCount);
    }

    private ParsedTable parseSpreadsheet(byte[] bytes) {
        try (Workbook workbook = WorkbookFactory.create(new ByteArrayInputStream(bytes))) {
            Sheet sheet = workbook.getSheetAt(0);
            Row headerRow = sheet.getRow(sheet.getFirstRowNum());
            if (headerRow == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Fichier Excel vide");
            }
            DataFormatter formatter = new DataFormatter();
            List<String> headers = new ArrayList<>();
            for (Cell cell : headerRow) {
                headers.add(formatter.formatCellValue(cell).trim());
            }

            java.util.Map<String, List<String>> samples = new java.util.LinkedHashMap<>();
            int rowCount = 0;
            for (int r = headerRow.getRowNum() + 1; r <= sheet.getLastRowNum(); r++) {
                Row row = sheet.getRow(r);
                if (row == null) {
                    continue;
                }
                rowCount++;
                if (rowCount <= MAX_SAMPLES_PER_COLUMN) {
                    for (int c = 0; c < headers.size(); c++) {
                        Cell cell = row.getCell(c);
                        String value = cell == null ? "" : formatter.formatCellValue(cell).trim();
                        samples.computeIfAbsent(headers.get(c), k -> new ArrayList<>()).add(value);
                    }
                }
            }
            return new ParsedTable(headers, samples, rowCount);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Fichier Excel illisible ou corrompu");
        }
    }
}
