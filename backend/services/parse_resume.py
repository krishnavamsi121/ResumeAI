"""Parse resume files (PDF, DOCX, TXT) to plain text."""
import io
from pathlib import Path

def parse_file(content: bytes, filename: str) -> str:
    """
    Extract text from uploaded resume file.
    content: raw bytes
    filename: original name (used to detect type)
    Returns plain text.
    """
    ext = (Path(filename).suffix or "").lower().lstrip(".")
    if ext == "txt":
        return content.decode("utf-8", errors="replace").strip()
    if ext == "pdf":
        return _parse_pdf(content)
    if ext in ("docx", "doc"):
        return _parse_docx(content)
    raise ValueError(f"Unsupported file type: {ext}. Use PDF, DOCX, or TXT.")


def _parse_pdf(content: bytes) -> str:
    try:
        import pypdf
    except ImportError:
        raise RuntimeError("pypdf is required for PDF parsing. Install with: pip install pypdf") from None
    reader = pypdf.PdfReader(io.BytesIO(content))
    lines = []
    for page in reader.pages:
        text = page.extract_text()
        if text:
            lines.append(text)
        lines.append("")
    return "\n".join(lines).replace("\r\n", "\n").strip()


def _parse_docx(content: bytes) -> str:
    try:
        import docx
    except ImportError:
        raise RuntimeError("python-docx is required for DOCX parsing. Install with: pip install python-docx") from None
    doc = docx.Document(io.BytesIO(content))
    return "\n".join(p.text for p in doc.paragraphs if p.text.strip()).strip()
