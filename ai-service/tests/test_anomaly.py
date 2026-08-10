"""Tests contrat anomaly."""


FEATURES = {
    "hour_of_day": 14,
    "export_count_24h": 2,
    "records_accessed": 40,
    "failed_logins_24h": 0,
    "is_new_device": False,
    "is_unusual_location": False,
    "actions_per_minute": 1.5,
    "sensitive_resource_ratio": 0.1,
}


def test_detect_anomaly_no_baseline_phase1(client, token):
    r = client.post(
        "/ai/detect-anomaly",
        json={
            "organization_id": "org-demo",
            "user_id": "user-1",
            "features": FEATURES,
        },
        headers={"X-Internal-Token": token},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["stub"] is True
    assert body["baseline_available"] is False
    assert body["is_anomaly"] is False
    assert body["anomaly_score"] == 0.0
    assert 0.0 <= body["confidence"] <= 1.0
    assert isinstance(body["feature_contributions"], list)


def test_train_requires_min_50_events(client, token):
    r = client.post(
        "/ai/anomaly/train",
        json={"organization_id": "org-demo", "events": [FEATURES] * 10},
        headers={"X-Internal-Token": token},
    )
    assert r.status_code == 422


def test_train_stub_ok(client, token):
    r = client.post(
        "/ai/anomaly/train",
        json={"organization_id": "org-demo", "events": [FEATURES] * 50},
        headers={"X-Internal-Token": token},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["stub"] is True
    assert body["status"] == "stub"
    assert body["n_samples"] == 50
    assert body["model_version"]
    assert body["trained_at"]
