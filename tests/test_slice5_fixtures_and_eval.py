import json
import os
from pathlib import Path
import pytest
from starlette.testclient import TestClient

from app.db.models import Insight, RawDocument, Report
from app.db.mongo import disconnect_mongo, init_mongo
from app.main import app
from genai.eval import evaluate_dataset


@pytest.fixture(autouse=True)
def clean_db():
    os.environ["USE_MOCK_MONGO"] = "true"
    init_mongo()
    RawDocument.drop_collection()
    Insight.drop_collection()
    Report.drop_collection()
    yield
    try:
        init_mongo()
        RawDocument.drop_collection()
        Insight.drop_collection()
        Report.drop_collection()
    except Exception:
        pass


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


def test_sample_fixtures_exist():
    sample_dir = Path("data/sample")
    assert (sample_dir / "feedback.csv").exists()
    assert (sample_dir / "surveys.csv").exists()
    assert (sample_dir / "competitors.json").exists()
    assert (sample_dir / "labels.json").exists()

    with open(sample_dir / "labels.json", "r", encoding="utf-8") as f:
        labels = json.load(f)
    assert len(labels) == 15, "PRD requires exactly 15 hand-labelled eval items"


def test_load_sample_fixtures_endpoint(client):
    res = client.post("/documents/load-sample")
    assert res.status_code == 201
    data = res.json()
    assert data["created"] >= 20
    assert data["errors"] == []

    # Check total documents in DB
    docs_res = client.get("/documents")
    assert docs_res.status_code == 200
    assert docs_res.json()["total"] >= 20


def test_eval_script_execution():
    labels_path = Path("data/sample/labels.json")
    results = evaluate_dataset(labels_path, use_stub=True)

    assert results["totalItems"] == 15
    assert results["sentimentAccuracy"] >= 0.75
    assert results["themeRecall"] >= 0.85, "PRD requires >= 85% theme capture"
    assert results["themeF1"] >= 0.85
    assert results["painPointCaptureRate"] >= 0.80


def test_end_to_end_mvp_pipeline(client):
    """Verify complete user flow:
    Upload -> Batch Analyze -> Verify Themes & Quotes -> Generate Brief -> Edit -> Approve -> Export.
    """
    # 1. Ingest fixtures
    import_res = client.post("/documents/load-sample")
    assert import_res.status_code == 201

    # 2. Analyze documents
    docs = client.get("/documents").json()["data"]
    for doc in docs[:6]:
        analyze_res = client.post(f"/documents/{doc['id']}/analyze?stub=true")
        assert analyze_res.status_code == 200
        assert analyze_res.json()["status"] == "processed"

    # 3. Check insights
    insights = client.get("/insights").json()["data"]
    assert len(insights) >= 6

    # 4. Verify Theme engine
    themes_res = client.get("/themes?limit=5&examples=2")
    assert themes_res.status_code == 200
    themes = themes_res.json()["data"]
    assert len(themes) > 0
    # Every quote must be verbatim
    for t in themes:
        for ex in t["examples"]:
            source_doc = client.get(f"/documents/{ex['documentId']}").json()
            assert ex["quote"] in source_doc["text"], f"Quote '{ex['quote']}' is not a verbatim substring!"

    # 5. Generate Brief
    gen_res = client.post("/reports/generate?stub=true", json={"title": "Sprint 1 Discovery Brief"})
    assert gen_res.status_code == 201
    rep = gen_res.json()
    rep_id = rep["id"]
    assert rep["status"] == "draft"
    assert rep["version"] == 1

    # Verify counts in brief markdown match DB counts
    for t in rep["topThemes"][:3]:
        assert str(t["count"]) in rep["briefMarkdown"], f"Brief missing count {t['count']} for theme {t['theme']}"

    # 6. Edit Brief
    edit_res = client.patch(f"/reports/{rep_id}", json={"briefMarkdown": rep["briefMarkdown"] + "\n\nNote added."})
    assert edit_res.status_code == 200

    # 7. Approve Brief
    approve_res = client.patch(f"/reports/{rep_id}", json={"status": "approved"})
    assert approve_res.status_code == 200
    assert approve_res.json()["status"] == "approved"
    assert approve_res.json()["approvedAt"] is not None

    # 8. Export Brief as Markdown
    export_res = client.get(f"/reports/{rep_id}/export?format=md")
    assert export_res.status_code == 200
    assert "attachment" in export_res.headers["content-disposition"]
    # Since it is approved, it should NOT say "DRAFT: not approved"
    assert "DRAFT: not approved" not in export_res.text
