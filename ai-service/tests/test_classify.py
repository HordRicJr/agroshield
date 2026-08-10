"""Tests contrat classify-data."""


def test_classify_stub_shape(client, token):
    payload = {
        "columns": [
            {"name": "telephone", "samples": ["+22890123456", "+22899887766"]},
            {"name": "superficie_ha", "samples": ["1.2", "3.5"]},
            {"name": "montant_fcfa", "samples": ["15000"]},
        ]
    }
    r = client.post(
        "/ai/classify-data",
        json=payload,
        headers={"X-Internal-Token": token},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["stub"] is True
    assert len(body["results"]) == 3

    tel = body["results"][0]
    assert tel["column"] == "telephone"
    assert tel["classification"] == "PERSONAL_SENSITIVE"
    assert tel["risk_level"] == "HIGH"
    assert 0.0 <= tel["confidence"] <= 1.0
    assert tel["method"] in ("RULE", "MODEL", "HYBRID")
    assert "encrypt_at_rest" in tel["recommended_policy"]
    assert isinstance(tel["evidence"], list) and tel["evidence"]


def test_classify_max_columns_validation(client, token):
    cols = [{"name": f"c{i}", "samples": []} for i in range(101)]
    r = client.post(
        "/ai/classify-data",
        json={"columns": cols},
        headers={"X-Internal-Token": token},
    )
    assert r.status_code == 422
    assert r.json()["error"]["code"] == "VALIDATION_ERROR"


def test_classify_deterministic(client, token):
    payload = {"columns": [{"name": "iban_client", "samples": ["TG53..."]}]}
    headers = {"X-Internal-Token": token}
    a = client.post("/ai/classify-data", json=payload, headers=headers).json()
    b = client.post("/ai/classify-data", json=payload, headers=headers).json()
    assert a["results"] == b["results"]
