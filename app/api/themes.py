import logging
from fastapi import APIRouter, Query

from app.models.schemas import ThemeResponse
from app.services.theme_service import compute_theme_statistics

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/themes", tags=["Themes"])


@router.get("", response_model=ThemeResponse)
def get_themes(
    limit: int = Query(20, ge=1, le=100),
    examples: int = Query(2, ge=1, le=10),
):
    """Retrieve ranked themes with code-computed counts and verbatim source quotes."""
    res = compute_theme_statistics(limit=limit, examples_per_theme=examples)
    return ThemeResponse(**res)
