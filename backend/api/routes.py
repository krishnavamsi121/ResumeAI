"""API route handlers."""
from fastapi import APIRouter, HTTPException, UploadFile
from pydantic import BaseModel, ConfigDict, Field

from backend.services.claude import tailor_resume
from backend.services.parse_resume import parse_file

router = APIRouter(prefix="/api", tags=["api"])


class TailorRequest(BaseModel):
    resume_text: str = Field(..., min_length=50)
    jd_text: str = Field(..., min_length=50)
    api_key: str | None = None
    model: str | None = None
    feedback: str | None = None
    current_resume: str | None = None


class TailorResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    matchScore: int = 0
    scoreCaption: str = ""
    matchedSkills: list[str] = Field(default_factory=list)
    addedSkills: list[str] = Field(default_factory=list)
    changesSummary: list[str] = Field(default_factory=list)
    sections: dict = Field(default_factory=dict)
    fullResume: str = ""


@router.post("/tailor", response_model=TailorResponse)
def post_tailor(req: TailorRequest) -> TailorResponse:
    """Tailor resume to job description using Claude."""
    try:
        result = tailor_resume(
            req.resume_text,
            req.jd_text,
            api_key=req.api_key,
            model=req.model,
            feedback=req.feedback,
            current_resume=req.current_resume,
        )
        return TailorResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Claude API error: {e}")


@router.post("/parse-resume")
def post_parse_resume(file: UploadFile) -> dict:
    """Parse uploaded resume file (PDF, DOCX, TXT) and return extracted text."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename")
    content = file.file.read()
    try:
        text = parse_file(content, file.filename)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=501, detail=str(e))
    if len(text.strip()) < 50:
        raise HTTPException(status_code=400, detail="Could not extract enough text (min 50 chars). Paste manually.")
    return {"text": text, "lines": len([l for l in text.splitlines() if l.strip()])}


@router.get("/health")
def get_health() -> dict:
    return {"status": "ok"}
