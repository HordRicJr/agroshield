package com.agroshield.infrastructure.persistence.entity;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "data_classifications")
public class DataClassificationEntity {

    @Id
    private UUID id;

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "file_id")
    private UUID fileId;

    @Column(name = "column_name", nullable = false, length = 256)
    private String columnName;

    @Column(nullable = false, length = 64)
    private String classification;

    @Column(name = "risk_level", nullable = false, length = 32)
    private String riskLevel;

    private BigDecimal confidence;

    @Column(length = 16)
    private String method;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "recommended_policy", columnDefinition = "jsonb")
    private String recommendedPolicy;

    @Column(name = "human_validated", nullable = false)
    private boolean humanValidated;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @PrePersist
    void prePersist() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    public UUID getId() {
        return id;
    }

    public UUID getOrganizationId() {
        return organizationId;
    }

    public void setOrganizationId(UUID organizationId) {
        this.organizationId = organizationId;
    }

    public UUID getFileId() {
        return fileId;
    }

    public void setFileId(UUID fileId) {
        this.fileId = fileId;
    }

    public String getColumnName() {
        return columnName;
    }

    public void setColumnName(String columnName) {
        this.columnName = columnName;
    }

    public String getClassification() {
        return classification;
    }

    public void setClassification(String classification) {
        this.classification = classification;
    }

    public String getRiskLevel() {
        return riskLevel;
    }

    public void setRiskLevel(String riskLevel) {
        this.riskLevel = riskLevel;
    }

    public BigDecimal getConfidence() {
        return confidence;
    }

    public void setConfidence(BigDecimal confidence) {
        this.confidence = confidence;
    }

    public String getMethod() {
        return method;
    }

    public void setMethod(String method) {
        this.method = method;
    }

    public String getRecommendedPolicy() {
        return recommendedPolicy;
    }

    public void setRecommendedPolicy(String recommendedPolicy) {
        this.recommendedPolicy = recommendedPolicy;
    }

    public boolean isHumanValidated() {
        return humanValidated;
    }

    public void setHumanValidated(boolean humanValidated) {
        this.humanValidated = humanValidated;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
