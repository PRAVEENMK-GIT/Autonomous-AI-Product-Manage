import os
import pytest
from pydantic import ValidationError
from starlette.testclient import TestClient

from app.db.mongo import disconnect_mongo, init_mongo, is_mongo_alive
from app.db.models import Insight, RawDocument, Report
from app.main import app
from app.models.schemas import (
    CompetitorDetails,
    DocStatus,
    InsightResult,
    InsightUpdate,
    RawDocumentCreate,
    ReportCreate,
    ReportUpdate,
    ThemeStat,
    compute_text_hash,
    normalize_theme,
)
from genai.stub_analyzer import stub_analyze_text


@pytest.fixture(autouse=True)
def setup_test_db():
    os.environ["USE_MOCK_MONGO"] = "true"
    init_mongo()
    yield
    try:
        init_mongo()
        RawDocument.drop_collection()
        Insight.drop_collection()
        Report.drop_collection()
    except Exception:
        pass


def test_theme_normalization():
    assert normalize_theme("  Search Speed ") == "search speed"
    assert normalize_theme("FAST   LOAD   TIME") == "fast load time"
    assert normalize_theme("already_clean") == "already_clean"


def test_text_hash_computation():
    h1 = compute_text_hash("Hello World")
    h2 = compute_text_hash("  Hello   World  \n")
    assert h1 == h2
    assert len(h1) == 64


def test_raw_document_schema_validation():
    # Valid feedback
    doc = RawDocumentCreate(sourceType="feedback", text="The search is quite slow.")
    assert doc.sourceType == "feedback"
    assert doc.text == "The search is quite slow."
    assert doc.rating is None

    # Valid survey with rating
    survey = RawDocumentCreate(sourceType="survey", text="Good product overall.", rating=4)
    assert survey.rating == 4

    # Invalid empty text
    with pytest.raises(ValidationError):
        RawDocumentCreate(sourceType="feedback", text="   ")

    # Invalid source type
    with pytest.raises(ValidationError):
        RawDocumentCreate(sourceType="invalid_type", text="test")  # type: ignore

    # Invalid rating (> 5 or < 1)
    with pytest.raises(ValidationError):
        RawDocumentCreate(sourceType="survey", text="test", rating=6)

    with pytest.raises(ValidationError):
        RawDocumentCreate(sourceType="survey", text="test", rating=0)

    # Exceeding 10,000 characters
    with pytest.raises(ValidationError):
        RawDocumentCreate(sourceType="feedback", text="a" * 10001)


def test_insight_result_and_updates():
    result = InsightResult(
        sourceType="feedback",
        sentiment="negative",
        themes=["Search Speed", "search speed", "  ONBOARDING  "],
        painPoints=["Search takes 10s to load"],
        featureRequests=["Add fast filters"],
        competitorMentions=["Slack"],
        summary="User is unhappy about slow search speed.",
    )
    # Deduplicated & normalized themes
    assert result.themes == ["search speed", "onboarding"]
    assert result.sentiment == "negative"

    # Insight update
    update = InsightUpdate(
        sentiment="positive",
        themes=["Faster Search", "FASTER SEARCH"],
        summary="Updated after PM review.",
    )
    assert update.themes == ["faster search"]
    assert update.sentiment == "positive"


def test_competitor_details_schema():
    comp = CompetitorDetails(
        features=["Feature A", "Feature B"],
        pricing=["$10/mo"],
        strengths=["Great UI"],
        weaknesses=["No API"],
        moves=["Raised Series B"],
    )
    assert len(comp.features) == 2
    assert comp.pricing == ["$10/mo"]


def test_mongo_models_crud():
    # RawDocument creation and to_dict
    h = compute_text_hash("Sample feedback text")
    raw = RawDocument(
        source_type="feedback",
        text="Sample feedback text",
        text_hash=h,
        status="pending",
    ).save()

    raw_dict = raw.to_dict()
    assert raw_dict["id"] == str(raw.id)
    assert raw_dict["sourceType"] == "feedback"
    assert raw_dict["textHash"] == h
    assert raw_dict["status"] == "pending"

    # Insight creation and to_dict
    insight = Insight(
        document_id=str(raw.id),
        source_type="feedback",
        sentiment="negative",
        themes=["search speed"],
        pain_points=["Slow search queries"],
        feature_requests=["Caching"],
        competitor_mentions=["Algolia"],
        summary="Search is too slow.",
    ).save()

    insight_dict = insight.to_dict()
    assert insight_dict["id"] == str(insight.id)
    assert insight_dict["documentId"] == str(raw.id)
    assert insight_dict["themes"] == ["search speed"]
    assert insight_dict["reviewStatus"] == "ai_draft"

    # Report creation and to_dict
    report = Report(
        title="Sprint 1 Discovery",
        top_themes=[{"theme": "search speed", "count": 1, "totalDocs": 1, "examples": []}],
        brief_markdown="# Research Brief\n\nTop issue is search speed.",
        source_doc_count=1,
    ).save()

    report_dict = report.to_dict()
    assert report_dict["id"] == str(report.id)
    assert report_dict["status"] == "draft"
    assert report_dict["version"] == 1


def test_stub_analyzer():
    # Test feedback with keywords
    fb_text = "The search speed is terribly slow and crashes frequently. I wish you had instant export to CSV."
    fb_res = stub_analyze_text(fb_text, "feedback")
    assert fb_res.sentiment == "negative"
    assert "search speed" in fb_res.themes or "performance" in fb_res.themes
    assert len(fb_res.painPoints) > 0
    assert len(fb_res.featureRequests) > 0

    # Test competitor note
    comp_text = "Slack launched a new AI feature. Their pricing is $15/user. Great UI strengths, but poor export weaknesses."
    comp_res = stub_analyze_text(comp_text, "competitor")
    assert "Slack" in comp_res.competitorMentions
    assert comp_res.competitor is not None
    assert len(comp_res.competitor.pricing) > 0

    # Test clean/empty content
    empty_res = stub_analyze_text("Everything is okay.", "survey", rating=5)
    assert empty_res.sentiment == "positive"
    assert empty_res.sourceType == "survey"


def test_health_endpoint():
    with TestClient(app) as client:
        res = client.get("/health")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "ok"
        assert data["mongo"] is True
