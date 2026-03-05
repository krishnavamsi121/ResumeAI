"""ResumeAI backend application."""
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from backend.api.routes import router
from backend.config import FRONTEND_DIR


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(title="ResumeAI", version="1.0.0", lifespan=lifespan)
app.include_router(router)

# Serve frontend (index.html at /, assets at /css, /js)
if FRONTEND_DIR.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")
else:

    @app.get("/")
    async def index():
        return {"message": "ResumeAI API. Set up frontend in ./frontend/"}
