/**
 * Review panel: render score, skills, changes, formatted/raw resume, re-tailor.
 */
(function (global) {
  const utils = global.ResumeAI && global.ResumeAI.utils;
  if (!utils) return;

  function renderReview(data, state) {
    const score = Math.max(0, Math.min(100, data.matchScore || 0));
    const circ = 251.3;
    const offset = circ - (score / 100) * circ;
    const color = score >= 70 ? "#16A34A" : score >= 45 ? "#2563EB" : "#D97706";
    const scoreArc = document.getElementById("score-arc");
    if (scoreArc) {
      scoreArc.style.strokeDashoffset = circ;
      scoreArc.style.stroke = color;
      setTimeout(function () {
        scoreArc.style.strokeDashoffset = String(offset);
      }, 60);
    }
    const scoreEl = document.getElementById("score-number");
    const captionEl = document.getElementById("score-caption");
    if (scoreEl) {
      scoreEl.textContent = score + "%";
      scoreEl.style.color = color;
    }
    if (captionEl) captionEl.textContent = data.scoreCaption || "";

    const matchedEl = document.getElementById("matched-skills");
    const addedEl = document.getElementById("added-skills");
    if (matchedEl) {
      matchedEl.innerHTML = (data.matchedSkills || [])
        .map(function (s) { return '<span class="tag tag-green">' + utils.esc(s) + "</span>"; })
        .join("");
    }
    if (addedEl) {
      addedEl.innerHTML = (data.addedSkills || [])
        .map(function (s) { return '<span class="tag tag-blue">+ ' + utils.esc(s) + "</span>"; })
        .join("");
    }

    const changesEl = document.getElementById("changes-list");
    const changes = data.changesSummary || [];
    if (changesEl) {
      changesEl.innerHTML = changes.length
        ? changes
            .map(function (c) {
              return '<div class="change-entry"><div class="change-bullet"></div><span>' + utils.esc(c) + "</span></div>";
            })
            .join("")
        : '<span style="font-size:12px;color:var(--ink3)">No change summary available.</span>';
    }

    renderFormattedResume(data.sections || {}, data.fullResume || "");

    const rawTa = document.getElementById("raw-resume-textarea");
    if (rawTa && state) {
      state.finalResume = data.fullResume || "";
      rawTa.value = state.finalResume;
    }
  }

  function renderFormattedResume(sections, fullText) {
    const el = document.getElementById("resume-formatted-view");
    if (!el) return;
    if (sections.name || sections.summary) {
      var html = "";
      if (sections.name) html += '<div class="rf-name">' + utils.esc(sections.name) + "</div>";
      if (sections.contact) {
        html += '<div class="rf-contact">' + utils.esc(sections.contact).replace(/\n/g, " · ") + "</div>";
      }
      if (sections.summary) {
        html +=
          '<div class="rf-section"><div class="rf-section-head">Summary</div><div class="rf-paragraph">' +
          utils.esc(sections.summary) +
          "</div></div>";
      }
      if (sections.experience) {
        html +=
          '<div class="rf-section"><div class="rf-section-head">Experience</div><div class="rf-paragraph">' +
          formatExperience(sections.experience) +
          "</div></div>";
      }
      if (sections.skills) {
        html +=
          '<div class="rf-section"><div class="rf-section-head">Skills</div>' +
          formatSkills(sections.skills) +
          "</div>";
      }
      if (sections.education) {
        html +=
          '<div class="rf-section"><div class="rf-section-head">Education</div><div class="rf-paragraph">' +
          utils.esc(sections.education) +
          "</div></div>";
      }
      if (sections.other && sections.other.trim()) {
        html +=
          '<div class="rf-section"><div class="rf-section-head">Other</div><div class="rf-paragraph">' +
          utils.esc(sections.other) +
          "</div></div>";
      }
      el.innerHTML = html;
    } else {
      el.innerHTML =
        '<div style="white-space:pre-wrap;font-family:\'JetBrains Mono\',monospace;font-size:12.5px;line-height:1.7">' +
        utils.esc(fullText) +
        "</div>";
    }
  }

  function formatExperience(text) {
    var lines = String(text || "").split("\n");
    var html = "";
    var inList = false;
    for (var i = 0; i < lines.length; i++) {
      var trimmed = lines[i].trim();
      if (!trimmed) {
        if (inList) { html += "</ul>"; inList = false; }
        html += "<br>";
        continue;
      }
      if (/^[•\-*]/.test(trimmed)) {
        if (!inList) { html += '<ul class="rf-bullets">'; inList = true; }
        html += "<li>" + utils.esc(trimmed.replace(/^[•\-*]\s*/, "")) + "</li>";
      } else {
        if (inList) { html += "</ul>"; inList = false; }
        if (/[—–-]/.test(trimmed) && (/\d{4}/.test(trimmed))) {
          var parts = trimmed.split(/[—–-]/);
          html += '<div class="rf-job-title">' + utils.esc(parts[0].trim()) + "</div>";
          if (parts[1]) html += '<div class="rf-job-meta">' + utils.esc(parts[1].trim()) + "</div>";
        } else {
          html += '<p style="margin-bottom:2px">' + utils.esc(trimmed) + "</p>";
        }
      }
    }
    if (inList) html += "</ul>";
    return html;
  }

  function formatSkills(text) {
    var t = String(text || "");
    if (t.indexOf(":") !== -1) {
      var lines = t.split("\n").filter(function (l) { return l.trim(); });
      var html = "";
      for (var i = 0; i < lines.length; i++) {
        if (lines[i].indexOf(":") !== -1) {
          var parts = lines[i].split(":");
          var cat = parts[0].trim();
          var skills = (parts[1] || "").split(/[,•]/).filter(function (s) { return s.trim(); });
          html +=
            '<div style="margin-bottom:8px"><span style="font-size:12px;font-weight:600;color:var(--ink2)">' +
            utils.esc(cat) +
            ":</span> ";
          html += skills.map(function (s) { return '<span class="rf-skill-chip">' + utils.esc(s.trim()) + "</span>"; }).join(" ");
          html += "</div>";
        } else {
          var sks = lines[i].split(/[,•]/).filter(function (s) { return s.trim(); });
          html += sks.map(function (s) { return '<span class="rf-skill-chip">' + utils.esc(s.trim()) + "</span>"; }).join(" ");
        }
      }
      return html;
    }
    var chips = t.split(/[,\n•]/).map(function (s) { return s.trim(); }).filter(Boolean);
    return '<div class="rf-skills-grid">' + chips.map(function (s) { return '<span class="rf-skill-chip">' + utils.esc(s) + "</span>"; }).join(" ") + "</div>";
  }

  function switchTab(name, state) {
    document.querySelectorAll(".tab-btn").forEach(function (b) { b.classList.remove("active"); });
    document.querySelectorAll(".tab-panel").forEach(function (p) { p.classList.remove("active"); });
    var btn = document.querySelector('.tab-btn[data-tab="' + name + '"]');
    var panel = document.getElementById("tab-" + name);
    if (btn) btn.classList.add("active");
    if (panel) panel.classList.add("active");
    if (name === "raw" && state) {
      var rawTa = document.getElementById("raw-resume-textarea");
      if (rawTa) rawTa.value = state.finalResume || "";
    }
  }

  function copyResumeText(state) {
    var raw = document.getElementById("raw-resume-textarea");
    if (raw && raw.value && state) state.finalResume = raw.value;
    var text = state ? state.finalResume : "";
    if (!text) {
      utils.showToast("No resume content to copy", "error");
      return;
    }
    navigator.clipboard.writeText(text).then(
      function () { utils.showToast("✓ Copied to clipboard", "success"); },
      function () { utils.showToast("Copy failed — try the Export tab", "error"); }
    );
  }

  global.ResumeAI = global.ResumeAI || {};
  global.ResumeAI.review = {
    renderReview,
    renderFormattedResume,
    formatExperience,
    formatSkills,
    switchTab,
    copyResumeText,
  };
})(typeof window !== "undefined" ? window : this);
