/**
 * File handling: upload, parse via API, clear, character counts.
 */
(function (global) {
  const utils = global.ResumeAI && global.ResumeAI.utils;
  const api = global.ResumeAI && global.ResumeAI.api;
  if (!utils || !api) return;

  function updateCharCount(val, countId, badgeId) {
    const n = (val || "").length;
    const countEl = document.getElementById(countId);
    const badgeEl = document.getElementById(badgeId);
    if (countEl) countEl.textContent = n.toLocaleString() + " characters";
    if (badgeEl) badgeEl.textContent = n > 0 ? n.toLocaleString() + " chars" : "0 chars";
  }

  async function handleFile(file, state) {
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    const icons = { pdf: "🔴", docx: "🔵", doc: "🔵", txt: "📄" };
    const fsIcon = document.getElementById("fs-icon");
    const fsName = document.getElementById("fs-name");
    const fsMeta = document.getElementById("fs-meta");
    const fileStrip = document.getElementById("file-strip");
    const resumeText = document.getElementById("resume-text");
    if (fsIcon) fsIcon.textContent = icons[ext] || "📄";
    if (fsName) fsName.textContent = file.name;
    if (fsMeta) fsMeta.textContent = (file.size / 1024).toFixed(1) + " KB · " + (ext || "").toUpperCase() + " · parsing…";
    if (fileStrip) fileStrip.classList.add("visible");
    if (resumeText) resumeText.value = "";

    try {
      const result = await api.parseResumeFile(file);
      const text = result.text || "";
      if (text.length < 50) {
        utils.showToast("Could not extract enough text. Please paste manually.", "warning");
        if (fsMeta) fsMeta.textContent = "Extraction incomplete — paste text below";
        return;
      }
      state.rawResume = text;
      state.fileName = file.name;
      if (resumeText) resumeText.value = text;
      updateCharCount(text, "resume-char-count", "resume-char-badge");
      if (fsMeta) {
        fsMeta.textContent =
          (file.size / 1024).toFixed(1) +
          " KB · " +
          (ext || "").toUpperCase() +
          " · " +
          (result.lines || text.split("\n").filter(function (l) { return l.trim(); }).length) +
          " lines extracted";
      }
      utils.showToast("✓ File parsed and loaded", "success");
    } catch (err) {
      console.error("File parse error:", err);
      if (fsMeta) fsMeta.textContent = "Parse failed — paste text manually below";
      utils.showToast(err.message || "Could not parse file. Paste your resume text manually.", "error");
    }
  }

  function clearFile(state) {
    if (state) {
      state.rawResume = "";
      state.fileName = "";
    }
    const fileStrip = document.getElementById("file-strip");
    const resumeText = document.getElementById("resume-text");
    const fileInput = document.getElementById("file-input");
    if (fileStrip) fileStrip.classList.remove("visible");
    if (resumeText) resumeText.value = "";
    if (fileInput) fileInput.value = "";
    updateCharCount("", "resume-char-count", "resume-char-badge");
  }

  global.ResumeAI = global.ResumeAI || {};
  global.ResumeAI.file = {
    updateCharCount,
    handleFile,
    clearFile,
  };
})(typeof window !== "undefined" ? window : this);
