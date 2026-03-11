/**
 * Export: TXT, HTML, PDF, DOCX, copy. Reset app.
 */
(function (global) {
  const utils = global.ResumeAI && global.ResumeAI.utils;
  const file = global.ResumeAI && global.ResumeAI.file;
  if (!utils) return;

  function downloadFile(name, content, mime) {
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([content], { type: mime }));
    a.download = name;
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }

  function buildHTMLExport(text) {
    var escaped = utils.esc(text);
    return (
      "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n<meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">\n<title>Resume</title>\n<style>\n  * { box-sizing: border-box; margin: 0; padding: 0; }\n  body { font-family: 'Inter', Georgia, serif; max-width: 860px; margin: 48px auto; padding: 0 40px; color: #1a1916; line-height: 1.7; font-size: 14px; }\n  pre { white-space: pre-wrap; word-wrap: break-word; font-family: inherit; font-size: 13.5px; line-height: 1.75; }\n</style>\n</head>\n<body><pre>" +
      escaped +
      "</pre></body>\n</html>"
    );
  }

  // Reorder raw text so SKILLS section appears directly after SUMMARY
  function reorderSectionsForPDF(text) {
    var lines = text.split("\n");
    var sections = [];
    var currentHeader = null;
    var currentLines = [];

    function isSectionHdr(t) {
      return t && t === t.toUpperCase() && /^[A-Z]/.test(t) && t.length > 2 && t.length < 60 && !/[•\-\*]/.test(t);
    }

    for (var i = 0; i < lines.length; i++) {
      var t = lines[i].trim();
      if (isSectionHdr(t)) {
        sections.push({ header: currentHeader, lines: currentLines });
        currentHeader = t;
        currentLines = [];
      } else {
        currentLines.push(lines[i]);
      }
    }
    sections.push({ header: currentHeader, lines: currentLines });

    var summaryIdx = -1, skillsIdx = -1;
    for (var j = 0; j < sections.length; j++) {
      var h = sections[j].header;
      if (h && /^SUMMARY/i.test(h)) summaryIdx = j;
      if (h && /^SKILL/i.test(h)) skillsIdx = j;
    }
    if (summaryIdx >= 0 && skillsIdx >= 0 && skillsIdx !== summaryIdx + 1) {
      var moved = sections.splice(skillsIdx, 1)[0];
      summaryIdx = -1;
      for (var k = 0; k < sections.length; k++) {
        if (sections[k].header && /^SUMMARY/i.test(sections[k].header)) { summaryIdx = k; break; }
      }
      if (summaryIdx >= 0) sections.splice(summaryIdx + 1, 0, moved);
    }

    var result = [];
    for (var m = 0; m < sections.length; m++) {
      if (sections[m].header) result.push(sections[m].header);
      result = result.concat(sections[m].lines);
    }
    return result.join("\n");
  }

  function exportPDF(text) {
    var previewEl = document.getElementById("resume-formatted-view");
    if (!previewEl || !previewEl.innerHTML.trim()) {
      utils.showToast("No formatted preview to export", "error");
      return;
    }
    var html = previewEl.innerHTML;

    var printDoc = '<!DOCTYPE html><html lang="en"><head>' +
      '<meta charset="UTF-8">' +
      '<meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<title>Resume</title>' +
      '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">' +
      '<style>' +
      '@page { size: A4; margin: 18mm 16mm; }' +
      '* { box-sizing: border-box; margin: 0; padding: 0; }' +
      'body { font-family: \'Inter\', system-ui, sans-serif; font-size: 13px; line-height: 1.6; color: #0F1117; -webkit-print-color-adjust: exact; print-color-adjust: exact; }' +
      'ul { margin: 4px 0; padding-left: 20px; }' +
      '.rf-name { font-size: 22px; font-weight: 700; letter-spacing: -0.5px; margin-bottom: 4px; }' +
      '.rf-contact { font-size: 12px; color: #5A6070; margin-bottom: 12px; line-height: 1.6; }' +
      '.rf-section { margin-bottom: 18px; }' +
      '.rf-section-head { font-size: 14px; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase; color: #6366F1; padding-bottom: 5px; margin-bottom: 8px; border-bottom: 1.5px solid #C4C6FD; }' +
      '.rf-job-title { font-size: 14px; font-weight: 600; margin-top: 6px; }' +
      '.rf-job-meta { font-size: 12px; color: #5A6070; margin-bottom: 5px; }' +
      '.rf-bullets { padding-left: 20px; list-style-type: disc; margin-bottom: 13px;}' +
      '.rf-bullets li { font-size: 13px; margin-bottom: 3px; line-height: 1.55; list-style-type: disc; }' +
      '.rf-paragraph { font-size: 13px; line-height: 1.65; }' +
      '.rf-skill-category { display: flex; flex-wrap: wrap; align-items: baseline; gap: 5px; row-gap: 5px; margin-bottom: 8px; }' +
      '.rf-skill-cat-label { font-size: 12px; font-weight: 700; color: #5A6070; white-space: nowrap; flex-shrink: 0; }' +
      '.rf-skill-chip { font-size: 11px; padding: 2px 8px; border-radius: 20px; background: #EEEEFF; border: 1px solid #C4C6FD; color: #6366F1; font-weight: 500; display: inline-block; }' +
      '.rf-skills-grid { display: flex; flex-wrap: wrap; gap: 5px; }' +
      '</style>' +
      '</head><body>' + html + '</body></html>';

    var win = window.open('', '_blank');
    if (!win) {
      utils.showToast("Pop-up blocked — please allow pop-ups and try again", "error");
      return;
    }
    win.document.write(printDoc);
    win.document.close();
    win.focus();
    // Wait for fonts to load before printing
    setTimeout(function() {
      win.print();
      setTimeout(function() { win.close(); }, 500);
    }, 600);
  }

  function exportDOCX(text) {
    return import("https://cdn.skypack.dev/docx@8.5.0").then(function (mod) {
      var docx = mod.default || mod;
      var Document = docx.Document, Packer = docx.Packer, Paragraph = docx.Paragraph,
          TextRun = docx.TextRun, Tab = docx.Tab, TabStopType = docx.TabStopType,
          TabStopLeader = docx.TabStopLeader, AlignmentType = docx.AlignmentType,
          BorderStyle = docx.BorderStyle, UnderlineType = docx.UnderlineType;

      var FONT = "Calibri";
      var COLOR_DARK = "1F1F1F";
      var COLOR_SECTION = "000000";

      // Detect line type
      function isSectionHeader(line) {
        return line && line === line.toUpperCase() && /^[A-Z]/.test(line) && line.trim().length > 2 && line.trim().length < 60 && !/[•\-\*]/.test(line);
      }
      function isBullet(line) {
        return /^\s*[•\-\*]/.test(line);
      }
      // Job title line: bold title + right-aligned location (tab-separated)
      function isJobTitle(line, nextLine) {
        return nextLine && /[A-Za-z]/.test(line) && !isSectionHeader(line) && !isBullet(line) &&
               (nextLine.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}/i) ||
                nextLine.match(/\b(Present|Current)\b/i));
      }
      // Company+date line: company name on left, date range on right
      function isCompanyLine(line) {
        return /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}/i.test(line) ||
               /\b(Present|Current)\b/i.test(line);
      }

      var lines = text.split("\n");
      var children = [];
      var i = 0;

      // ── Name (first non-empty line) ──────────────────────────────────────────
      while (i < lines.length && !lines[i].trim()) i++;
      if (i < lines.length) {
        children.push(new Paragraph({
          children: [new TextRun({ text: lines[i].trim(), bold: true, size: 36, font: FONT, color: COLOR_DARK })],
          spacing: { after: 60 },
        }));
        i++;
      }

      // ── Contact line ─────────────────────────────────────────────────────────
      if (i < lines.length && lines[i].trim()) {
        children.push(new Paragraph({
          children: [new TextRun({ text: lines[i].trim(), size: 18, font: FONT, color: "444444" })],
          spacing: { after: 120 },
        }));
        i++;
      }

      // ── Remaining lines ───────────────────────────────────────────────────────
      while (i < lines.length) {
        var line = lines[i].trimEnd();
        var trimmed = line.trim();

        // Empty line → small spacer
        if (!trimmed) {
          children.push(new Paragraph({ children: [new TextRun({ text: "", size: 18, font: FONT })], spacing: { after: 60 } }));
          i++;
          continue;
        }

        // Section header (ALL CAPS) → bold + bottom border line
        if (isSectionHeader(trimmed)) {
          children.push(new Paragraph({
            children: [new TextRun({ text: trimmed, bold: true, size: 20, font: FONT, color: COLOR_SECTION })],
            spacing: { before: 200, after: 80 },
            border: {
              bottom: { color: "000000", space: 1, style: BorderStyle ? BorderStyle.SINGLE : "single", size: 6 },
            },
          }));
          i++;
          continue;
        }

        // Bullet point
        if (isBullet(line)) {
          children.push(new Paragraph({
            children: [new TextRun({ text: "• " + trimmed.replace(/^\s*[•\-\*]\s*/, ""), size: 18, font: FONT, color: COLOR_DARK })],
            spacing: { after: 40 },
            indent: { left: 360 },
          }));
          i++;
          continue;
        }

        // Job title line (next line has a date) → bold title + right location via tab
        var nextTrimmed = i + 1 < lines.length ? lines[i + 1].trim() : "";
        if (!isCompanyLine(trimmed) && isJobTitle(trimmed, nextTrimmed)) {
          // Title on left, location (if separated by tab) on right
          var parts = trimmed.split(/\t+/);
          var titleText = parts[0].trim();
          var locText = parts[1] ? parts[1].trim() : "";
          var titleRuns = [new TextRun({ text: titleText, bold: true, size: 20, font: FONT, color: COLOR_DARK })];
          if (locText) {
            titleRuns.push(new TextRun({ children: [new Tab()], font: FONT, size: 20 }));
            titleRuns.push(new TextRun({ text: locText, size: 18, font: FONT, color: "555555" }));
          }
          children.push(new Paragraph({
            children: titleRuns,
            spacing: { before: 160, after: 40 },
            tabStops: [{ type: TabStopType ? TabStopType.RIGHT : "right", position: 9360 }],
          }));
          i++;
          continue;
        }

        // Company + date line → company bold left, date right
        if (isCompanyLine(trimmed)) {
          var parts2 = trimmed.split(/\t+/);
          var company = parts2[0].trim();
          var dateStr = parts2[1] ? parts2[1].trim() : "";
          // Try splitting on multiple spaces if no tab
          if (!dateStr) {
            var m = trimmed.match(/^(.+?)\s{2,}(.+)$/);
            if (m) { company = m[1].trim(); dateStr = m[2].trim(); }
          }
          var compRuns = [new TextRun({ text: company, bold: true, size: 18, font: FONT, color: COLOR_DARK })];
          if (dateStr) {
            compRuns.push(new TextRun({ children: [new Tab()], font: FONT, size: 18 }));
            compRuns.push(new TextRun({ text: dateStr, size: 18, font: FONT, color: "555555", italics: true }));
          }
          children.push(new Paragraph({
            children: compRuns,
            spacing: { after: 60 },
            tabStops: [{ type: TabStopType ? TabStopType.RIGHT : "right", position: 9360 }],
          }));
          i++;
          continue;
        }

        // Sub-label (e.g. "Responsibilities:") → bold
        if (/:\s*$/.test(trimmed) && trimmed.length < 60) {
          children.push(new Paragraph({
            children: [new TextRun({ text: trimmed, bold: true, size: 18, font: FONT, color: COLOR_DARK })],
            spacing: { after: 40 },
          }));
          i++;
          continue;
        }

        // Default text
        children.push(new Paragraph({
          children: [new TextRun({ text: trimmed, size: 18, font: FONT, color: COLOR_DARK })],
          spacing: { after: 60 },
        }));
        i++;
      }

      var doc = new Document({
        sections: [{
          properties: {
            page: { margin: { top: 720, bottom: 720, left: 900, right: 900 } },
          },
          children: children,
        }],
      });
      return Packer.toBlob(doc);
    }).then(function (blob) {
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      var firstLine = text.split("\n").find(function (l) { return l.trim(); });
      var safeName = (firstLine || "resume").replace(/[^a-zA-Z0-9\s]/g, "").trim().slice(0, 30).replace(/\s+/g, "-").toLowerCase();
      a.download = safeName + "-tailored.docx";
      a.click();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    }).catch(function (err) {
      console.error("DOCX export error:", err);
      utils.showToast("DOCX export failed. Try PDF or HTML.", "error");
      throw err;
    });
  }

  function flashStatus(el, msg, cls) {
    if (!el) return;
    el.textContent = msg;
    el.className = "export-status alert " + cls + " show";
    setTimeout(function () { el.classList.remove("show"); }, 4000);
  }

  function doExport(type, state) {
    var rawVal = document.getElementById("raw-resume-textarea");
    if (rawVal && rawVal.value && state) state.finalResume = rawVal.value;
    var content = state ? state.finalResume : "";
    var statusEl = document.getElementById("export-status");
    if (!content) {
      utils.showToast("No resume content to export", "error");
      return;
    }
    if (type === "txt") {
      downloadFile("resume-tailored.txt", content, "text/plain");
      flashStatus(statusEl, "✓ Text file downloaded!", "alert-success");
    } else if (type === "html") {
      downloadFile("resume-tailored.html", buildHTMLExport(content), "text/html");
      flashStatus(statusEl, "✓ HTML file downloaded!", "alert-success");
    } else if (type === "pdf") {
      exportPDF(content);
      flashStatus(statusEl, "✓ PDF generated!", "alert-success");
    } else if (type === "docx") {
      exportDOCX(content).then(
        function () { flashStatus(statusEl, "✓ Word document downloaded!", "alert-success"); },
        function () { flashStatus(statusEl, "✗ DOCX export failed. Try PDF or HTML.", "alert-error"); }
      );
    } else if (type === "copy") {
      navigator.clipboard.writeText(content).then(
        function () { flashStatus(statusEl, "✓ Copied to clipboard!", "alert-success"); },
        function () { flashStatus(statusEl, "✗ Copy failed.", "alert-error"); }
      );
    }
  }

  function resetAll(state, goToStep) {
    if (!state) return;
    state.rawResume = "";
    state.jdText = "";
    state.fileName = "";
    state.result = null;
    state.finalResume = "";
    state.maxStep = 1;
    state.remodHistory = [];
    document.getElementById("resume-text").value = "";
    document.getElementById("jd-text").value = "";
    var remod = document.getElementById("remod-text");
    if (remod) remod.value = "";
    var remodHistory = document.getElementById("remod-history");
    if (remodHistory) remodHistory.style.display = "none";
    if (file) file.clearFile(state);
    file.updateCharCount("", "resume-char-count", "resume-char-badge");
    file.updateCharCount("", "jd-char-count", "jd-char-badge");
    if (goToStep) goToStep(1);
  }

  global.ResumeAI = global.ResumeAI || {};
  global.ResumeAI.export = {
    doExport,
    downloadFile,
    buildHTMLExport,
    exportPDF,
    exportDOCX,
    flashStatus,
    resetAll,
  };
})(typeof window !== "undefined" ? window : this);
