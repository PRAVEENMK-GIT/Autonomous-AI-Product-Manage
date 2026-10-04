import csv
import io
import json
import logging
from typing import Any, Dict, List, Optional, Tuple
from pydantic import ValidationError

from app.db.models import RawDocument
from app.models.schemas import (
    ImportResponse,
    RawDocumentCreate,
    RowError,
    SourceType,
    compute_text_hash,
)

logger = logging.getLogger(__name__)


def parse_and_import_items(
    items: List[Dict[str, Any]],
    default_source_type: Optional[SourceType] = None,
) -> ImportResponse:
    """Validate and insert a list of item dictionaries into RawDocument."""
    created = 0
    skipped = 0
    errors: List[RowError] = []

    for idx, raw_item in enumerate(items, start=1):
        try:
            # Map possible field variations
            text = (
                raw_item.get("text")
                or raw_item.get("content")
                or raw_item.get("body")
                or raw_item.get("feedback")
                or raw_item.get("comment")
            )
            if not text:
                errors.append(RowError(row=idx, error="Missing required text/content field"))
                continue

            src_type = raw_item.get("sourceType") or raw_item.get("source_type") or default_source_type or "feedback"
            rating = raw_item.get("rating")
            if rating is not None and str(rating).strip() != "":
                try:
                    rating = int(float(rating))
                except (ValueError, TypeError):
                    errors.append(RowError(row=idx, error=f"Invalid rating value: {rating}"))
                    continue
            else:
                rating = None

            ext_ref = raw_item.get("externalRef") or raw_item.get("id") or raw_item.get("ref")

            # Validate via Pydantic
            doc_in = RawDocumentCreate(
                sourceType=src_type,
                text=str(text),
                rating=rating,
                externalRef=str(ext_ref) if ext_ref is not None else None,
            )

            h = compute_text_hash(doc_in.text)

            # Check duplicate hash
            existing = RawDocument.objects(text_hash=h).first()
            if existing:
                skipped += 1
                continue

            RawDocument(
                source_type=doc_in.sourceType,
                text=doc_in.text,
                rating=doc_in.rating,
                external_ref=doc_in.externalRef,
                text_hash=h,
                status="pending",
            ).save()
            created += 1

        except ValidationError as ve:
            err_msg = "; ".join([e["msg"] for e in ve.errors()])
            errors.append(RowError(row=idx, error=err_msg))
        except Exception as e:
            errors.append(RowError(row=idx, error=str(e)))

    return ImportResponse(created=created, skipped=skipped, errors=errors)


def import_csv_content(content_str: str, default_source_type: Optional[SourceType] = None) -> ImportResponse:
    if not content_str.strip():
        raise ValueError("Uploaded CSV content is empty")

    reader = csv.DictReader(io.StringIO(content_str))
    if not reader.fieldnames:
        raise ValueError("CSV file has no header row")

    # Check for text column
    field_lower = [f.lower().strip() for f in reader.fieldnames if f]
    text_fields = ["text", "content", "body", "feedback", "comment"]
    if not any(tf in field_lower for tf in text_fields):
        raise ValueError(f"CSV must contain a 'text' or 'content' column. Found columns: {reader.fieldnames}")

    rows = list(reader)
    if not rows:
        raise ValueError("CSV contains no data rows")

    return parse_and_import_items(rows, default_source_type)


def import_json_content(content_str: str, default_source_type: Optional[SourceType] = None) -> ImportResponse:
    if not content_str.strip():
        raise ValueError("Uploaded JSON content is empty")

    try:
        data = json.loads(content_str)
    except json.JSONDecodeError as jde:
        raise ValueError(f"Malformed JSON: {jde}")

    if not isinstance(data, list):
        raise ValueError("Uploaded JSON must be an array of objects")

    if not data:
        raise ValueError("JSON array is empty")

    return parse_and_import_items(data, default_source_type)


def import_txt_content(content_str: str, default_source_type: Optional[SourceType] = None) -> ImportResponse:
    if not content_str.strip():
        raise ValueError("Uploaded TXT content is empty")

    # Split by blank lines or newlines as discrete feedback items
    raw_blocks = [block.strip() for block in content_str.split("\n\n") if block.strip()]
    if not raw_blocks:
        raw_blocks = [line.strip() for line in content_str.splitlines() if line.strip()]

    items = [{"text": block, "sourceType": default_source_type or "feedback"} for block in raw_blocks]
    return parse_and_import_items(items, default_source_type)
