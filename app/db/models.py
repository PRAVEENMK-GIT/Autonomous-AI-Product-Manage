from datetime import datetime, timezone
import mongoengine as me


class RawDocument(me.Document):
    meta = {
        "collection": "raw_documents",
        "indexes": [
            "text_hash",
            "status",
            "source_type",
            "-created_at",
        ],
    }

    source_type = me.StringField(required=True, choices=["feedback", "survey", "competitor"])
    text = me.StringField(required=True, max_length=10000)
    rating = me.IntField(min_value=1, max_value=5, null=True)
    external_ref = me.StringField(null=True, max_length=255)
    text_hash = me.StringField(required=True)
    status = me.StringField(
        required=True,
        choices=["pending", "processing", "processed", "failed"],
        default="pending",
    )
    error_message = me.StringField(null=True)
    created_at = me.DateTimeField(default=lambda: datetime.now(timezone.utc))
    updated_at = me.DateTimeField(default=lambda: datetime.now(timezone.utc))

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "sourceType": self.source_type,
            "text": self.text,
            "rating": self.rating,
            "externalRef": self.external_ref,
            "textHash": self.text_hash,
            "status": self.status,
            "errorMessage": self.error_message,
            "createdAt": self.created_at.isoformat() if self.created_at else datetime.now(timezone.utc).isoformat(),
            "updatedAt": self.updated_at.isoformat() if self.updated_at else datetime.now(timezone.utc).isoformat(),
        }


class Insight(me.Document):
    meta = {
        "collection": "insights",
        "indexes": [
            "document_id",
            "source_type",
            "sentiment",
            "themes",
            "review_status",
            "-created_at",
        ],
    }

    document_id = me.StringField(required=True)
    source_type = me.StringField(required=True, choices=["feedback", "survey", "competitor"])
    sentiment = me.StringField(
        required=True,
        choices=["positive", "negative", "neutral", "mixed"],
    )
    themes = me.ListField(me.StringField(), default=list)
    pain_points = me.ListField(me.StringField(), default=list)
    feature_requests = me.ListField(me.StringField(), default=list)
    competitor_mentions = me.ListField(me.StringField(), default=list)
    competitor = me.DictField(null=True)
    summary = me.StringField(required=True)
    model = me.StringField(default="meta/llama-3.3-70b-instruct")
    prompt_version = me.StringField(default="v1")
    review_status = me.StringField(choices=["ai_draft", "edited"], default="ai_draft")
    created_at = me.DateTimeField(default=lambda: datetime.now(timezone.utc))
    updated_at = me.DateTimeField(default=lambda: datetime.now(timezone.utc))

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "documentId": self.document_id,
            "sourceType": self.source_type,
            "sentiment": self.sentiment,
            "themes": list(self.themes),
            "painPoints": list(self.pain_points),
            "featureRequests": list(self.feature_requests),
            "competitorMentions": list(self.competitor_mentions),
            "competitor": self.competitor,
            "summary": self.summary,
            "model": self.model,
            "promptVersion": self.prompt_version,
            "reviewStatus": self.review_status,
            "createdAt": self.created_at.isoformat() if self.created_at else datetime.now(timezone.utc).isoformat(),
            "updatedAt": self.updated_at.isoformat() if self.updated_at else datetime.now(timezone.utc).isoformat(),
        }


class Report(me.Document):
    meta = {
        "collection": "reports",
        "indexes": [
            "status",
            "-created_at",
        ],
    }

    title = me.StringField(required=True, default="Discovery & Research Brief")
    top_themes = me.ListField(me.DictField(), default=list)
    brief_markdown = me.StringField(required=True)
    source_doc_count = me.IntField(default=0)
    status = me.StringField(choices=["draft", "approved"], default="draft")
    approved_at = me.DateTimeField(null=True)
    model = me.StringField(default="meta/llama-3.3-70b-instruct")
    prompt_version = me.StringField(default="report_v1")
    version = me.IntField(default=1)
    created_at = me.DateTimeField(default=lambda: datetime.now(timezone.utc))
    updated_at = me.DateTimeField(default=lambda: datetime.now(timezone.utc))

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "title": self.title,
            "topThemes": list(self.top_themes),
            "briefMarkdown": self.brief_markdown,
            "sourceDocCount": self.source_doc_count,
            "status": self.status,
            "approvedAt": self.approved_at.isoformat() if self.approved_at else None,
            "model": self.model,
            "promptVersion": self.prompt_version,
            "version": self.version,
            "createdAt": self.created_at.isoformat() if self.created_at else datetime.now(timezone.utc).isoformat(),
            "updatedAt": self.updated_at.isoformat() if self.updated_at else datetime.now(timezone.utc).isoformat(),
        }
