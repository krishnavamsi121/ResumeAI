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
      // Skills before experience (matches Word export order)
      if (sections.skills) {
        html +=
          '<div class="rf-section"><div class="rf-section-head">Skills</div>' +
          formatSkills(sections.skills) +
          "</div>";
      }
      if (sections.experience) {
        html +=
          '<div class="rf-section"><div class="rf-section-head">Experience</div>' +
          formatExperience(sections.experience) +
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
      var nextTrimmed = i + 1 < lines.length ? lines[i + 1].trim() : "";

      // Skip empty lines — close list if open, no gap rendered
      if (!trimmed) {
        if (inList) { html += "</ul>"; inList = false; }
        continue;
      }

      // Explicit bullet char
      if (/^[•\-*]/.test(trimmed)) {
        if (!inList) { html += '<ul class="rf-bullets">'; inList = true; }
        html += "<li>" + utils.esc(trimmed.replace(/^[•\-*]\s*/, "")) + "</li>";
        continue;
      }

      // Line containing a date range → company / meta line
      var hasDate = /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}/i.test(trimmed) || /\b(Present|Current)\b/i.test(trimmed);
      if (hasDate) {
        if (inList) { html += "</ul>"; inList = false; }
        html += '<div class="rf-job-meta">' + utils.esc(trimmed) + "</div>";
        continue;
      }

      // Next line has a date → this is the job title line
      var nextHasDate = /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}/i.test(nextTrimmed) || /\b(Present|Current)\b/i.test(nextTrimmed);
      if (nextHasDate) {
        if (inList) { html += "</ul>"; inList = false; }
        html += '<div class="rf-job-title">' + utils.esc(trimmed) + "</div>";
        continue;
      }

      // Everything else: treat as bullet point
      if (!inList) { html += '<ul class="rf-bullets">'; inList = true; }
      html += "<li>" + utils.esc(trimmed) + "</li>";
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
        var line = lines[i];
        if (line.indexOf(":") !== -1) {
          var colonIdx = line.indexOf(":");
          var cat = line.slice(0, colonIdx).trim();
          var skillsStr = line.slice(colonIdx + 1).trim();
          var skills = skillsStr.split(/[,]/).map(function (s) { return s.trim(); }).filter(Boolean);
          html += '<div class="rf-skill-category">' +
                  '<span class="rf-skill-cat-label">' + utils.esc(cat) + ':</span> ' +
                  '<span class="rf-paragraph">' + utils.esc(skills.join(", ")) + '</span>' +
                  '</div>';
        } else {
          var sks = line.split(/[,]/).map(function (s) { return s.trim(); }).filter(Boolean);
          html += '<div class="rf-skill-category">' +
                  '<span class="rf-paragraph">' + utils.esc(sks.join(", ")) + '</span>' +
                  '</div>';
        }
      }
      return html;
    }
    var skills = t.split(/[,\n•]/).map(function (s) { return s.trim(); }).filter(Boolean);
    return '<div class="rf-paragraph">' + utils.esc(skills.join(", ")) + "</div>";
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
