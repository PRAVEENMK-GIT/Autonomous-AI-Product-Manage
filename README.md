# Autonomous AI Product Manager (`pm-automation`)
> **Objective 1 MVP — Discovery & Research Intelligence Engine**

Autonomous AI Product Manager turns unstructured, messy customer feedback, survey responses, and competitor intelligence into structured insights, code-computed theme rankings with verbatim evidence quotes, and an executive one-page research brief.

---

## 🎯 Key Capabilities

1. **Multi-Source Ingestion**:
   - Single item ingestion (< 300 ms response, zero blocking on LLM).
   - CSV, JSON array, and TXT batch imports with instant preview.
   - SHA-256 content deduplication with duplicate flagging.
2. **AI Extraction & Theme Engine**:
   - NVIDIA LLaMA 3 integration (`meta/llama-3.3-70b-instruct`) with exponential backoff on 429/503.
   - Structured JSON output with automatic repair retry.
   - Deterministic keyword-based stub analyzer for offline testing and rapid development.
   - **Code-computed theme statistics**: frequencies are strictly counted in code, never hallucinated by LLM.
   - **Verbatim evidence quotes**: cryptographically verified substrings of source input documents.
3. **Human-in-the-Loop Review**:
   - Filter insights by theme, sentiment, and source type.
   - Edit any extracted field (sets status to `Human Edited`).
   - One-page executive research brief editor (≤ 400 words) with live split preview.
   - Formal sign-off and approval tracking (`draft` vs `approved` with timestamp).
   - Markdown download export with automated `DRAFT: not approved` headers.
4. **Evaluation Engine**:
   - `python -m genai.eval` benchmark against 15 hand-labelled ground truth items.
   - Reports Precision, Recall, F1, and pain point capture rates.

---

## 🏗️ Architecture & Project Structure

```
pm-automation/
├── app/
│   ├── api/             # REST endpoints (health, documents, insights, themes, reports)
│   ├── db/              # MongoEngine models & connection manager (Atlas + in-memory mock)
│   ├── models/          # Pydantic data contract schemas (schemas.py)
│   ├── services/        # Business logic (analysis, import, theme engine, report service)
│   └── main.py          # FastAPI application entrypoint
├── genai/
│   ├── prompts/         # Versioned prompt templates (feedback, survey, competitor, report)
│   ├── analyzer.py      # Main extraction interface
│   ├── chains.py        # LangChain structured output & repair retry logic
│   ├── eval.py          # 15-item ground truth benchmark runner
│   ├── llm.py           # NVIDIA API Catalog client & retry policies
│   ├── report.py        # One-page executive brief generator
│   └── stub_analyzer.py # Offline deterministic analyzer
├── frontend/
│   ├── src/
│   │   ├── api/         # Typed API client
│   │   ├── components/  # Navbar, StatusChip, SentimentBadge, InsightEditModal
│   │   ├── pages/       # UploadTab, DocumentsTab, InsightsTab, ThemesTab, ReportsTab
│   │   ├── types.ts     # Frontend TypeScript models
│   │   └── App.tsx      # Main application with TanStack React Query
│   ├── package.json
│   └── vite.config.ts
├── data/
│   ├── sample/          # Sample feedback.csv, surveys.csv, competitors.json, labels.json
│   └── eval_results.json
├── tests/               # 34 Unit & Integration tests (85% coverage)
├── .env.example
├── requirements.txt
└── pytest.ini
```

---

## 🚀 Quickstart Guide

### 1. Backend Setup

```bash
# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env to add your NVIDIA_API_KEY (optional; system automatically uses stub mode if omitted)

# Start FastAPI server
uvicorn app.main:app --reload --port 8000
```
FastAPI interactive docs will be available at: `http://localhost:8000/docs`

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🧪 Testing & Evaluation

### Run Test Suite (34 tests, 85% coverage)
```bash
pytest tests/ -v --cov=app --cov=genai
```

### Run GenAI Evaluation Benchmark (15 hand-labelled items)
```bash
# Run against offline deterministic analyzer
python -m genai.eval --stub

# Run against live NVIDIA LLaMA 3 model (requires NVIDIA_API_KEY)
python -m genai.eval
```

---

## 🔒 Security & Privacy

- Zero hardcoded secrets in codebase or git history.
- Input validation: document text capped at 10,000 characters.
- Prompt injection protection: inputs wrapped in delimiters and tagged as `DATA ONLY`.
- MongoDB Atlas connection falls back to safe in-memory mock when unconfigured.
