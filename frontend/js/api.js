/**
 * Backend API client: tailor resume, parse resume file.
 */
(function (global) {
  const API_BASE = "";

  async function tailorResume(payload) {
    const res = await fetch(API_BASE + "/api/tailor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(function () {
      return {};
    });
    if (!res.ok) {
      throw new Error(data.detail || "API request failed");
    }
    return data;
  }

  async function parseResumeFile(file) {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(API_BASE + "/api/parse-resume", {
      method: "POST",
      body: form,
    });
    const data = await res.json().catch(function () {
      return {};
    });
    if (!res.ok) {
      throw new Error(data.detail || "Parse failed");
    }
    return data;
  }

  global.ResumeAI = global.ResumeAI || {};
  global.ResumeAI.api = { tailorResume, parseResumeFile };
})(typeof window !== "undefined" ? window : this);
