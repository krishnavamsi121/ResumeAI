"""Claude API client for resume tailoring."""
import json
import re

import anthropic

from backend.config import ANTHROPIC_API_KEY, DEFAULT_MODEL
from backend.services.prompts import SYSTEM_PROMPT, build_user_message


def tailor_resume(
    resume_text: str,
    jd_text: str,
    *,
    api_key: str | None = None,
    model: str | None = None,
    feedback: str | None = None,
    current_resume: str | None = None,
) -> dict:
    """
    Call Claude to tailor the resume. Returns parsed JSON with fullResume, sections, etc.
    """
    key = api_key or ANTHROPIC_API_KEY
    if not key:
        raise ValueError("ANTHROPIC_API_KEY not set and no api_key provided")

    user_msg = build_user_message(resume_text, jd_text, feedback=feedback, current_resume=current_resume)

    client = anthropic.Anthropic(api_key=key)
    response = client.messages.create(
        model=model or DEFAULT_MODEL,
        max_tokens=4096,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_msg}],
    )

    raw_text = ""
    for block in response.content:
        if block.type == "text":
            raw_text += block.text

    if not raw_text:
        raise ValueError("Empty response from Claude")

    parsed = _parse_json_response(raw_text)
    if not parsed.get("fullResume"):
        raise ValueError("AI response missing fullResume field")
    return parsed


def _parse_json_response(raw_text: str) -> dict:
    """Extract and parse JSON from model output."""
    text = raw_text.strip()
    # Strip markdown code fence if present
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
        text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{[\s\S]*\}", text)
        if match:
            return json.loads(match.group(0))
        raise ValueError("Could not parse AI response as JSON")
