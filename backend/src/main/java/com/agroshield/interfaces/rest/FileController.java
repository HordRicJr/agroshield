package com.agroshield.interfaces.rest;

import java.util.List;
import java.util.UUID;

import org.slf4j.MDC;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.agroshield.application.files.FileAnalyzeService;
import com.agroshield.application.files.FileStorageService;
import com.agroshield.application.files.dto.AnalyzeFileResult;
import com.agroshield.application.files.dto.FileMetadataView;
import com.agroshield.infrastructure.persistence.entity.FileMetadataEntity;
import com.agroshield.infrastructure.security.CorrelationIdFilter;
import com.agroshield.interfaces.rest.dto.ApiResponse;

@RestController
@RequestMapping("/api/v1/files")
public class FileController {

    private final FileStorageService fileStorageService;
    private final FileAnalyzeService fileAnalyzeService;

    public FileController(FileStorageService fileStorageService, FileAnalyzeService fileAnalyzeService) {
        this.fileStorageService = fileStorageService;
        this.fileAnalyzeService = fileAnalyzeService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('DATA_WRITE')")
    public ApiResponse<FileMetadataView> upload(@RequestPart("file") MultipartFile file) {
        return ApiResponse.ok(fileStorageService.upload(file), corr());
    }

    @GetMapping
    @PreAuthorize("hasAuthority('DATA_READ')")
    public ApiResponse<List<FileMetadataView>> list() {
        return ApiResponse.ok(fileStorageService.list(), corr());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('DATA_READ')")
    public ApiResponse<FileMetadataView> get(@PathVariable UUID id) {
        return ApiResponse.ok(fileStorageService.get(id), corr());
    }

    @PostMapping("/{id}/analyze")
    @PreAuthorize("hasAuthority('DATA_WRITE')")
    public ApiResponse<AnalyzeFileResult> analyze(@PathVariable UUID id) {
        return ApiResponse.ok(fileAnalyzeService.analyze(id), corr());
    }

    @GetMapping("/{id}/content")
    @PreAuthorize("hasAuthority('DATA_READ')")
    public ResponseEntity<Resource> download(@PathVariable UUID id) {
        FileMetadataEntity meta = fileStorageService.requireOwned(id);
        Resource resource = fileStorageService.loadContent(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + meta.getOriginalName() + "\"")
                .contentType(meta.getContentType() != null
                        ? MediaType.parseMediaType(meta.getContentType())
                        : MediaType.APPLICATION_OCTET_STREAM)
                .body(resource);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAuthority('DATA_DELETE') or hasAuthority('DATA_WRITE')")
    public void delete(@PathVariable UUID id) {
        fileStorageService.delete(id);
    }

    private static String corr() {
        String id = MDC.get(CorrelationIdFilter.MDC_KEY);
        return id != null ? id : "unknown";
    }
}
