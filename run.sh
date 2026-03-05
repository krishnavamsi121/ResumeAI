#!/usr/bin/env bash
# Run ResumeAI backend (serve frontend + API).
# Usage: ./run.sh
set -e
cd "$(dirname "$0")"
export RESUMEAI_PORT="${RESUMEAI_PORT:-5000}"
if [ -d "venv" ]; then
  source venv/bin/activate
fi
exec uvicorn backend.main:app --host "${RESUMEAI_HOST:-0.0.0.0}" --port "$RESUMEAI_PORT"
