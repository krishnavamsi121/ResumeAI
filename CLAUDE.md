# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# ResumeAI

AI-powered resume tailoring using the Claude API. Python FastAPI backend + vanilla JS frontend (no build step).

## Project structure

```
ResumeAI/
├── backend/                 # Python FastAPI
│   ├── main.py              # App entry, serves frontend at /
│   ├── config.py            # Env-based config
│   ├── api/routes.py        # POST /api/tailor, POST /api/parse-resume, GET /api/health
│   └── services/
│       ├── claude.py        # Anthropic API client
│       ├── prompts.py       # System + user message templates
│       └── parse_resume.py  # PDF (pypdf), DOCX (python-docx), TXT
├── frontend/
│   ├── index.html
│   ├── css/                 # base, layout, components, steps
│   └── js/                  # utils, api, file, review, export, app
├── requirements.txt
├── .env.example
├── run.sh                   # uvicorn backend.main:app
└── resume-editor.html       # Legacy single-file app (optional)
```

## Running

```bash
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # add your ANTHROPIC_API_KEY
uvicorn backend.main:app --reload --host 0.0.0.0 --port 5001
# or: bash run.sh
```

Open http://localhost:5001. The API key can also be set via the in-app modal (stored in `localStorage`).

## Configuration

All config is in `backend/config.py` via env vars. Key variables (with defaults):

| Var | Default | Purpose |
|-----|---------|---------|
| `ANTHROPIC_API_KEY` | — | Required. Can be overridden per-request via `api_key` field. |
| `RESUMEAI_DEFAULT_MODEL` | `claude-sonnet-4-20250514` | Claude model used when caller doesn't specify one. |
| `RESUMEAI_MAX_RESUME_CHARS` | `12000` | Chars sent to API before truncation. |
| `RESUMEAI_MAX_JD_CHARS` | `5000` | Same for job description. |
| `RESUMEAI_MAX_OUTPUT_TOKENS` | `8000` | Max tokens in Claude response. |
| `RESUMEAI_PORT` | `5001` | Server port. |

## Architecture

### Backend (`backend/`)

- `main.py` — FastAPI app; mounts `frontend/` as static at `/` via `StaticFiles`.
- `config.py` — reads env vars; exposes `FRONTEND_DIR`, `DEFAULT_MODEL`, etc.
- `api/routes.py` — three routes:
  - `POST /api/tailor` — accepts `TailorRequest` (resume_text, jd_text, optional api_key/model/feedback/current_resume), calls `tailor_resume()`, returns `TailorResponse` (matchScore, scoreCaption, matchedSkills, addedSkills, changesSummary, sections, fullResume).
  - `POST /api/parse-resume` — file upload (PDF/DOCX/TXT), returns `{ text, lines }`.
  - `GET /api/health`
- `services/claude.py` — creates/caches `anthropic.Anthropic` clients per API key; calls `messages.create` with **prompt caching** on the system prompt (`cache_control: ephemeral`). Parses JSON from response (strips markdown fences if present).
- `services/prompts.py` — `SYSTEM_PROMPT` (ATS tailoring rules including cloud-tech translation table) and `build_user_message()`. Two modes: initial tailor (`ORIGINAL RESUME + JD`) and re-tailor with feedback (`CURRENT TAILORED RESUME + JD + USER FEEDBACK`).
- `services/parse_resume.py` — dispatch by file extension to pypdf / python-docx / plain text.

### Frontend (`frontend/`)

All JS files are IIFEs that attach to a single `window.ResumeAI` global namespace. **Script load order matters** (set in `index.html`): `utils` → `api` → `file` → `review` → `export` → `app`.

- `app.js` — orchestration entry point; holds state in `ResumeAI.app.S` (`apiKey`, `rawResume`, `jdText`, `result`, `finalResume`, `remodHistory`, etc.); drives the 4-step wizard (`goToStep`).
- `api.js` — `tailorResume(payload)` → `POST /api/tailor`; `parseResume(file)` → `POST /api/parse-resume`.
- `file.js` — drag-and-drop, file input, calls `/api/parse-resume` for PDF/DOCX.
- `review.js` — renders Claude response into the review panel (tabs: formatted / raw / diff / score).
- `export.js` — PDF export via jsPDF (loaded from CDN); DOCX via dynamic `import()` from Skypack.
- CSS custom properties defined in `css/base.css`; step-specific styles in `css/steps.css`.

### Data flow

1. User uploads/pastes resume → `file.js` calls `/api/parse-resume` → text fills textarea.
2. User pastes JD, clicks Tailor → `app.js:startProcessing()` → `POST /api/tailor` (initial).
3. Claude returns JSON → `review.js:renderReview()` shows result in step 3.
4. User can submit feedback → `POST /api/tailor` again with `feedback` + `current_resume` fields.
5. Export step: PDF/DOCX generated client-side from `S.finalResume`.

## There are no automated tests in this repo.
