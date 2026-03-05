/**
 * Application state, navigation, and orchestration.
 */
(function (global) {
  const utils = global.ResumeAI && global.ResumeAI.utils;
  const api = global.ResumeAI && global.ResumeAI.api;
  const file = global.ResumeAI && global.ResumeAI.file;
  const review = global.ResumeAI && global.ResumeAI.review;
  const exportModule = global.ResumeAI && global.ResumeAI.export;

  var S = {
    apiKey: "",
    preferredModel: "",
    rawResume: "",
    jdText: "",
    fileName: "",
    result: null,
    finalResume: "",
    maxStep: 1,
    cancelled: false,
    remodHistory: [],
  };

  function goToStep(n) {
    document.querySelectorAll(".panel").forEach(function (p) { p.classList.remove("active"); });
    var panel = document.getElementById("panel" + n);
    if (panel) panel.classList.add("active");
    document.querySelectorAll(".step-item").forEach(function (el, i) {
      el.classList.remove("active", "done", "clickable");
      var sn = i + 1;
      if (sn < n) { el.classList.add("done"); if (sn !== 2) el.classList.add("clickable"); }
      if (sn === n) el.classList.add("active");
    });
    if (n > S.maxStep) S.maxStep = n;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function tryNav(n) {
    if (n === 2) return;
    if (n <= S.maxStep) goToStep(n);
  }

  function addLogLine(msg, type) {
    type = type || "pending";
    var el = document.getElementById("proc-log");
    if (!el) return;
    var d = document.createElement("div");
    d.className = "proc-log-line log-" + type;
    d.textContent = (type === "done" ? "✓  " : type === "error" ? "✗  " : "▸  ") + msg;
    el.appendChild(d);
    el.scrollTop = el.scrollHeight;
    var sub = document.getElementById("proc-sub");
    if (sub) sub.textContent = msg;
    return d;
  }

  function completeLastLog() {
    var el = document.getElementById("proc-log");
    if (!el) return;
    var last = el.querySelector(".log-pending");
    if (last) {
      last.className = "proc-log-line log-done";
      last.textContent = "✓  " + last.textContent.slice(3);
    }
  }

  function openApiModal() {
    var input = document.getElementById("api-key-input");
    var sel = document.getElementById("api-model-select");
    if (input) input.value = S.apiKey || "";
    if (sel) sel.value = S.preferredModel || "claude-sonnet-4-20250514";
    var modal = document.getElementById("api-modal");
    if (modal) modal.classList.add("open");
    setTimeout(function () { if (input) input.focus(); }, 100);
  }

  function closeApiModal() {
    var modal = document.getElementById("api-modal");
    if (modal) modal.classList.remove("open");
  }

  function saveApiKey() {
    var input = document.getElementById("api-key-input");
    var val = input ? input.value.trim() : "";
    if (!val || val.indexOf("sk-") !== 0) {
      utils.showToast("Invalid API key format. Should start with sk-", "error");
      return;
    }
    S.apiKey = val;
    var modelEl = document.getElementById("api-model-select");
    if (modelEl) {
      S.preferredModel = modelEl.value;
      try { localStorage.setItem("claude_model", S.preferredModel); } catch (e) {}
    }
    try { localStorage.setItem("anthropic_key", val); } catch (e) {}
    updateApiKeyUI(true);
    closeApiModal();
    var warn = document.getElementById("api-warning");
    if (warn) warn.style.display = "none";
    utils.showToast("API key saved", "success");
  }

  function updateApiKeyUI(isSet) {
    var dot = document.getElementById("api-dot");
    var lbl = document.getElementById("api-key-label");
    if (dot) dot.className = "api-key-dot" + (isSet ? " set" : "");
    if (lbl) lbl.textContent = isSet ? "API Key ✓" : "Set API Key";
  }

  async function startProcessing() {
    var resumeText = document.getElementById("resume-text").value.trim();
    var jdText = document.getElementById("jd-text").value.trim();
    if (!resumeText || resumeText.length < 50) {
      utils.showToast("Please upload or paste your resume (at least a few lines)", "error");
      return;
    }
    if (!jdText || jdText.length < 50) {
      utils.showToast("Please paste the job description", "error");
      return;
    }
    if (!S.apiKey) {
      openApiModal();
      utils.showToast("Please set your Claude API key first", "warning");
      return;
    }
    S.rawResume = resumeText;
    S.jdText = jdText;
    S.cancelled = false;
    goToStep(2);
    await runAI(null);
  }

  function cancelProcessing() {
    S.cancelled = true;
    goToStep(1);
    utils.showToast("Processing cancelled", "warning");
  }

  async function runAI(feedback) {
    var procLog = document.getElementById("proc-log");
    var cancelBtn = document.getElementById("cancel-btn");
    if (procLog) procLog.innerHTML = "";
    if (cancelBtn) cancelBtn.style.display = "inline-flex";

    addLogLine("Reading and parsing resume content…");
    await utils.sleep(200);
    completeLastLog();
    addLogLine("Analyzing job description requirements…");
    await utils.sleep(200);
    completeLastLog();
    addLogLine(feedback ? "Applying your feedback with Claude…" : "Tailoring resume with Claude AI…");

    var payload = {
      resume_text: S.rawResume,
      jd_text: S.jdText,
      api_key: S.apiKey || undefined,
      model: S.preferredModel || undefined,
      feedback: feedback || undefined,
      current_resume: feedback ? S.finalResume : undefined,
    };

    try {
      var result = await api.tailorResume(payload);
      if (S.cancelled) return;
      completeLastLog();
      addLogLine("Formatting preview…");
      await utils.sleep(150);
      completeLastLog();
      addLogLine("Done!", "done");
      await utils.sleep(350);
      S.result = result;
      S.finalResume = result.fullResume || "";
      review.renderReview(result, S);
      goToStep(3);
    } catch (err) {
      completeLastLog();
      addLogLine("Error: " + err.message, "error");
      var spinner = document.getElementById("proc-spinner");
      if (spinner) spinner.style.animationPlayState = "paused";
      console.error("Claude API error:", err);
      utils.showToast("AI error: " + err.message, "error");
      if (cancelBtn) cancelBtn.textContent = "← Go Back";
    } finally {
      if (cancelBtn) cancelBtn.style.display = "inline-flex";
    }
  }

  async function requestRemodify() {
    var remodText = document.getElementById("remod-text");
    var feedback = remodText ? remodText.value.trim() : "";
    if (!feedback) {
      utils.showToast("Please describe what to change", "warning");
      return;
    }
    S.remodHistory.push(feedback);
    var historyList = document.getElementById("remod-history-list");
    var historyEl = document.getElementById("remod-history");
    if (historyList) {
      var last = S.remodHistory.slice(-3);
      historyList.innerHTML = last
        .map(function (h) {
          var attr = h.replace(/"/g, "&quot;");
          var display = utils.esc(h.slice(0, 40)) + (h.length > 40 ? "…" : "");
          return '<span class="history-chip" data-prompt="' + attr + '">' + display + "</span>";
        })
        .join("");
    }
    if (historyEl) historyEl.style.display = "block";

    var btn = document.getElementById("remod-btn");
    if (btn) { btn.disabled = true; btn.textContent = "↺  Re-tailoring…"; }
    goToStep(2);
    var procLog = document.getElementById("proc-log");
    if (procLog) procLog.innerHTML = "";
    addLogLine("Applying your feedback…");
    S.cancelled = false;
    await runAI(feedback);
    if (btn) { btn.disabled = false; btn.textContent = "↺  Re-tailor with this feedback"; }
    if (remodText) remodText.value = "";
  }

  function init() {
    var saved = null;
    try { saved = localStorage.getItem("anthropic_key"); } catch (e) {}
    if (saved) {
      S.apiKey = saved;
      updateApiKeyUI(true);
    } else {
      var warn = document.getElementById("api-warning");
      if (warn) warn.style.display = "flex";
    }
    var savedModel = null;
    try { savedModel = localStorage.getItem("claude_model"); } catch (e) {}
    if (savedModel) S.preferredModel = savedModel;
    var modelSelect = document.getElementById("api-model-select");
    if (modelSelect && S.preferredModel) modelSelect.value = S.preferredModel;

    var rt = document.getElementById("resume-text");
    var jt = document.getElementById("jd-text");
    try {
      var savedResume = localStorage.getItem("resume_text");
      var savedJD = localStorage.getItem("jd_text");
      if (savedResume && rt) { rt.value = savedResume; file.updateCharCount(savedResume, "resume-char-count", "resume-char-badge"); }
      if (savedJD && jt) { jt.value = savedJD; file.updateCharCount(savedJD, "jd-char-count", "jd-char-badge"); }
    } catch (e) {}
    if (rt) {
      rt.addEventListener("input", function () {
        file.updateCharCount(rt.value, "resume-char-count", "resume-char-badge");
        try { localStorage.setItem("resume_text", rt.value); } catch (e) {}
      });
    }
    if (jt) {
      jt.addEventListener("input", function () {
        file.updateCharCount(jt.value, "jd-char-count", "jd-char-badge");
        try { localStorage.setItem("jd_text", jt.value); } catch (e) {}
      });
    }

    var dropZone = document.getElementById("drop-zone");
    var fileInput = document.getElementById("file-input");
    if (dropZone) {
      dropZone.addEventListener("dragover", function (e) { e.preventDefault(); dropZone.classList.add("dragover"); });
      dropZone.addEventListener("dragleave", function () { dropZone.classList.remove("dragover"); });
      dropZone.addEventListener("drop", function (e) {
        e.preventDefault();
        dropZone.classList.remove("dragover");
        var f = e.dataTransfer && e.dataTransfer.files[0];
        if (f) file.handleFile(f, S);
      });
    }
    if (fileInput) {
      fileInput.addEventListener("change", function (e) {
        var f = e.target && e.target.files[0];
        if (f) file.handleFile(f, S);
      });
    }

    document.getElementById("file-strip-remove").addEventListener("click", function () { file.clearFile(S); });

    document.getElementById("start-btn").addEventListener("click", startProcessing);
    document.getElementById("cancel-btn").addEventListener("click", cancelProcessing);

    document.getElementById("api-key-btn").addEventListener("click", openApiModal);
    var apiWarningBtn = document.getElementById("api-warning-btn");
    if (apiWarningBtn) apiWarningBtn.addEventListener("click", openApiModal);
    document.getElementById("modal-close").addEventListener("click", closeApiModal);
    document.getElementById("modal-cancel").addEventListener("click", closeApiModal);
    document.getElementById("modal-save").addEventListener("click", saveApiKey);
    document.getElementById("api-key-input").addEventListener("keydown", function (e) {
      if (e.key === "Enter") saveApiKey();
    });

    document.querySelectorAll(".step-item[data-step]").forEach(function (el) {
      var step = parseInt(el.getAttribute("data-step"), 10);
      if (!isNaN(step)) el.addEventListener("click", function () { tryNav(step); });
    });

    document.getElementById("copy-resume-btn").addEventListener("click", function () { review.copyResumeText(S); });
    document.querySelectorAll(".tab-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var tab = btn.getAttribute("data-tab");
        if (tab) review.switchTab(tab, S);
      });
    });
    document.getElementById("raw-resume-textarea").addEventListener("input", function () {
      S.finalResume = this.value;
    });

    document.getElementById("go-export-btn").addEventListener("click", function () { goToStep(4); });
    document.getElementById("start-over-btn").addEventListener("click", function () { goToStep(1); });

    document.getElementById("remod-btn").addEventListener("click", function () { requestRemodify(); });
    var quickPrompts = [
      "Make the summary more concise (2-3 sentences)",
      "Add more quantified metrics to experience bullets",
      "Make the tone more confident and action-oriented",
      "Reorganize skills by relevance to the job description",
    ];
    var qpEl = document.getElementById("quick-prompts");
    if (qpEl) {
      qpEl.innerHTML = quickPrompts
        .map(function (p) {
          return '<span class="history-chip" data-prompt="' + p.replace(/"/g, "&quot;") + '">' + utils.esc(p.slice(0, 35)) + (p.length > 35 ? "…" : "") + "</span>";
        })
        .join("");
    }
    document.getElementById("quick-prompts").addEventListener("click", function (e) {
      var chip = e.target && e.target.closest(".history-chip");
      if (chip && chip.getAttribute("data-prompt")) {
        var remod = document.getElementById("remod-text");
        if (remod) remod.value = chip.getAttribute("data-prompt");
      }
    });
    document.getElementById("remod-history-list").addEventListener("click", function (e) {
      var chip = e.target && e.target.closest(".history-chip");
      if (chip && chip.getAttribute("data-prompt")) {
        var remod = document.getElementById("remod-text");
        if (remod) remod.value = chip.getAttribute("data-prompt");
      }
    });

    document.querySelectorAll(".export-card").forEach(function (card) {
      var type = card.getAttribute("data-export");
      if (type) card.addEventListener("click", function () { exportModule.doExport(type, S); });
    });
    document.getElementById("back-review-btn").addEventListener("click", function () { goToStep(3); });
    document.getElementById("reset-all-btn").addEventListener("click", function () { exportModule.resetAll(S, goToStep); });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  global.ResumeAI = global.ResumeAI || {};
  global.ResumeAI.app = { S, goToStep, tryNav, addLogLine, completeLastLog };
})(typeof window !== "undefined" ? window : this);
