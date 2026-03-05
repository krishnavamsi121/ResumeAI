"""Application configuration from environment."""
import os
from pathlib import Path

# Base paths
BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"

# API
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
DEFAULT_MODEL = os.getenv("RESUMEAI_DEFAULT_MODEL", "claude-sonnet-4-20250514")
MAX_RESUME_CHARS = int(os.getenv("RESUMEAI_MAX_RESUME_CHARS", "12000"))
MAX_JD_CHARS = int(os.getenv("RESUMEAI_MAX_JD_CHARS", "5000"))

# Server
DEBUG = os.getenv("RESUMEAI_DEBUG", "0").lower() in ("1", "true", "yes")
HOST = os.getenv("RESUMEAI_HOST", "0.0.0.0")
PORT = int(os.getenv("RESUMEAI_PORT", "5000"))
