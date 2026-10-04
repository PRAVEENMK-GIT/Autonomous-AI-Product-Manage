from datetime import datetime, timezone
import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, Query, status

from app.db.models import Insight
from app.models.schemas import (
    InsightListResponse,
    InsightResponse,
    InsightUpdate,
    Sentiment,
    SourceType,
    normalize_theme,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/insights", tags=["Insights"])


@router.get("", response_model=InsightListResponse)
def list_insights(
    theme: Optional[str] = Query(None),
    sentiment: Optional[Sentiment] = Query(None),
    sourceType: Optional[SourceType] = Query(None),
    page: int = Query(1, ge=1),
    pageSize: int = Query(50, ge=1, le=200),
):
    """List insights with filters (theme, sentiment, sourceType) and pagination."""
    query = {}
    if sentiment:
        query["sentiment"] = sentiment
    if sourceType:
        query["source_type"] = sourceType
    if theme:
        norm_theme = normalize_theme(theme)
        query["themes"] = norm_theme

    qs = Insight.objects(**query).order_by("-created_at")
    total = qs.count()

    skip = (page - 1) * pageSize
    items = qs.skip(skip).limit(pageSize)

    return InsightListResponse(
        data=[InsightResponse(**ins.to_dict()) for ins in items],
        total=total,
    )


@router.get("/{id}", response_model=InsightResponse)
def get_insight(id: str):
    """Get single insight by ID."""
    ins = Insight.objects(id=id).first()
    if not ins:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Insight '{id}' not found")
    return InsightResponse(**ins.to_dict())


@router.patch("/{id}", response_model=InsightResponse)
def patch_insight(id: str, update_in: InsightUpdate):
    """Human edit of an insight. Updates fields and marks reviewStatus as 'edited'."""
    ins = Insight.objects(id=id).first()
    if not ins:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Insight '{id}' not found")

    if update_in.sentiment is not None:
        ins.sentiment = update_in.sentiment

    if update_in.themes is not None:
        ins.themes = update_in.themes

    if update_in.painPoints is not None:
        ins.pain_points = update_in.painPoints

    if update_in.featureRequests is not None:
        ins.feature_requests = update_in.featureRequests

    if update_in.competitorMentions is not None:
        ins.competitor_mentions = update_in.competitorMentions

    if update_in.competitor is not None:
        ins.competitor = update_in.competitor.model_dump()

    if update_in.summary is not None:
        ins.summary = update_in.summary

    ins.review_status = "edited"
    ins.updated_at = datetime.now(timezone.utc)
    ins.save()

    return InsightResponse(**ins.to_dict())
