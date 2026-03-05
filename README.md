# ResumeAI

AI-powered resume tailoring using the Claude API. Upload a resume and a job description; the app tailors the resume and lets you review, refine, and export (TXT, HTML, PDF, DOCX).

## Project structure

```
ResumeAI/
├── backend/                 # Python FastAPI application
│   ├── main.py              # App entry, static file serving
│   ├── config.py            # Settings from environment
│   ├── api/
│   │   └── routes.py        # /api/tailor, /api/parse-resume, /api/health
│   └── services/
│       ├── claude.py        # Claude API client
│       ├── prompts.py       # System and user prompt templates
│       └── parse_resume.py  # PDF, DOCX, TXT parsing
├── frontend/
│   ├── index.html           # Single-page app
│   ├── css/                 # Base, layout, components, steps
│   └── js/                  # utils, api, file, review, export, app
├── requirements.txt
├── .env.example
└── README.md
```

## Setup

1. **Clone or create project directory**

2. **Create a virtual environment and install dependencies**

   ```bash
   python3 -m venv venv
   source venv/bin/activate   # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Configure environment**

   ```bash
   cp .env.example .env
   # Edit .env and set ANTHROPIC_API_KEY=sk-ant-...
   ```

4. **Run the server**

   ```bash
   uvicorn backend.main:app --reload --host 0.0.0.0 --port 5000
   ```

   Or use the run script:

   ```bash
   chmod +x run.sh && ./run.sh
   ```

5. **Open in browser**

   http://localhost:5000

## Usage

- **Step 1:** Upload a resume (PDF, DOCX, or TXT) or paste text; paste the job description. You can store a Claude API key in the app (browser) or rely on the server’s `ANTHROPIC_API_KEY`.
- **Step 2:** The app calls the Claude API to tailor the resume.
- **Step 3:** Review the result, edit raw text, or request changes (re-tailor with feedback).
- **Step 4:** Export as plain text, HTML, PDF, Word (.docx), or copy to clipboard.

## Configuration

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Required for tailoring (or set in the app UI). |
| `RESUMEAI_DEFAULT_MODEL` | Default model, e.g. `claude-sonnet-4-20250514`. |
| `RESUMEAI_MAX_RESUME_CHARS` | Max resume characters sent to the API (default 12000). |
| `RESUMEAI_MAX_JD_CHARS` | Max job description characters (default 5000). |
| `RESUMEAI_HOST` / `RESUMEAI_PORT` | Server bind address and port. |

## Development

- Backend: run with `--reload` for auto-restart on change.
- Frontend: edit files under `frontend/`; no build step. The server serves `frontend/` at `/`.

## License

MIT.
