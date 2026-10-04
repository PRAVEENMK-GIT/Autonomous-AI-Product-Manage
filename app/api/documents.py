import asyncio
from datetime import datetime, timezone
import logging
from typing import List, Optional

from fastapi import APIRouter, BackgroundTasks, File, HTTPException, Query, UploadFile, status

from app.db.models import Insight, RawDocument
from app.models.schemas import (
    DocStatus,
    ImportResponse,
    RawDocumentCreate,
    RawDocumentListResponse,
    RawDocumentResponse,
    SourceType,
    compute_text_hash,
)
from app.services.analysis_service import (
    analyze_all_pending_task,
    execute_analysis_sync,
)
from app.services.import_service import (
    import_csv_content,
    import_json_content,
    import_txt_content,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/documents", tags=["Documents"])


@router.post("", response_model=RawDocumentResponse, status_code=status.HTTP_201_CREATED)
def create_document(doc_in: RawDocumentCreate):
    """Add one raw document to be queued for analysis.
    Executes in < 300ms without calling LLM. Flags duplicate textHash.
    """
    text_hash = compute_text_hash(doc_in.text)
    existing = RawDocument.objects(text_hash=text_hash).first()
    is_duplicate = bool(existing)

    doc = RawDocument(
        source_type=doc_in.sourceType,
        text=doc_in.text,
        rating=doc_in.rating,
        external_ref=doc_in.externalRef,
        text_hash=text_hash,
        status="pending",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    ).save()

    doc_dict = doc.to_dict()
    doc_dict["isDuplicate"] = is_duplicate
    return RawDocumentResponse(**doc_dict)


@router.post("/import", response_model=ImportResponse, status_code=status.HTTP_201_CREATED)
async def import_documents(
    file: UploadFile = File(...),
    default_source_type: Optional[SourceType] = Query(None),
):
    """Upload CSV, JSON, or TXT file to batch import raw documents."""
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No file uploaded")

    filename = file.filename.lower()
    raw_bytes = await file.read()
    try:
        content_str = raw_bytes.decode("utf-8")
    except UnicodeDecodeError:
        try:
            content_str = raw_bytes.decode("latin-1")
        except Exception:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File encoding must be UTF-8 or compatible text")

    try:
        if filename.endswith(".csv"):
            return import_csv_content(content_str, default_source_type)
        elif filename.endswith(".json"):
            return import_json_content(content_str, default_source_type)
        elif filename.endswith(".txt"):
            return import_txt_content(content_str, default_source_type)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file format '{filename}'. Please upload .csv, .json, or .txt",
            )
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))


@router.get("", response_model=RawDocumentListResponse)
def list_documents(
    status: Optional[DocStatus] = Query(None),
    sourceType: Optional[SourceType] = Query(None),
    page: int = Query(1, ge=1),
    pageSize: int = Query(50, ge=1, le=200),
):
    """List raw documents with filtering by status and source type."""
    query = {}
    if status:
        query["status"] = status
    if sourceType:
        query["source_type"] = sourceType

    qs = RawDocument.objects(**query).order_by("-created_at")
    total = qs.count()

    skip = (page - 1) * pageSize
    items = qs.skip(skip).limit(pageSize)

    return RawDocumentListResponse(
        data=[RawDocumentResponse(**d.to_dict()) for d in items],
        total=total,
    )


@router.post("/load-sample", response_model=ImportResponse, status_code=status.HTTP_201_CREATED)
def load_sample_fixtures():
    """Load default sample datasets from data/sample directory."""
    from pathlib import Path
    sample_dir = Path(__file__).parent.parent.parent / "data" / "sample"
    created = 0
    skipped = 0
    errors = []

    # 1. Load feedback.csv
    fb_path = sample_dir / "feedback.csv"
    if fb_path.exists():
        res1 = import_csv_content(fb_path.read_text(encoding="utf-8"), default_source_type="feedback")
        created += res1.created
        skipped += res1.skipped
        errors.extend(res1.errors)

    # 2. Load surveys.csv
    surv_path = sample_dir / "surveys.csv"
    if surv_path.exists():
        res2 = import_csv_content(surv_path.read_text(encoding="utf-8"), default_source_type="survey")
        created += res2.created
        skipped += res2.skipped
        errors.extend(res2.errors)

    # 3. Load competitors.json
    comp_path = sample_dir / "competitors.json"
    if comp_path.exists():
        res3 = import_json_content(comp_path.read_text(encoding="utf-8"), default_source_type="competitor")
        created += res3.created
        skipped += res3.skipped
        errors.extend(res3.errors)

    return ImportResponse(created=created, skipped=skipped, errors=errors)


@router.get("/{id}", response_model=RawDocumentResponse)
def get_document(id: str):
    """Get single document by ID."""
    doc = RawDocument.objects(id=id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Document '{id}' not found")
    return RawDocumentResponse(**doc.to_dict())


@router.delete("/{id}", status_code=status.HTTP_200_OK)
def delete_document(id: str):
    """Delete a document and its insight."""
    doc = RawDocument.objects(id=id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Document '{id}' not found")
    Insight.objects(document_id=id).delete()
    doc.delete()
    return {"id": id, "deleted": True}


@router.post("/{id}/analyze", status_code=status.HTTP_200_OK)
def analyze_single_document(id: str, stub: bool = Query(False)):
    """Analyze one document synchronously, persisting its Insight and updating status."""
    doc = RawDocument.objects(id=id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Document '{id}' not found")

    try:
        execute_analysis_sync(doc, use_stub=stub)
        return {"id": str(doc.id), "status": doc.status}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Analysis failed: {str(e)}",
        )


@router.post("/analyze-pending", status_code=status.HTTP_202_ACCEPTED)
def analyze_all_pending(background_tasks: BackgroundTasks, stub: bool = Query(False)):
    """Trigger background analysis for all pending documents with concurrency control."""
    pending_count = RawDocument.objects(status="pending").count()
    if pending_count > 0:
        background_tasks.add_task(analyze_all_pending_task, use_stub=stub)
    return {"queued": pending_count}
