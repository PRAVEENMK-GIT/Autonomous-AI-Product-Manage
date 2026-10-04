import io
import json
import os
import pytest
from starlette.testclient import TestClient

from app.db.models import Insight, RawDocument, Report
from app.db.mongo import disconnect_mongo, init_mongo
from app.main import app
from app.models.schemas import compute_text_hash


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


# =========================================================================
# 1. Documents API Tests
# =========================================================================

def test_create_document_success(client):
    payload = {
        "sourceType": "feedback",
        "text": "The search speed is terribly slow in the dashboard.",
        "rating": None,
        "externalRef": "jira-101",
    }
    res = client.post("/documents", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert isinstance(data["id"], str)
    assert data["status"] == "pending"
    assert data["sourceType"] == "feedback"
    assert data["textHash"] == compute_text_hash(payload["text"])
    assert data["isDuplicate"] is False


def test_create_document_duplicate_flag(client):
    payload = {
        "sourceType": "feedback",
        "text": "Identical feedback text for testing duplicate flag.",
    }
    # First upload
    res1 = client.post("/documents", json=payload)
    assert res1.status_code == 201
    assert res1.json()["isDuplicate"] is False

    # Second upload with same text
    res2 = client.post("/documents", json=payload)
    assert res2.status_code == 201
    assert res2.json()["isDuplicate"] is True


def test_create_document_validation_errors(client):
    # Missing text
    res = client.post("/documents", json={"sourceType": "feedback", "text": "   "})
    assert res.status_code == 422
    assert res.json()["code"] == "VALIDATION_ERROR"

    # Text exceeding 10,000 chars
    res = client.post("/documents", json={"sourceType": "feedback", "text": "a" * 10001})
    assert res.status_code == 422

    # Invalid sourceType
    res = client.post("/documents", json={"sourceType": "unknown_type", "text": "valid text"})
    assert res.status_code == 422


def test_import_csv_documents(client):
    csv_content = (
        "text,sourceType,rating,externalRef\n"
        "Onboarding was smooth and fast,survey,5,row-1\n"
        "Search crashes on big queries,feedback,,row-2\n"
        ",feedback,,row-3\n"  # missing text -> error
    )
    files = {"file": ("feedbacks.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")}
    res = client.post("/documents/import", files=files)
    assert res.status_code == 201
    data = res.json()
    assert data["created"] == 2
    assert len(data["errors"]) == 1
    assert data["errors"][0]["row"] == 3


def test_import_json_documents(client):
    json_data = [
        {"text": "Competitor X added AI copilot", "sourceType": "competitor"},
        {"text": "Too expensive for small teams", "sourceType": "feedback"},
    ]
    files = {"file": ("items.json", io.BytesIO(json.dumps(json_data).encode("utf-8")), "application/json")}
    res = client.post("/documents/import", files=files)
    assert res.status_code == 201
    assert res.json()["created"] == 2


def test_import_empty_or_invalid_file(client):
    # Empty CSV
    files = {"file": ("empty.csv", io.BytesIO(b""), "text/csv")}
    res = client.post("/documents/import", files=files)
    assert res.status_code == 400

    # CSV missing text column
    files = {"file": ("no_text.csv", io.BytesIO(b"colA,colB\n1,2\n"), "text/csv")}
    res = client.post("/documents/import", files=files)
    assert res.status_code == 400


def test_list_and_get_documents(client):
    # Insert 3 documents
    client.post("/documents", json={"sourceType": "feedback", "text": "Doc 1"})
    client.post("/documents", json={"sourceType": "survey", "text": "Doc 2", "rating": 3})
    client.post("/documents", json={"sourceType": "competitor", "text": "Doc 3"})

    res = client.get("/documents")
    assert res.status_code == 200
    assert res.json()["total"] == 3

    # Filter by sourceType
    res_survey = client.get("/documents?sourceType=survey")
    assert res_survey.json()["total"] == 1

    # Single document
    first_id = res.json()["data"][0]["id"]
    res_single = client.get(f"/documents/{first_id}")
    assert res_single.status_code == 200
    assert res_single.json()["id"] == first_id

    # 404 for unknown document
    res_missing = client.get("/documents/000000000000000000000000")
    assert res_missing.status_code == 404


# =========================================================================
# 2. Analysis Lifecycle Tests
# =========================================================================

def test_analyze_single_document_and_replace_insight(client):
    # Create document
    create_res = client.post("/documents", json={
        "sourceType": "feedback",
        "text": "The search speed is horribly slow and crashes on long queries. Please add caching.",
    })
    doc_id = create_res.json()["id"]

    # Analyze document using stub parameter
    analyze_res = client.post(f"/documents/{doc_id}/analyze?stub=true")
    assert analyze_res.status_code == 200
    assert analyze_res.json()["status"] == "processed"

    # Verify document status updated in DB
    doc_get = client.get(f"/documents/{doc_id}")
    assert doc_get.json()["status"] == "processed"

    # Verify Insight created
    ins_res = client.get(f"/insights?sourceType=feedback")
    assert ins_res.json()["total"] == 1
    insight = ins_res.json()["data"][0]
    assert insight["documentId"] == doc_id
    assert insight["sentiment"] == "negative"
    assert len(insight["painPoints"]) > 0

    # Re-analyze document: must REPLACE insight, NOT duplicate it!
    client.post(f"/documents/{doc_id}/analyze?stub=true")
    ins_res_after = client.get(f"/insights?sourceType=feedback")
    assert ins_res_after.json()["total"] == 1


def test_analyze_pending_background(client):
    # Insert 2 pending documents
    client.post("/documents", json={"sourceType": "feedback", "text": "Item 1 slow search"})
    client.post("/documents", json={"sourceType": "survey", "text": "Item 2 pricing is high", "rating": 2})

    res = client.post("/documents/analyze-pending?stub=true")
    assert res.status_code == 202
    assert res.json()["queued"] >= 2


# =========================================================================
# 3. Insights and Theme Engine Tests
# =========================================================================

def test_patch_insight(client):
    create_res = client.post("/documents", json={
        "sourceType": "feedback",
        "text": "The onboarding is confusing and layout is hard to navigate.",
    })
    doc_id = create_res.json()["id"]
    client.post(f"/documents/{doc_id}/analyze?stub=true")

    ins = client.get("/insights").json()["data"][0]
    ins_id = ins["id"]
    assert ins["reviewStatus"] == "ai_draft"

    # Human PATCH edit
    patch_res = client.patch(f"/insights/{ins_id}", json={
        "sentiment": "mixed",
        "themes": ["UI Navigation", "ui navigation"],  # should be normalized and deduplicated
        "summary": "PM updated summary: user struggled with navigation.",
    })
    assert patch_res.status_code == 200
    data = patch_res.json()
    assert data["sentiment"] == "mixed"
    assert data["themes"] == ["ui navigation"]
    assert data["reviewStatus"] == "edited"

    # Invalid sentiment should return 422
    invalid_patch = client.patch(f"/insights/{ins_id}", json={"sentiment": "super_happy"})
    assert invalid_patch.status_code == 422


def test_theme_statistics_and_verbatim_quotes(client):
    # Insert multiple documents with specific themes and analyze
    doc1 = client.post("/documents", json={
        "sourceType": "feedback",
        "text": "The search speed is terribly slow and sluggish.",
    }).json()
    doc2 = client.post("/documents", json={
        "sourceType": "survey",
        "text": "I love the product but search speed needs major improvement.",
        "rating": 4,
    }).json()

    client.post(f"/documents/{doc1['id']}/analyze?stub=true")
    client.post(f"/documents/{doc2['id']}/analyze?stub=true")

    themes_res = client.get("/themes?limit=5&examples=2")
    assert themes_res.status_code == 200
    themes_data = themes_res.json()["data"]
    assert len(themes_data) > 0

    top_theme = themes_data[0]
    # Theme count must equal number of insights mentioning it
    assert top_theme["count"] >= 1
    # Example quote must be a verbatim substring of source doc
    for ex in top_theme["examples"]:
        source_doc = client.get(f"/documents/{ex['documentId']}").json()
        assert ex["quote"] in source_doc["text"]


# =========================================================================
# 4. Reports API Tests
# =========================================================================

def test_report_lifecycle(client):
    # 1. Zero insights generates 409 Conflict
    empty_report_res = client.post("/reports/generate?stub=true")
    assert empty_report_res.status_code == 409
    assert empty_report_res.json()["code"] == "CONFLICT"

    # 2. Add and analyze documents
    doc = client.post("/documents", json={
        "sourceType": "feedback",
        "text": "The search speed takes 15 seconds to return rows. Please fix export options.",
    }).json()
    client.post(f"/documents/{doc['id']}/analyze?stub=true")

    # 3. Generate report
    gen_res = client.post("/reports/generate?stub=true", json={"title": "Q4 Research Brief"})
    assert gen_res.status_code == 201
    report = gen_res.json()
    rep_id = report["id"]
    assert report["title"] == "Q4 Research Brief"
    assert report["status"] == "draft"
    assert report["version"] == 1
    assert report["sourceDocCount"] == 1
    assert "Search Speed" in report["briefMarkdown"] or "search speed" in report["briefMarkdown"].lower()

    # 4. Approve report
    patch_approve = client.patch(f"/reports/{rep_id}", json={"status": "approved"})
    assert patch_approve.status_code == 200
    approved_rep = patch_approve.json()
    assert approved_rep["status"] == "approved"
    assert approved_rep["approvedAt"] is not None

    # 5. Editing an approved report moves it back to draft!
    patch_edit = client.patch(f"/reports/{rep_id}", json={"briefMarkdown": "# Edited Content"})
    assert patch_edit.status_code == 200
    assert patch_edit.json()["status"] == "draft"

    # 6. Regenerate creates version 2
    gen_res_v2 = client.post("/reports/generate?stub=true", json={"title": "Q4 Research Brief v2"})
    assert gen_res_v2.status_code == 201
    assert gen_res_v2.json()["version"] == 2

    # 7. Export markdown
    export_draft = client.get(f"/reports/{rep_id}/export?format=md")
    assert export_draft.status_code == 200
    assert "text/markdown" in export_draft.headers["content-type"]
    assert "DRAFT: not approved" in export_draft.text
