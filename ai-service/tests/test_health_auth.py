"""Tests health + auth."""


def test_health_public(client):
    r = client.get("/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert "version" in body


def test_ready_503_when_models_not_loaded(client):
    r = client.get("/health/ready")
    assert r.status_code == 503
    body = r.json()
    assert body["models_loaded"] is False
    assert body["status"] == "not_ready"


def test_classify_requires_token(client):
    r = client.post("/ai/classify-data", json={"columns": [{"name": "tel", "samples": []}]})
    assert r.status_code == 401
    assert r.json()["error"]["code"] == "UNAUTHORIZED"


def test_classify_rejects_bad_token(client):
    r = client.post(
        "/ai/classify-data",
        json={"columns": [{"name": "tel", "samples": []}]},
        headers={"X-Internal-Token": "wrong"},
    )
    assert r.status_code == 401
