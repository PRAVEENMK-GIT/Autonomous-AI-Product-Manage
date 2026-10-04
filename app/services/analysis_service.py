import asyncio
from datetime import datetime, timezone
import logging
import os
from typing import Optional

from app.db.models import Insight, RawDocument
from app.models.schemas import InsightResult
from app.services.theme_service import get_existing_vocabulary
from genai.analyzer import analyze_document

logger = logging.getLogger(__name__)

# Max 3 concurrent background LLM analysis tasks per PRD requirement
analysis_semaphore = asyncio.Semaphore(3)


def execute_analysis_sync(doc: RawDocument, use_stub: bool = False) -> Insight:
    """Synchronously analyze a RawDocument and persist or replace its Insight."""
    doc.status = "processing"
    doc.error_message = None
    doc.updated_at = datetime.now(timezone.utc)
    doc.save()

    try:
        existing_vocab = get_existing_vocabulary()
        insight_result: InsightResult = analyze_document(
            text=doc.text,
            source_type=doc.source_type,
            rating=doc.rating,
            existing_themes=existing_vocab,
            use_stub=use_stub,
        )

        # Upsert Insight for this document
        existing_insight = Insight.objects(document_id=str(doc.id)).first()
        if existing_insight:
            insight_doc = existing_insight
            insight_doc.sentiment = insight_result.sentiment
            insight_doc.themes = insight_result.themes
            insight_doc.pain_points = insight_result.painPoints
            insight_doc.feature_requests = insight_result.featureRequests
            insight_doc.competitor_mentions = insight_result.competitorMentions
            insight_doc.competitor = insight_result.competitor.model_dump() if insight_result.competitor else None
            insight_doc.summary = insight_result.summary
            insight_doc.review_status = "ai_draft"
            insight_doc.updated_at = datetime.now(timezone.utc)
        else:
            insight_doc = Insight(
                document_id=str(doc.id),
                source_type=doc.source_type,
                sentiment=insight_result.sentiment,
                themes=insight_result.themes,
                pain_points=insight_result.painPoints,
                feature_requests=insight_result.featureRequests,
                competitor_mentions=insight_result.competitorMentions,
                competitor=insight_result.competitor.model_dump() if insight_result.competitor else None,
                summary=insight_result.summary,
                model=os.getenv("NVIDIA_MODEL", "meta/llama-3.3-70b-instruct"),
                prompt_version="v1",
                review_status="ai_draft",
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
            )
        insight_doc.save()

        # Update document status to processed
        doc.status = "processed"
        doc.error_message = None
        doc.updated_at = datetime.now(timezone.utc)
        doc.save()
        return insight_doc

    except Exception as e:
        logger.error(f"Failed analyzing document {doc.id}: {e}")
        doc.status = "failed"
        doc.error_message = str(e)
        doc.updated_at = datetime.now(timezone.utc)
        doc.save()
        raise


async def analyze_document_async(doc_id: str, use_stub: bool = False) -> None:
    """Analyze a single document under concurrency control."""
    async with analysis_semaphore:
        doc = RawDocument.objects(id=doc_id).first()
        if not doc:
            return
        # Run blocking analysis in default threadpool executor
        loop = asyncio.get_running_loop()
        await loop.run_in_executor(None, execute_analysis_sync, doc, use_stub)


async def analyze_all_pending_task(use_stub: bool = False) -> int:
    """Background task to analyze all pending documents with concurrency cap."""
    pending_docs = RawDocument.objects(status="pending")
    doc_ids = [str(d.id) for d in pending_docs]
    if not doc_ids:
        return 0

    tasks = [analyze_document_async(did, use_stub) for did in doc_ids]
    await asyncio.gather(*tasks, return_exceptions=True)
    return len(doc_ids)
