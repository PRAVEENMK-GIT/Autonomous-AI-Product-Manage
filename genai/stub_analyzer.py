from __future__ import annotations

import re
from typing import List, Optional
from app.models.schemas import CompetitorDetails, InsightResult, Sentiment, SourceType, normalize_theme


def stub_analyze_text(
    text: str,
    source_type: SourceType,
    rating: Optional[int] = None,
    existing_themes: Optional[List[str]] = None,
) -> InsightResult:
    """Deterministic, keyword-based stub analyzer that mirrors the LLM extraction contract.
    Ensures unit and integration tests run offline without network access or LLM credentials.
    """
    clean_text = text.strip()
    lower_text = clean_text.lower()

    # Determine sentiment
    positive_words = ["love", "great", "excellent", "fast", "awesome", "good", "amazing", "smooth", "happy", "helpful"]
    negative_words = ["slow", "bug", "error", "fail", "broken", "terrible", "bad", "crash", "hate", "confusing", "pain", "expensive", "frustrated", "missing"]

    pos_score = sum(1 for word in positive_words if word in lower_text)
    neg_score = sum(1 for word in negative_words if word in lower_text)

    if rating is not None:
        if rating >= 4:
            pos_score += 3
        elif rating <= 2:
            neg_score += 3

    if pos_score > 0 and neg_score > 0:
        sentiment: Sentiment = "mixed"
    elif neg_score > pos_score:
        sentiment = "negative"
    elif pos_score > neg_score:
        sentiment = "positive"
    else:
        sentiment = "neutral"

    # Extract themes and pain points based on real content
    detected_themes: List[str] = []
    pain_points: List[str] = []
    feature_requests: List[str] = []
    competitor_mentions: List[str] = []

    # Common domain themes mapping
    theme_keywords = {
        "search speed": ["search", "slow search", "query", "indexing"],
        "onboarding": ["onboarding", "sign up", "signup", "getting started", "welcome", "verification"],
        "export options": ["export", "csv", "pdf", "download", "format"],
        "pricing": ["pricing", "expensive", "cost", "tier", "subscription", "price", "$"],
        "ui navigation": ["navigation", "menu", "sidebar", "layout", "confusing ui", "cluttered", "unintuitive"],
        "integrations": ["integration", "slack", "jira", "github", "webhook", "api"],
        "mobile support": ["mobile", "ios", "android", "phone", "responsive"],
        "performance": ["lag", "slow", "latency", "freeze", "freezes", "crash", "crashes", "performance", "sluggish"],
        "reporting": ["report", "analytics", "dashboard", "metric", "chart", "discovery", "synthesis", "summary"],
    }

    # If existing vocabulary is provided, prefer matching it
    vocab_map = {normalize_theme(t): t for t in (existing_themes or [])}

    for theme_name, kws in theme_keywords.items():
        if any(kw in lower_text for kw in kws):
            matched_theme = vocab_map.get(theme_name, theme_name)
            detected_themes.append(matched_theme)

    # Competitor mentions
    known_competitors = ["slack", "jira", "notion", "linear", "competitor x", "competitor y", "asana", "trello", "amplitude", "mixpanel"]
    for comp in known_competitors:
        if comp in lower_text:
            competitor_mentions.append(comp.title())

    # Detect sentences for pain points & feature requests
    sentences = re.split(r"(?<=[.!?\n])\s+", clean_text)
    pain_words = [
        "slow", "broken", "can't", "cannot", "issue", "bug", "crash", "crashes",
        "problem", "difficult", "hard to", "fails", "freeze", "freezes",
        "terrible", "cluttered", "expensive", "sluggish", "lost work",
    ]
    for s in sentences:
        s_clean = s.strip()
        if not s_clean:
            continue
        s_lower = s_clean.lower()
        if any(w in s_lower for w in pain_words):
            if len(pain_points) < 4 and s_clean not in pain_points:
                pain_points.append(s_clean)
        if any(w in s_lower for w in ["wish", "would like", "need", "please add", "feature request", "should have", "want to be able", "support for", "prioritize", "export option"]):
            if len(feature_requests) < 4 and s_clean not in feature_requests:
                feature_requests.append(s_clean)

    # Competitor details if source is competitor
    competitor_details: Optional[CompetitorDetails] = None
    if source_type == "competitor":
        competitor_details = CompetitorDetails(
            features=[s.strip() for s in sentences if any(k in s.lower() for k in ["launch", "feature", "release", "tool"])][:2],
            pricing=[s.strip() for s in sentences if any(k in s.lower() for k in ["$", "price", "plan", "free", "tier"])][:2],
            strengths=[s.strip() for s in sentences if any(k in s.lower() for k in ["good", "strong", "lead", "fast", "best"])][:2],
            weaknesses=[s.strip() for s in sentences if any(k in s.lower() for k in ["lack", "weak", "missing", "expensive", "poor"])][:2],
            moves=[s.strip() for s in sentences if any(k in s.lower() for k in ["announce", "pivot", "hire", "acquired", "expansion"])][:2],
        )

    # 1-2 sentence summary
    first_sentence = sentences[0].strip() if sentences else clean_text[:100]
    summary = f"Identified {sentiment} sentiment regarding {', '.join(detected_themes[:2]) if detected_themes else 'general feedback'}. {first_sentence}"
    if len(summary) > 990:
        summary = summary[:990] + "..."

    return InsightResult(
        sourceType=source_type,
        sentiment=sentiment,
        themes=detected_themes,
        painPoints=pain_points,
        featureRequests=feature_requests,
        competitorMentions=competitor_mentions,
        competitor=competitor_details,
        summary=summary,
    )
