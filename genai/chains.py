import json
import logging
import os
import re
from pathlib import Path
from typing import List, Optional

from langchain_core.messages import HumanMessage, SystemMessage
from pydantic import ValidationError

from app.models.schemas import InsightResult, SourceType
from genai.llm import get_llm, llm_retry_decorator

logger = logging.getLogger(__name__)

PROMPTS_DIR = Path(__file__).parent / "prompts"


def load_prompt_template(filename: str) -> str:
    path = PROMPTS_DIR / filename
    if not path.exists():
        raise FileNotFoundError(f"Prompt template not found at {path}")
    return path.read_text(encoding="utf-8")


def clean_json_text(text: str) -> str:
    """Extract JSON object from markdown code blocks or surrounding text."""
    text = text.strip()
    match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    if match:
        return match.group(1).strip()
    # Try finding first { to last }
    first_brace = text.find("{")
    last_brace = text.rfind("}")
    if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
        return text[first_brace : last_brace + 1].strip()
    return text


def build_analysis_prompt(
    text: str,
    source_type: SourceType,
    rating: Optional[int] = None,
    existing_themes: Optional[List[str]] = None,
) -> str:
    vocab_str = ", ".join(existing_themes) if existing_themes else "None yet."

    if source_type == "feedback":
        tpl = load_prompt_template("feedback_v1.txt")
        return tpl.format(text=text, existing_themes=vocab_str)
    elif source_type == "survey":
        tpl = load_prompt_template("survey_v1.txt")
        rating_str = str(rating) if rating is not None else "Not provided"
        return tpl.format(text=text, rating=rating_str, existing_themes=vocab_str)
    elif source_type == "competitor":
        tpl = load_prompt_template("competitor_v1.txt")
        return tpl.format(text=text, existing_themes=vocab_str)
    else:
        raise ValueError(f"Unknown source type: {source_type}")


@llm_retry_decorator
def run_extraction_chain(
    text: str,
    source_type: SourceType,
    rating: Optional[int] = None,
    existing_themes: Optional[List[str]] = None,
) -> InsightResult:
    """Runs LLM structured extraction with automatic retry and JSON repair fallback."""
    llm = get_llm()
    prompt_str = build_analysis_prompt(text, source_type, rating, existing_themes)

    # First attempt: Try with_structured_output
    try:
        structured_llm = llm.with_structured_output(InsightResult)
        result = structured_llm.invoke([HumanMessage(content=prompt_str)])
        if isinstance(result, InsightResult):
            return result
        elif isinstance(result, dict):
            return InsightResult(**result)
    except Exception as e:
        logger.warning(f"Structured output failed: {e}. Falling back to JSON parsing mode.")

    # Fallback attempt 1: Standard LLM call requesting JSON
    json_instructions = (
        "\n\nYou MUST respond with ONLY a valid raw JSON object conforming to this schema:\n"
        "{\n"
        '  "sourceType": "' + source_type + '",\n'
        '  "sentiment": "positive"|"negative"|"neutral"|"mixed",\n'
        '  "themes": ["theme1", "theme2"],\n'
        '  "painPoints": ["pain1"],\n'
        '  "featureRequests": ["req1"],\n'
        '  "competitorMentions": ["comp1"],\n'
        '  "competitor": null,\n'
        '  "summary": "1-2 sentence summary"\n'
        "}\nDo not wrap in markdown or backticks."
    )
    raw_response = llm.invoke([HumanMessage(content=prompt_str + json_instructions)])
    raw_content = raw_response.content if hasattr(raw_response, "content") else str(raw_response)

    try:
        cleaned = clean_json_text(raw_content)
        parsed = json.loads(cleaned)
        # Ensure sourceType is correct
        parsed["sourceType"] = source_type
        return InsightResult(**parsed)
    except (json.JSONDecodeError, ValidationError) as parse_err:
        logger.warning(f"JSON parse error on first attempt: {parse_err}. Attempting 1 repair retry.")

    # Repair Retry: Ask LLM to fix the invalid JSON
    repair_prompt = (
        "You produced invalid JSON or violated schema. Fix it and return ONLY the valid JSON object:\n\n"
        f"Original text:\n{raw_content}\n\nError:\n{parse_err}\n\n"
        "Valid JSON object only:"
    )
    repair_response = llm.invoke([HumanMessage(content=repair_prompt)])
    repair_content = repair_response.content if hasattr(repair_response, "content") else str(repair_response)
    cleaned_repair = clean_json_text(repair_content)
    parsed_repair = json.loads(cleaned_repair)
    parsed_repair["sourceType"] = source_type
    return InsightResult(**parsed_repair)
