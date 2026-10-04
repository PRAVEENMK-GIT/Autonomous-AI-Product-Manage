from datetime import datetime, timezone
import logging
from typing import Optional
from fastapi import HTTPException, status

from app.db.models import Insight, Report
from app.models.schemas import ReportResponse, ReportUpdate, ThemeStat
from app.services.theme_service import compute_theme_statistics
from genai.report import generate_report_content

logger = logging.getLogger(__name__)


def generate_new_report(title: str = "Discovery & Research Brief", use_stub: bool = False) -> Report:
    """Generate a new research brief from current processed insights."""
    total_insights = Insight.objects().count()
    if total_insights == 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot generate report: No analyzed insights found. Please analyze documents first.",
        )

    # Compute top themes and verbatim quotes
    theme_res = compute_theme_statistics(limit=5, examples_per_theme=2)
    top_themes = [ThemeStat(**t) for t in theme_res["data"]]

    # Competitor insights
    comp_insights = [
        ins.to_dict() for ins in Insight.objects(source_type="competitor")[:5]
    ]

    brief_markdown = generate_report_content(
        title=title,
        top_themes=top_themes,
        source_doc_count=total_insights,
        competitor_insights=comp_insights,
        use_stub=use_stub,
    )

    # Check existing reports to determine version
    latest_report = Report.objects().order_by("-version").first()
    next_version = (latest_report.version + 1) if latest_report else 1

    report = Report(
        title=title,
        top_themes=[t.model_dump() for t in top_themes],
        brief_markdown=brief_markdown,
        source_doc_count=total_insights,
        status="draft",
        version=next_version,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    ).save()

    return report


def update_existing_report(report_id: str, update_in: ReportUpdate) -> Report:
    """Update report title, markdown, or approval status."""
    report = Report.objects(id=report_id).first()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Report with id '{report_id}' not found")

    is_editing_content = update_in.briefMarkdown is not None or update_in.title is not None
    is_approving = update_in.status == "approved"

    if update_in.title is not None:
        report.title = update_in.title

    if update_in.briefMarkdown is not None:
        report.brief_markdown = update_in.briefMarkdown

    if is_approving:
        report.status = "approved"
        report.approved_at = datetime.now(timezone.utc)
    elif update_in.status == "draft":
        report.status = "draft"
        report.approved_at = None
    elif is_editing_content and report.status == "approved":
        # PRD rule: Editing an approved report returns it to draft
        report.status = "draft"
        report.approved_at = None

    report.updated_at = datetime.now(timezone.utc)
    report.save()
    return report


def get_export_markdown(report: Report) -> str:
    """Prepare markdown for export with draft banner if unapproved."""
    lines = []
    if report.status == "draft":
        lines.append("> **DRAFT: not approved**\n")
    lines.append(report.brief_markdown)
    return "\n".join(lines)
