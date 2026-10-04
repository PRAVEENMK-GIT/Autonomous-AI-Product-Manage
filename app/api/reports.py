import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Query, Response, status

from app.db.models import Report
from app.models.schemas import (
    ReportCreate,
    ReportListResponse,
    ReportResponse,
    ReportUpdate,
)
from app.services.report_service import (
    generate_new_report,
    get_export_markdown,
    update_existing_report,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.post("/generate", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
def generate_report(payload: Optional[ReportCreate] = None, stub: bool = Query(False)):
    """Generate a new one-page research brief from current insights."""
    title = payload.title if payload and payload.title else "Discovery & Research Brief"
    report = generate_new_report(title=title, use_stub=stub)
    return ReportResponse(**report.to_dict())


@router.get("", response_model=ReportListResponse)
def list_reports(
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=100),
):
    """List historical reports."""
    qs = Report.objects().order_by("-created_at")
    total = qs.count()
    skip = (page - 1) * pageSize
    items = qs.skip(skip).limit(pageSize)

    return ReportListResponse(
        data=[ReportResponse(**r.to_dict()) for r in items],
        total=total,
    )


@router.get("/{id}", response_model=ReportResponse)
def get_report(id: str):
    """Get single report by ID."""
    report = Report.objects(id=id).first()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Report '{id}' not found")
    return ReportResponse(**report.to_dict())


@router.patch("/{id}", response_model=ReportResponse)
def patch_report(id: str, update_in: ReportUpdate):
    """Edit report markdown or update approval status (draft -> approved)."""
    updated = update_existing_report(id, update_in)
    return ReportResponse(**updated.to_dict())


@router.get("/{id}/export")
def export_report(id: str, format: str = Query("md")):
    """Export report as markdown file download."""
    if format.lower() != "md":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only 'md' format is supported for export")

    report = Report.objects(id=id).first()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Report '{id}' not found")

    content = get_export_markdown(report)
    filename = f"research-brief-v{report.version}-{report.status}.md"

    return Response(
        content=content,
        media_type="text/markdown; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "no-cache",
        },
    )
