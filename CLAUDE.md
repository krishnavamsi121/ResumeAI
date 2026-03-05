# ResumeAI

AI-powered resume tailoring using the Claude API. The project is structured as a **Python backend** (FastAPI) and a **vanilla JS frontend** (no build step).

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

From repo root:

```bash
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
export ANTHROPIC_API_KEY=sk-ant-...
uvicorn backend.main:app --reload --host 0.0.0.0 --port 5001
```

Then open http://localhost:5000 . The API key can be set in `.env` or in the app UI (stored in browser localStorage).

## Architecture

- **Backend:** FastAPI. `/api/tailor` accepts `resume_text`, `jd_text`, optional `api_key`, `model`, `feedback`, `current_resume`; calls Claude; returns JSON (matchScore, fullResume, sections, etc.). `/api/parse-resume` accepts a file upload and returns `{ text, lines }`.
- **Frontend:** Vanilla JS modules (utils, api, file, review, export, app). State lives in `ResumeAI.app.S`. PDF/DOCX parsing is done server-side; export (PDF, DOCX) uses client-side jsPDF and dynamic import of docx (Skypack).
- **Design:** CSS custom properties in `frontend/css/base.css`; layout and steps in separate files.

## Development

- No frontend build. Edit `frontend/*` and refresh.
- Backend: use `--reload` for auto-restart.
- API key: set `ANTHROPIC_API_KEY` in env or via the app modal.
