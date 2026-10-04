import re
from typing import Dict, List, Optional
from app.db.models import Insight, RawDocument
from app.models.schemas import ThemeExample, ThemeStat, normalize_theme


def find_verbatim_quote(document_text: str, theme: str, fallback_candidates: List[str]) -> Optional[str]:
    """Find a quote in the source document that mentions the theme or key terms.
    GUARANTEES that the returned string is a VERBATIM SUBSTRING of document_text.
    """
    clean_doc = document_text.strip()
    sentences = re.split(r"(?<=[.!?\n])\s+", clean_doc)

    # 1. Look for sentence mentioning theme terms
    theme_terms = [t for t in theme.lower().split() if len(t) > 2]
    for s in sentences:
        s_clean = s.strip()
        if not s_clean:
            continue
        s_lower = s_clean.lower()
        if theme in s_lower or (theme_terms and all(term in s_lower for term in theme_terms)):
            if s_clean in document_text:
                return s_clean

    # 2. Check candidate pain points or feature requests
    for cand in fallback_candidates:
        cand_clean = cand.strip()
        if cand_clean and cand_clean in document_text:
            return cand_clean

    # 3. Fallback: return the first non-empty sentence that is in document_text
    for s in sentences:
        s_clean = s.strip()
        if len(s_clean) >= 10 and s_clean in document_text:
            return s_clean

    # 4. Ultimate fallback: substring of document text
    return clean_doc[:120] if clean_doc else None


def compute_theme_statistics(limit: int = 20, examples_per_theme: int = 2) -> Dict:
    """Compute accurate theme counts and find verbatim quotes across all processed insights.
    Theme counts are strictly computed in code.
    """
    # Fetch all insights
    insights = Insight.objects().all()
    total_insights = insights.count()
    if total_insights == 0:
        return {"data": [], "totalDocs": 0}

    # Fetch document texts in bulk for fast substring quote matching
    doc_ids = [ins.document_id for ins in insights]
    raw_docs = {str(d.id): d.text for d in RawDocument.objects(id__in=doc_ids)}

    # Map normalized theme -> list of (insight, doc_id)
    theme_occurrences: Dict[str, List[Insight]] = {}

    for ins in insights:
        seen_in_this_doc = set()
        for t in ins.themes:
            norm_t = normalize_theme(t)
            if norm_t and norm_t not in seen_in_this_doc:
                seen_in_this_doc.add(norm_t)
                theme_occurrences.setdefault(norm_t, []).append(ins)

    # Sort themes by count descending
    sorted_themes = sorted(
        theme_occurrences.items(),
        key=lambda item: len(item[1]),
        reverse=True,
    )

    theme_stats: List[ThemeStat] = []
    for theme_name, ins_list in sorted_themes[:limit]:
        count = len(ins_list)
        examples: List[ThemeExample] = []

        for ins in ins_list:
            if len(examples) >= examples_per_theme:
                break
            doc_text = raw_docs.get(ins.document_id)
            if not doc_text:
                continue

            candidates = list(ins.pain_points) + list(ins.feature_requests)
            quote = find_verbatim_quote(doc_text, theme_name, candidates)
            if quote and quote in doc_text:  # Verbatim verification
                # Avoid duplicate quotes
                if not any(ex.quote == quote for ex in examples):
                    examples.append(ThemeExample(documentId=ins.document_id, quote=quote))

        theme_stats.append(
            ThemeStat(
                theme=theme_name,
                count=count,
                totalDocs=total_insights,
                examples=examples,
            )
        )

    return {
        "data": [ts.model_dump() for ts in theme_stats],
        "totalDocs": total_insights,
    }


def get_existing_vocabulary() -> List[str]:
    """Return unique normalized list of existing themes across the database."""
    insights = Insight.objects().only("themes")
    vocab = set()
    for ins in insights:
        for t in ins.themes:
            norm = normalize_theme(t)
            if norm:
                vocab.add(norm)
    return sorted(list(vocab))
