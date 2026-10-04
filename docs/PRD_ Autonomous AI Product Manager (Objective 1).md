# PRD: Autonomous AI Product Manager — MVP = Objective 1 (Discovery & Research)

## 1. Overview

**Project name:** Autonomous AI Product Manager (`pm-automation`)

**Problem Statement:** Before anything is built, a Product Manager must read piles of messy input (feedback, surveys, support chats, competitor notes) and turn it into a clear plan. Done by hand this is slow, inconsistent between PMs, often incomplete, and the results get scattered across chat, docs and sheets. The first step of that chain, Discovery & Research, is where the most time is lost and where every later document (PRD, SOW, roadmap, JIRA items) gets its facts.

**Proposed Solution:** A web app and API that ingest raw text, use an LLM to extract structured insights (sentiment, themes, pain points, feature requests, competitor mentions), and generate a one-page research brief that a human reviews and approves. The data contract is built so Objectives 2 to 9 (PRD, SOW, prioritization, allocation, roadmap, JIRA, review, memory) plug in later.

**AI Build Summary:**

> Build a FastAPI + MongoDB Atlas (MongoEngine) backend with a LangChain + Pydantic GenAI module, plus a small React web UI. Users upload feedback, survey or competitor text (single, CSV or JSON). Each document is analyzed by an LLM from NVIDIA build.nvidia.com (OpenAI-compatible endpoint `https://integrate.api.nvidia.com/v1`, key in `NVIDIA_API_KEY`) into a fixed `InsightResult` schema, stored in `insights`. Theme counts are computed in code, never by the LLM. A report generator takes counts and verbatim quotes and produces a one-page markdown brief. Uploads never wait on the AI. Humans can edit insights and must approve a report before it is "final". No real customer data, no multi-user editing, no JIRA in this MVP. Never commit `.env` or API keys.

---

## 2. Goals & Success Metrics

**Primary Goal:** Turn a batch of messy input into a trustworthy, reviewable research summary in minutes, with no major point missed.

**Success Metrics** (targets are proposals, to be confirmed in Open Questions)

- **Speed:** 50 sample documents go from upload to a generated report in ≤ 5 minutes.
- **Quality:** against 15 hand-labelled items, ≥ 85% of labelled themes and pain points are captured, and 0 "major" points (as labelled by the team) are missed in the report.
- **Trust:** 100% of numbers in a report match database counts, and 100% of quoted examples appear verbatim in a source document.

**Anti-goals**

- Not replacing the PM's judgement: a human always approves.
- Not analyzing real or live customer data (sample data only; free LLM tiers may log inputs).
- Not generating PRDs, SOWs, roadmaps or JIRA items in this MVP.
- Not building multi-user or real-time collaboration.

---

## 3. Scope & Constraints

**In scope (MVP, Objective 1)**

- Ingest: single text, CSV, JSON, or `.txt` files; three source types: `feedback`, `survey`, `competitor`.
- One prompt per source type, structured output, stored in MongoDB.
- Insight browsing with filters; human edit of any insight.
- Theme counts, top-theme report with example quotes, one-page LLM brief, markdown export.
- Human approval status on reports (a first slice of Objective 8).
- Stub analyzer so the Backend pair is never blocked by the GenAI pair.
- Evaluation script against 15 hand-labelled items.

**Out of scope**

- Objectives 2 to 7 and 9 (PRD, SOW, prioritization, allocation, roadmap, JIRA, searchable memory), built in later phases.
- Real company data systems; legal, financial or compliance approvals.
- User accounts and roles; concurrent editing.
- Vector search or embeddings.

**Technical constraints**

- Platform: responsive web app (desktop first), API on FastAPI.
- Auth: none for MVP (single user, local or team-shared deployment). Optional static `X-API-Key` header if deployed publicly.
- Accessibility: WCAG 2.1 AA for the web UI.
- Offline: not needed.
- Performance: `POST /documents` \< 300 ms; analysis of one document \< 20 s p95; report generation \< 60 s.
- LLM: NVIDIA-hosted models. Shared hosted endpoints can return HTTP 429/503 under load, so retries with backoff are mandatory. Free-tier limits are shown on the build.nvidia.com account dashboard and can change.
- Data: Atlas free cluster (512 MB). Max document text 10,000 characters (reject or truncate with a flag).
- Secrets: only in `.env`; `.env.example` committed.

---

## 4. Jobs to Be Done

| Priority | Job Statement |
| --- | --- |
| J1 | When I have a pile of raw customer feedback, surveys and competitor notes, I want to turn them into clear structured findings, so I can see the real problems without reading everything by hand. |
| J2 | When stakeholders ask what users want most, I want ranked themes with counts and real quotes, so I can back every statement with evidence. |
| J3 | When the AI produces a summary, I want to check, correct and approve it, so I only pass on findings I trust. |
| J4 | When the next stage (PRD) starts, I want research output in a stable, predictable shape, so downstream tools can use it without rework. |

---

## 5. User Stories

| ID | Role | Action | Benefit | JTBD |
| --- | --- | --- | --- | --- |
| US1 | PM | upload a single piece of feedback, survey answer or competitor note | it is saved instantly and queued for analysis | J1 |
| US2 | PM | import a CSV or JSON file of many items | I don't paste items one by one | J1 |
| US3 | PM | run analysis on one document or all pending ones and see status | I know what is done, running or failed | J1 |
| US4 | PM | browse and filter insights by theme, sentiment and source | I can explore findings quickly | J2 |
| US5 | PM | edit an insight's themes, sentiment or items | wrong AI output is fixed before it counts | J3 |
| US6 | PM | see theme counts and example quotes | I can rank problems by evidence | J2 |
| US7 | PM | generate a one-page research brief, edit it and approve it | I have a reviewed deliverable | J3 |
| US8 | PM | export the approved brief as markdown | I can share it or feed the next stage | J4 |
| US9 | Developer | run an eval against 15 hand-labelled items | I can measure and improve prompts | J1 |

---

## 6. Proposed Experience

**Design Direction:** A simple 3-step pipeline the user can see: **Upload → Analyze → Review**. Mental model: an inbox of raw items on the left that become structured cards on the right. The AI is a draft-maker; every output is visibly "AI draft" until a human approves it. Clean, text-first, dense but scannable.

**Key Screens / States**

- **Upload:** paste text or drop CSV/JSON/TXT; pick source type; preview rows before import.
- **Documents:** table with status chips (pending / processing / processed / failed), "Analyze" and "Analyze all pending".
- **Insights Explorer:** filter bar (theme, sentiment, source) + insight cards; click to edit.
- **Themes:** ranked bar list (theme, count, share of total) with expandable example quotes.
- **Report:** generated brief in an editable markdown editor, status badge (Draft / Approved), Regenerate, Approve, Export.
- **Empty state:** "No documents yet. Upload sample data to start" with a "Load sample data" button.
- **Error state:** per-document failure reason + Retry; global banner for API/LLM outages.
- **Loading state:** skeleton rows; per-document progress chip; "12 of 50 analyzed" counter.

**Interaction Model**

1. Upload data → documents appear as `pending`.
2. Click Analyze (one or all) → status moves to `processing`, then `processed` or `failed` (UI polls every 3 s).
3. Open Insights / Themes to explore; edit anything wrong.
4. Click Generate report → review, edit, Approve → Export.

- Editing an insight marks it `edited` and the theme counts update. Regenerating a report keeps the old version as history.

**Accessibility Notes**

- Full keyboard navigation; visible focus rings; status chips use text plus icon, not color alone.
- Contrast ≥ 4.5:1; live region announces analysis progress; tables have proper headers.

**Figma / Design Link:** \[placeholder: add link when available\]

---

## 7. Component Inventory

| Component | Type | Description | Stories |
| --- | --- | --- | --- |
| AppShell / NavTabs | Navigation | Tabs: Upload, Documents, Insights, Themes, Report | all |
| SourceTypeSelect | Form | feedback / survey / competitor | US1, US2 |
| TextUploadForm | Form | Textarea + optional rating (survey) + submit | US1 |
| FileDropzone | Form | CSV/JSON/TXT drop + column mapping | US2 |
| ImportPreviewTable | Display | First 10 parsed rows and validation errors | US2 |
| DocumentTable | Display | Paginated list with status, source, created date | US3 |
| StatusChip | Display | pending / processing / processed / failed with icon | US3 |
| AnalyzeButton / AnalyzeAllButton | Action | Trigger analysis; disabled while running | US3 |
| ProgressBanner | Display | "12 of 50 analyzed", failures count | US3 |
| FilterBar | Form | Theme, sentiment, source filters; URL-synced | US4 |
| InsightCard | Display | Sentiment, themes, pain points, requests, competitors, summary | US4 |
| InsightEditModal | Modal | Edit fields; save marks `edited` | US5 |
| ThemeRankList | Display | Ranked themes with count and share | US6 |
| QuoteList | Display | Verbatim quotes with link to source doc | US6 |
| ReportEditor | Form | Markdown editor + preview | US7 |
| ApprovalBar | Action | Generate, Regenerate, Approve, Export | US7, US8 |
| ConfirmDialog | Modal | Confirm approve / regenerate-overwrite | US7 |
| EmptyState, ErrorBanner, Toast | Display | Shared feedback patterns | all |

---

## 8. Data Models

```typescript
type SourceType = "feedback" | "survey" | "competitor";
type DocStatus = "pending" | "processing" | "processed" | "failed";

interface RawDocument {            // collection: raw_documents
  id: string;                      // ObjectId as string (never expose raw _id)
  sourceType: SourceType;
  text: string;                    // max 10,000 chars
  rating?: number | null;          // survey only, 1-5
  externalRef?: string | null;     // original row id / filename
  textHash: string;                // sha256 of normalized text, used to flag duplicates
  status: DocStatus;
  errorMessage?: string | null;
  createdAt: string;               // ISO8601
  updatedAt: string;
}

interface Insight {                // collection: insights (one per processed document)
  id: string;
  documentId: string;              // FK -> RawDocument.id
  sourceType: SourceType;
  sentiment: "positive" | "negative" | "neutral" | "mixed";
  themes: string[];                // normalized: lowercase, trimmed, reused from vocabulary
  painPoints: string[];
  featureRequests: string[];
  competitorMentions: string[];
  competitor?: {                   // competitor source only
    features: string[]; pricing: string[];
    strengths: string[]; weaknesses: string[]; moves: string[];
  } | null;
  summary: string;                 // 1-2 sentences
  model: string;                   // e.g. "meta/llama-3.3-70b-instruct"
  promptVersion: string;           // e.g. "feedback_v3"
  reviewStatus: "ai_draft" | "edited";
  createdAt: string;
  updatedAt: string;
}

interface ThemeStat {              // computed in code, not stored long-term
  theme: string;
  count: number;
  totalDocs: number;
  examples: { documentId: string; quote: string }[];   // quote must be a substring of source text
}

interface Report {                 // collection: reports
  id: string;
  title: string;
  topThemes: ThemeStat[];
  briefMarkdown: string;           // one page
  sourceDocCount: number;
  status: "draft" | "approved";
  approvedAt?: string | null;
  model: string;
  promptVersion: string;
  version: number;                 // increments on regenerate
  createdAt: string;
  updatedAt: string;
}
```

> `app/models/schemas.py` (Pydantic) mirrors these exactly and is the contract between the two pairs. Change it only after telling the other pair.

---

## 9. API / Integration Surface

| Method | Path | Description | Auth | Response |
| --- | --- | --- | --- | --- |
| GET | /health | Liveness + Mongo ping | No | `{ status: "ok", mongo: boolean }` |
| POST | /documents | Add one document (`{sourceType, text, rating?}`) | Opt. key | `201 { id, status: "pending" }` |
| POST | /documents/import | Upload CSV/JSON/TXT; returns per-row result | Opt. key | `201 { created: number, skipped: number, errors: RowError[] }` |
| GET | /documents | List; filters `status`, `sourceType`, `page`, `pageSize` | Opt. key | `{ data: RawDocument[], total }` |
| GET | /documents/{id} | Single document | Opt. key | `RawDocument` (404 if missing) |
| POST | /documents/{id}/analyze | Analyze one document (sets status) | Opt. key | `200 { id, status: "processed" }`; `502` on LLM failure |
| POST | /documents/analyze-pending | Background-analyze all pending | Opt. key | `202 { queued: number }` |
| GET | /insights | Filters `theme`, `sentiment`, `sourceType`, `page` | Opt. key | `{ data: Insight[], total }` |
| GET | /insights/{id} | Single insight | Opt. key | `Insight` |
| PATCH | /insights/{id} | Human edit; sets `reviewStatus: "edited"` | Opt. key | `Insight` |
| GET | /themes | Theme counts, `limit`, `examples=2` | Opt. key | `{ data: ThemeStat[], totalDocs }` |
| POST | /reports/generate | Build report from current insights | Opt. key | `201 Report` (status `draft`) |
| GET | /reports | List reports | Opt. key | `{ data: Report[], total }` |
| GET | /reports/{id} | Single report | Opt. key | `Report` |
| PATCH | /reports/{id} | Edit `briefMarkdown`, or set `status: "approved"` | Opt. key | `Report` |
| GET | /reports/{id}/export?format=md | Download markdown | Opt. key | `text/markdown` |

Errors always use `{ detail: string, code: string }`. Validation errors return 422, missing ids 404.

**External integrations**

- **NVIDIA API Catalog (build.nvidia.com):** OpenAI-compatible chat completions at `https://integrate.api.nvidia.com/v1`. Key (`nvapi-...`) is generated from the build.nvidia.com account and stored as `NVIDIA_API_KEY`. Used via `langchain-openai` `ChatOpenAI(base_url=...)` (or `langchain-nvidia-ai-endpoints`). Default model `meta/llama-3.3-70b-instruct`, configurable via `NVIDIA_MODEL`. Model availability and structured-output support vary by model and change over time, so each candidate is validated with the eval script before use.
- **MongoDB Atlas (free tier):** via MongoEngine; connection string in `MONGO_URL`.

**LLM client (single place to swap models)**

```python
# genai/llm.py
import os
from langchain_openai import ChatOpenAI

def get_llm():
    return ChatOpenAI(
        model=os.getenv("NVIDIA_MODEL", "meta/llama-3.3-70b-instruct"),
        base_url=os.getenv("NVIDIA_BASE_URL", "https://integrate.api.nvidia.com/v1"),
        api_key=os.environ["NVIDIA_API_KEY"],
        temperature=0,
        timeout=60,
    )
```

Fallback if `with_structured_output` is unreliable on a model: request JSON, parse with Pydantic, one repair retry, then mark the document `failed`.

---

## 10. State Management Map

| State | Location | Persistence | Notes |
| --- | --- | --- | --- |
| documents, insights, reports | Server (MongoDB) | Persistent | Single source of truth |
| analysis job progress | Server (`status` field on documents) | Persistent | UI polls; no websockets in MVP |
| list filters + pagination | URL query params | None | Shareable, back-button safe |
| server data cache | React Query | Session | Auto-refetch on mutation |
| import preview + column mapping | Local UI | None | Discarded on navigation |
| report editor draft | Local UI | Session | Saved on explicit Save; warn on leave |
| theme vocabulary | Server (derived from insights) | Derived | Passed to the prompt so themes get reused |
| LLM key, Mongo URL, model name | Server env (`.env`) | Persistent | Never sent to the browser |

---

## 11. Tech Stack Recommendation

Kept the same as the project slides; only the LLM provider is NVIDIA and the front end is a recommendation (not specified in the docs).

| Layer | Choice | Rationale |
| --- | --- | --- |
| Frontend | React + Vite + TypeScript | Small, fast; the plan only asks for a simple web page |
| Styling | Tailwind CSS | Quick, consistent, accessible defaults |
| Backend | FastAPI + Pydantic | Per slides; auto `/docs` for testing every endpoint |
| Database | MongoDB Atlas free + MongoEngine | Per slides; flexible documents for insight shapes |
| Auth | None (optional static API key) | Single user; avoids scope creep |
| LLM | NVIDIA build.nvidia.com via OpenAI-compatible API | Chosen provider; free dev credits; swap models by env var |
| GenAI | LangChain (`langchain-core`, `langchain-openai`) | Per slides; prompt → llm → schema chain |
| Hosting | Local / Render / Railway (backend), Vercel / Netlify (UI) | Free tiers sufficient for demo data |
| Key libraries | `python-dotenv`, `tenacity` (retry on 429/503), `pytest`, `pandas` (CSV import), `@tanstack/react-query` | Env config, resilience, tests, parsing, data fetching |

---

## 12. Suggested File Structure

```
pm-automation/
├─ app/                         # Backend pair
│  ├─ main.py
│  ├─ api/  documents.py  insights.py  themes.py  reports.py  health.py
│  ├─ db/   mongo.py  models.py            # MongoEngine documents
│  ├─ models/schemas.py                    # shared contract (Pydantic)
│  └─ services/  analysis_service.py  import_service.py  theme_service.py
├─ genai/                       # R&D pair
│  ├─ llm.py                               # get_llm() -> NVIDIA endpoint
│  ├─ prompts/  feedback_v1.txt  survey_v1.txt  competitor_v1.txt  report_v1.txt
│  ├─ chains.py  analyzer.py  report.py  stub_analyzer.py
│  └─ eval.py                              # compare vs hand labels
├─ frontend/
│  └─ src/  pages/  components/  api/client.ts  types.ts
├─ data/sample/  feedback.csv  surveys.csv  competitors.json  labels.json
├─ notebooks/
├─ tests/
├─ docs/handover.md
├─ README.md  .env.example  requirements.txt
```

`.env.example`: `MONGO_URL=`, `NVIDIA_API_KEY=`, `NVIDIA_MODEL=meta/llama-3.3-70b-instruct`, `NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1`, `API_KEY=` (optional).

---

## 13. Acceptance Criteria

**US1: Upload one document**

- [ ] `POST /documents` with valid body returns 201 and `status: "pending"` within 300 ms, without calling the LLM.
- [ ] Missing `text` or invalid `sourceType` returns 422.
- [ ] Text over 10,000 characters is rejected with a clear message.
- [ ] Duplicate `textHash` is flagged (still created, with a warning in the response).
- [ ] Returned `id` is a plain string, never a raw Mongo `_id` object.

**US2: Import file**

- [ ] CSV with a `text` column imports every valid row; the response lists `created`, `skipped`, and per-row `errors`.
- [ ] JSON array of objects imports with the same rules.
- [ ] Empty file or wrong format returns 400 with a message; no partial silent failure.
- [ ] Import preview shows the first 10 rows before confirming.

**US3: Analyze and track status**

- [ ] Analyzing a document sets `processing`, then `processed` with one stored Insight, or `failed` with `errorMessage`.
- [ ] Unknown id returns 404.
- [ ] On HTTP 429/503 from the LLM, the call retries with exponential backoff up to 3 times before marking `failed`.
- [ ] Re-analyzing a processed document replaces its Insight (no duplicates).
- [ ] `analyze-pending` returns 202 immediately; max 3 concurrent LLM calls.
- [ ] Output that fails schema validation gets one repair retry, then `failed`.
- [ ] Empty state: if the text has no extractable items, lists are empty (not invented).

**US4: Browse insights**

- [ ] `GET /insights?theme=search speed` returns only insights containing that theme.
- [ ] Filters combine (AND) and survive page refresh via URL params.
- [ ] No results shows an empty state with a "Clear filters" action.

**US5: Edit insight**

- [ ] `PATCH /insights/{id}` updates fields, sets `reviewStatus: "edited"`, and updates `updatedAt`.
- [ ] Invalid `sentiment` value returns 422.
- [ ] Theme counts reflect the edit on the next `GET /themes`.

**US6: Theme counts and quotes**

- [ ] Counts equal the number of insights containing the theme (verified by a test against fixtures).
- [ ] Each example quote is a substring of the linked source document.
- [ ] Themes are normalized (lowercase, trimmed) so "Search Speed" and "search speed" count together.

**US7: Generate, edit, approve report**

- [ ] `POST /reports/generate` returns a `draft` report; all numbers in `briefMarkdown` match `topThemes` counts.
- [ ] The brief fits one page (≤ 400 words) and contains top pain point, top requests, and competitor notes when present.
- [ ] Generating with zero processed insights returns 409 with a helpful message.
- [ ] `PATCH status: "approved"` requires a confirm dialog in the UI and sets `approvedAt`.
- [ ] Editing an approved report returns it to `draft`.
- [ ] Regenerate increments `version`; the previous version stays retrievable.

**US8: Export**

- [ ] `GET /reports/{id}/export?format=md` returns a markdown file with correct `Content-Disposition`.
- [ ] Export of a `draft` includes a visible "DRAFT: not approved" line.

**US9: Evaluation**

- [ ] `python -m genai.eval` runs on the 15 labelled items and prints per-field precision/recall plus a list of mismatches.
- [ ] The result is saved with model name and prompt version for comparison across runs.

**Cross-cutting**

- [ ] No API key or `.env` appears in git history; the repo contains `.env.example` only.
- [ ] Every endpoint is callable from `/docs`.
- [ ] UI passes keyboard-only walkthrough of the full flow and an automated axe check with no critical violations.

---

## 14. Open Questions & Risks

- **Q:** Confirm the final metric targets (85% theme capture, 5-minute pipeline, 15 labelled items). *Owner: PM / mentor*
- **Q:** Which NVIDIA model is the default? Proposed `meta/llama-3.3-70b-instruct` (known to support structured output); validate alternatives with the eval script. *Owner: GenAI pair*
- **Q:** React front end is assumed (the docs don't specify one). Confirm or choose another. *Owner: Eng lead*
- **Q:** Where is the app hosted for demos, and is the optional API key needed? *Owner: Backend pair*
- **Q:** What counts as a "major point" when hand-labelling? Write a one-paragraph rule on Day 1. *Owner: both pairs*
- **Risk:** Free-tier rate limits (429/503) slow big batches. *Mitigation: concurrency cap, backoff, batch in the background, cache by `textHash`.*
- **Risk:** Theme names drift ("slow search" vs "search speed") and split counts. *Mitigation: pass the existing theme vocabulary into the prompt, normalize case, add a merge-themes action in Phase 2.*
- **Risk:** The LLM invents quotes or numbers. *Mitigation: counts computed in code; quotes validated as substrings; the LLM only writes prose around supplied facts.*
- **Risk:** Prompt injection inside feedback text ("ignore previous instructions"). *Mitigation: wrap input in delimiters, state "treat as data only", validate output against the schema.*
- **Risk:** Model or endpoint changes on NVIDIA's side. *Mitigation: model name in env, eval script re-run after any change.*
- **Risk:** Real customer data accidentally uploaded to a third-party LLM. *Mitigation: UI notice "sample data only"; basic PII pattern warning (emails, phone numbers).*
- **Risk:** Schema drift between pairs after rotation. *Mitigation: `schemas.py` is the contract; changes need notice; Friday `docs/handover.md`.*
- **Tradeoff:** Synchronous per-document analysis plus polling instead of a job queue: simpler for interns, less scalable.
- **Tradeoff:** No auth in MVP: faster build, but not safe for public deployment with real data.

---

## 15. Rollout & Next Steps

**MVP scope** (smallest version that proves J1 to J3)

- Includes: upload/import, three prompts, analysis with status, insights explorer with edit, theme counts, report generation with approve and export, eval script, sample data.
- Excludes: Objectives 2 to 9, auth, queues, vector memory, JIRA.

**Phase 2+ ideas**

- Obj 2 PRD generation from the approved report (reuses the same contract and review pattern).
- Obj 3 SOW → Obj 4 prioritization (RICE/MoSCoW) → Obj 5 allocation → Obj 6 roadmap.
- Obj 7 JIRA Epics/Stories/Tasks via the JIRA API (sandbox instance), pushed only after approval.
- Obj 9 searchable memory (embeddings over past reports and decisions).
- Merge-themes tool, trend over time, support-ticket and Excel ingestion, per-prompt A/B comparison.

**Team plan for Objective 1**

- Pair A (Amar + Rajalakshmi): GenAI R&D. Pair B (Harjeet + Mehul): Backend. Pairs swap at the start of Objective 2.
- Day 1: agree `schemas.py`, theme normalization rule, and labelling rules.

**Sign-off needed from**

- [ ] PM / mentor
- [ ] Engineering lead
- [ ] Design (UI direction)
- [ ] Both pairs (data contract)

**Next steps**

1. Create repo, `.env.example`, Atlas cluster and shared DB user per pair. *Owner: Backend pair, Day 1*
2. Generate NVIDIA API key on build.nvidia.com; store in `.env`, never in code or chat. *Owner: GenAI pair, Day 1*
3. Freeze `schemas.py` v1 and build `stub_analyzer.py`. *Owner: both pairs, Day 1*
4. Collect sample data and hand-label 15 items. *Owner: GenAI pair, Day 2*
5. Build upload + analyze endpoints against the stub; then swap in the real analyzer. *Owner: Backend pair, Days 2 to 3*
6. Prompt iteration with the eval script (test on 5 items before all 50). *Owner: GenAI pair, Days 3 to 4*
7. UI screens, report flow, handover note. *Owner: both pairs, by Friday*