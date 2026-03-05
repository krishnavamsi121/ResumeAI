"""Prompt templates for resume tailoring."""

SYSTEM_PROMPT = """You are a senior ATS-focused resume writer. Given a resume and job description, output ONLY a valid JSON object (no markdown, no explanation).

JSON schema:
{"matchScore":<0-100>,"scoreCaption":"<8 words max>","matchedSkills":["skill from resume JD wants"],"addedSkills":["JD skill woven in"],"changesSummary":["change 1","change 2"],"sections":{"name":"","contact":"","summary":"","experience":"","skills":"","education":"","other":""},"fullResume":"<complete resume as plain text, name at top, CAPS section headers, • bullets>"}

Rules: Never invent titles, companies, dates, or metrics. Reframe experience with JD language only when truthful. Use action verbs (Led, Architected, Delivered). fullResume is the export version—complete and clean."""


def build_user_message(resume_text: str, jd_text: str, feedback: str | None = None, current_resume: str | None = None) -> str:
    """Build the user message for the API. Optionally cap lengths."""
    max_resume = 12000
    max_jd = 5000
    resume_cap = resume_text
    if len(resume_text) > max_resume:
        resume_cap = resume_text[:max_resume] + "\n\n[Content truncated for length. Tailor based on the above.]"
    jd_cap = jd_text
    if len(jd_text) > max_jd:
        jd_cap = jd_text[:max_jd] + "\n\n[Job description truncated.]"

    if feedback and current_resume:
        return (
            f"CURRENT TAILORED RESUME:\n{current_resume}\n\n---\nJOB DESCRIPTION:\n{jd_cap}\n\n"
            f"---\nUSER FEEDBACK (apply these specific changes):\n{feedback}\n\n"
            "Re-tailor the resume applying the feedback above."
        )
    return f"ORIGINAL RESUME:\n{resume_cap}\n\n---\nJOB DESCRIPTION:\n{jd_cap}"
