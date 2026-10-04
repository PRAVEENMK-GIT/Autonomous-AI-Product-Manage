import json
from unittest.mock import MagicMock, patch
import pytest
from langchain_core.messages import AIMessage

from app.models.schemas import CompetitorDetails, InsightResult, ThemeStat, ThemeExample
from genai.analyzer import analyze_document
from genai.chains import build_analysis_prompt, clean_json_text, run_extraction_chain
from genai.llm import get_llm, is_llm_configured
from genai.report import generate_stub_report_markdown, generate_report_content


def test_llm_config_check(monkeypatch):
    monkeypatch.setenv("NVIDIA_API_KEY", "nvapi-your-key-here")
    assert not is_llm_configured()

    monkeypatch.setenv("NVIDIA_API_KEY", "nvapi-real123456789")
    assert is_llm_configured()

    monkeypatch.setenv("NVIDIA_API_KEY", "")
    assert not is_llm_configured()


def test_get_llm_initialization(monkeypatch):
    monkeypatch.setenv("NVIDIA_API_KEY", "nvapi-test-key")
    monkeypatch.setenv("NVIDIA_MODEL", "meta/llama-3.3-70b-instruct")
    llm = get_llm()
    assert llm.model_name == "meta/llama-3.3-70b-instruct"
    assert "nvidia.com" in str(llm.openai_api_base)


def test_prompt_builders():
    fb_prompt = build_analysis_prompt("Search is slow", "feedback", existing_themes=["search speed"])
    assert "Search is slow" in fb_prompt
    assert "search speed" in fb_prompt

    survey_prompt = build_analysis_prompt("Decent onboarding", "survey", rating=4)
    assert "Decent onboarding" in survey_prompt
    assert "4" in survey_prompt

    comp_prompt = build_analysis_prompt("Competitor launched AI tool", "competitor")
    assert "Competitor launched AI tool" in comp_prompt


def test_clean_json_text():
    # Markdown wrapped
    raw1 = "```json\n{\"sentiment\": \"positive\", \"summary\": \"great\"}\n```"
    assert clean_json_text(raw1) == '{"sentiment": "positive", "summary": "great"}'

    # Conversational text surrounding json
    raw2 = "Sure, here is the JSON:\n{\"sentiment\": \"negative\"}\nHope this helps!"
    assert clean_json_text(raw2) == '{"sentiment": "negative"}'


@patch("genai.chains.get_llm")
def test_extraction_chain_structured_output(mock_get_llm):
    mock_llm = MagicMock()
    mock_get_llm.return_value = mock_llm

    expected = InsightResult(
        sourceType="feedback",
        sentiment="negative",
        themes=["search speed"],
        painPoints=["Search is very slow"],
        featureRequests=[],
        competitorMentions=[],
        summary="User complained about slow search.",
    )

    mock_structured = MagicMock()
    mock_structured.invoke.return_value = expected
    mock_llm.with_structured_output.return_value = mock_structured

    result = run_extraction_chain("Search is very slow", "feedback")
    assert result.sentiment == "negative"
    assert result.themes == ["search speed"]
    assert result.summary == "User complained about slow search."


@patch("genai.chains.get_llm")
def test_extraction_chain_fallback_json(mock_get_llm):
    mock_llm = MagicMock()
    mock_get_llm.return_value = mock_llm

    # Structured output throws exception
    mock_llm.with_structured_output.side_effect = RuntimeError("Structured output not supported")

    # Fallback raw call returns valid JSON in code block
    json_payload = {
        "sourceType": "feedback",
        "sentiment": "positive",
        "themes": ["onboarding"],
        "painPoints": [],
        "featureRequests": ["add dark mode"],
        "competitorMentions": [],
        "competitor": None,
        "summary": "Great onboarding experience.",
    }
    mock_llm.invoke.return_value = AIMessage(content=f"```json\n{json.dumps(json_payload)}\n```")

    result = run_extraction_chain("Great onboarding experience", "feedback")
    assert result.sentiment == "positive"
    assert result.themes == ["onboarding"]
    assert result.featureRequests == ["add dark mode"]


@patch("genai.chains.get_llm")
def test_extraction_chain_repair_retry(mock_get_llm):
    mock_llm = MagicMock()
    mock_get_llm.return_value = mock_llm

    # Structured output fails
    mock_llm.with_structured_output.side_effect = RuntimeError("Failed")

    # First invoke returns invalid JSON
    # Second invoke (repair) returns valid JSON
    valid_payload = {
        "sourceType": "survey",
        "sentiment": "neutral",
        "themes": ["pricing"],
        "painPoints": ["Too expensive"],
        "featureRequests": [],
        "competitorMentions": [],
        "summary": "Pricing is slightly high.",
    }
    mock_llm.invoke.side_effect = [
        AIMessage(content="Bad JSON response {broken..."),
        AIMessage(content=json.dumps(valid_payload)),
    ]

    result = run_extraction_chain("Pricing is slightly high", "survey", rating=3)
    assert result.sentiment == "neutral"
    assert result.themes == ["pricing"]


def test_analyze_document_stub():
    res = analyze_document(
        text="The app crashes on export to PDF. Need this fixed ASAP.",
        source_type="feedback",
        use_stub=True,
    )
    assert res.sentiment == "negative"
    assert any("export" in t or "performance" in t for t in res.themes)
    assert len(res.painPoints) > 0


def test_generate_report_markdown():
    theme_stats = [
        ThemeStat(
            theme="search speed",
            count=12,
            totalDocs=20,
            examples=[ThemeExample(documentId="doc1", quote="Search takes 10 seconds to load results")],
        ),
        ThemeStat(
            theme="pricing",
            count=5,
            totalDocs=20,
            examples=[ThemeExample(documentId="doc2", quote="Your price tier is double our budget")],
        ),
    ]

    brief = generate_stub_report_markdown(
        title="Q3 User Feedback",
        top_themes=theme_stats,
        source_doc_count=20,
    )

    assert "Discovery & Research Brief: Q3 User Feedback" in brief
    assert "Search Speed" in brief
    assert "12 mentions" in brief
    assert "Search takes 10 seconds to load results" in brief
    assert len(brief.split()) <= 400


def test_generate_report_content_offline():
    theme_stats = [
        ThemeStat(
            theme="navigation",
            count=4,
            totalDocs=10,
            examples=[ThemeExample(documentId="doc3", quote="Can never find the export button")],
        )
    ]
    md = generate_report_content("Navigation Audit", theme_stats, 10, use_stub=True)
    assert "Navigation Audit" in md
    assert "Can never find the export button" in md
