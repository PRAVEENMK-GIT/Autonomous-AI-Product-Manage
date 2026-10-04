import logging
from typing import List, Optional

from app.models.schemas import InsightResult, SourceType
from genai.chains import run_extraction_chain
from genai.llm import is_llm_configured
from genai.stub_analyzer import stub_analyze_text

logger = logging.getLogger(__name__)


def analyze_document(
    text: str,
    source_type: SourceType,
    rating: Optional[int] = None,
    existing_themes: Optional[List[str]] = None,
    use_stub: bool = False,
) -> InsightResult:
    """Analyze a single document text using the LLM chain or stub analyzer fallback.
    Returns validated, normalized InsightResult.
    """
    clean_text = text.strip()
    if not clean_text:
        raise ValueError("Cannot analyze empty document text")

    # If stub requested or live LLM credentials are not configured, use stub
    if use_stub or not is_llm_configured():
        logger.info("Using stub analyzer for document extraction")
        return stub_analyze_text(
            text=clean_text,
            source_type=source_type,
            rating=rating,
            existing_themes=existing_themes,
        )

    logger.info(f"Running LLM extraction chain for source_type={source_type}")
    try:
        result = run_extraction_chain(
            text=clean_text,
            source_type=source_type,
            rating=rating,
            existing_themes=existing_themes,
        )
        return result
    except Exception as e:
        logger.error(f"LLM extraction failed: {e}. Falling back to stub analyzer.")
        return stub_analyze_text(
            text=clean_text,
            source_type=source_type,
            rating=rating,
            existing_themes=existing_themes,
        )
