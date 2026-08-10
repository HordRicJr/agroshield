"""Détection d'anomalies — stub (Phase 1). baseline_available=false."""

from datetime import datetime, timezone

from app.schemas.anomaly import (
    DetectAnomalyRequest,
    DetectAnomalyResponse,
    FeatureContribution,
    TrainAnomalyRequest,
    TrainAnomalyResponse,
)


def detect_anomaly(request: DetectAnomalyRequest) -> DetectAnomalyResponse:
    # Phase 1 : aucune baseline — le backend doit se rabattre sur ses règles.
    features = request.features
    contributions = [
        FeatureContribution(feature="export_count_24h", deviation=0.0),
        FeatureContribution(feature="failed_logins_24h", deviation=0.0),
        FeatureContribution(feature="actions_per_minute", deviation=0.0),
        FeatureContribution(
            feature="sensitive_resource_ratio",
            deviation=round(features.sensitive_resource_ratio, 3),
        ),
    ]
    return DetectAnomalyResponse(
        anomaly_score=0.0,
        is_anomaly=False,
        model_version=None,
        feature_contributions=contributions,
        baseline_available=False,
        confidence=0.0,
        stub=True,
    )


def train_anomaly(request: TrainAnomalyRequest) -> TrainAnomalyResponse:
    version = f"stub-phase1-{request.organization_id[:8]}"
    return TrainAnomalyResponse(
        organization_id=request.organization_id,
        model_version=version,
        n_samples=len(request.events),
        trained_at=datetime.now(timezone.utc),
        status="stub",
        stub=True,
    )
