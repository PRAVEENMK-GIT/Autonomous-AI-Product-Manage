from __future__ import annotations

import hashlib
import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field, field_validator, model_validator

SourceType = Literal["feedback", "survey", "competitor"]
DocStatus = Literal["pending", "processing", "processed", "failed"]
Sentiment = Literal["positive", "negative", "neutral", "mixed"]
ReviewStatus = Literal["ai_draft", "edited"]
ReportStatus = Literal["draft", "approved"]


def normalize_theme(theme: str) -> str:
    """Normalize theme string: lowercase, strip, collapse multiple spaces."""
    cleaned = re.sub(r"\s+", " ", theme.strip().lower())
    return cleaned


def compute_text_hash(text: str) -> str:
    """Compute sha256 hash of normalized text."""
    normalized = " ".join(text.strip().split())
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()


class CompetitorDetails(BaseModel):
    features: List[str] = Field(default_factory=list)
    pricing: List[str] = Field(default_factory=list)
    strengths: List[str] = Field(default_factory=list)
    weaknesses: List[str] = Field(default_factory=list)
    moves: List[str] = Field(default_factory=list)


class InsightResult(BaseModel):
    """Extraction output from LLM/analyzer."""
    sourceType: SourceType
    sentiment: Sentiment
    themes: List[str] = Field(default_factory=list)
    painPoints: List[str] = Field(default_factory=list)
    featureRequests: List[str] = Field(default_factory=list)
    competitorMentions: List[str] = Field(default_factory=list)
    competitor: Optional[CompetitorDetails] = None
    summary: str = Field(..., max_length=1000)

    @field_validator("themes", mode="after")
    @classmethod
    def normalize_themes_list(cls, v: List[str]) -> List[str]:
        seen = set()
        result = []
        for item in v:
            norm = normalize_theme(item)
            if norm and norm not in seen:
                seen.add(norm)
                result.append(norm)
        return result


class RawDocumentCreate(BaseModel):
    sourceType: SourceType
    text: str = Field(..., min_length=1, max_length=10000)
    rating: Optional[int] = Field(None, ge=1, le=5)
    externalRef: Optional[str] = Field(None, max_length=255)

    @field_validator("text")
    @classmethod
    def validate_text_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Document text cannot be empty or only whitespace")
        if len(v) > 10000:
            raise ValueError("Document text exceeds 10,000 characters limit")
        return v

    @model_validator(mode="after")
    def validate_rating_with_source(self) -> RawDocumentCreate:
        if self.rating is not None and self.sourceType != "survey":
            # Rating is only expected for survey, but can be accepted or flagged
            pass
        return self


class RawDocumentResponse(BaseModel):
    id: str
    sourceType: SourceType
    text: str
    rating: Optional[int] = None
    externalRef: Optional[str] = None
    textHash: str
    status: DocStatus
    errorMessage: Optional[str] = None
    isDuplicate: Optional[bool] = None
    createdAt: str
    updatedAt: str


class RawDocumentListResponse(BaseModel):
    data: List[RawDocumentResponse]
    total: int


class RowError(BaseModel):
    row: int
    error: str


class ImportResponse(BaseModel):
    created: int
    skipped: int
    errors: List[RowError]


class InsightResponse(BaseModel):
    id: str
    documentId: str
    sourceType: SourceType
    sentiment: Sentiment
    themes: List[str]
    painPoints: List[str]
    featureRequests: List[str]
    competitorMentions: List[str]
    competitor: Optional[CompetitorDetails] = None
    summary: str
    model: str
    promptVersion: str
    reviewStatus: ReviewStatus
    createdAt: str
    updatedAt: str


class InsightUpdate(BaseModel):
    sentiment: Optional[Sentiment] = None
    themes: Optional[List[str]] = None
    painPoints: Optional[List[str]] = None
    featureRequests: Optional[List[str]] = None
    competitorMentions: Optional[List[str]] = None
    competitor: Optional[CompetitorDetails] = None
    summary: Optional[str] = None

    @field_validator("themes", mode="after")
    @classmethod
    def normalize_themes_list(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        if v is None:
            return None
        seen = set()
        result = []
        for item in v:
            norm = normalize_theme(item)
            if norm and norm not in seen:
                seen.add(norm)
                result.append(norm)
        return result


class InsightListResponse(BaseModel):
    data: List[InsightResponse]
    total: int


class ThemeExample(BaseModel):
    documentId: str
    quote: str


class ThemeStat(BaseModel):
    theme: str
    count: int
    totalDocs: int
    examples: List[ThemeExample] = Field(default_factory=list)


class ThemeResponse(BaseModel):
    data: List[ThemeStat]
    totalDocs: int


class ReportCreate(BaseModel):
    title: Optional[str] = "Discovery & Research Brief"


class ReportUpdate(BaseModel):
    title: Optional[str] = None
    briefMarkdown: Optional[str] = None
    status: Optional[ReportStatus] = None


class ReportResponse(BaseModel):
    id: str
    title: str
    topThemes: List[ThemeStat]
    briefMarkdown: str
    sourceDocCount: int
    status: ReportStatus
    approvedAt: Optional[str] = None
    model: str
    promptVersion: str
    version: int
    createdAt: str
    updatedAt: str


class ReportListResponse(BaseModel):
    data: List[ReportResponse]
    total: int


class ErrorDetail(BaseModel):
    detail: str
    code: str
