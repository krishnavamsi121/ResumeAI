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

  function exportPDF(text) {
    try {
      var jsPDF = window.jspdf && window.jspdf.jsPDF;
      if (!jsPDF) throw new Error("jsPDF not loaded");
      var doc = new jsPDF({ unit: "mm", format: "a4" });
      var marginL = 16, marginR = 16, marginT = 18, marginB = 18;
      var pageW = doc.internal.pageSize.getWidth();
      var pageH = doc.internal.pageSize.getHeight();
      var contentW = pageW - marginL - marginR;

      function isSectionHeader(line) {
        return line && line === line.toUpperCase() && /^[A-Z]/.test(line) &&
               line.trim().length > 2 && line.trim().length < 60 && !/[•\-\*]/.test(line);
      }
      function isBullet(line) { return /^\s*[•\-\*]/.test(line); }
      function isCompanyLine(line) {
        return /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}/i.test(line) ||
               /\b(Present|Current)\b/i.test(line);
      }
      function isJobTitle(line, nextLine) {
        return nextLine && !isSectionHeader(line) && !isBullet(line) && !isCompanyLine(line) &&
               (isCompanyLine(nextLine));
      }

      function checkPage(y, needed) {
        if (y + needed > pageH - marginB) { doc.addPage(); return marginT; }
        return y;
      }

      var lines = text.split("\n");
      var y = marginT;
      var lineIdx = 0;

      // ── Name ─────────────────────────────────────────────────────────────────
      while (lineIdx < lines.length && !lines[lineIdx].trim()) lineIdx++;
      if (lineIdx < lines.length) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        y = checkPage(y, 9);
        doc.text(lines[lineIdx].trim(), marginL, y);
        y += 9;
        lineIdx++;
      }

      // ── Contact line ─────────────────────────────────────────────────────────
      if (lineIdx < lines.length && lines[lineIdx].trim()) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        y = checkPage(y, 5);
        doc.text(lines[lineIdx].trim(), marginL, y);
        y += 6;
        lineIdx++;
      }
      doc.setTextColor(0, 0, 0);

      // ── Body ─────────────────────────────────────────────────────────────────
      while (lineIdx < lines.length) {
        var line = lines[lineIdx].trimEnd();
        var trimmed = line.trim();
        var nextTrimmed = lineIdx + 1 < lines.length ? lines[lineIdx + 1].trim() : "";

        // Empty line
        if (!trimmed) { y += 2.5; lineIdx++; continue; }

        // Section header
        if (isSectionHeader(trimmed)) {
          y += 3;
          y = checkPage(y, 8);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.setTextColor(0, 0, 0);
          doc.text(trimmed, marginL, y);
          y += 1.5;
          // Underline rule
          doc.setDrawColor(0, 0, 0);
          doc.setLineWidth(0.4);
          doc.line(marginL, y, pageW - marginR, y);
          y += 4;
          lineIdx++;
          continue;
        }

        // Job title (next line has date)
        if (isJobTitle(trimmed, nextTrimmed)) {
          y = checkPage(y, 6);
          var parts = trimmed.split(/\t+/);
          var titleText = parts[0].trim();
          var locText = parts[1] ? parts[1].trim() : "";
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10.5);
          doc.setTextColor(0, 0, 0);
          doc.text(titleText, marginL, y);
          if (locText) {
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.setTextColor(80, 80, 80);
            doc.text(locText, pageW - marginR, y, { align: "right" });
          }
          doc.setTextColor(0, 0, 0);
          y += 5.5;
          lineIdx++;
          continue;
        }

        // Company + date
        if (isCompanyLine(trimmed)) {
          y = checkPage(y, 5);
          var parts2 = trimmed.split(/\t+/);
          var company = parts2[0].trim();
          var dateStr = parts2[1] ? parts2[1].trim() : "";
          if (!dateStr) {
            var m = trimmed.match(/^(.+?)\s{2,}(.+)$/);
            if (m) { company = m[1].trim(); dateStr = m[2].trim(); }
          }
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9.5);
          doc.setTextColor(0, 0, 0);
          doc.text(company, marginL, y);
          if (dateStr) {
            doc.setFont("helvetica", "italic");
            doc.setFontSize(9);
            doc.setTextColor(90, 90, 90);
            doc.text(dateStr, pageW - marginR, y, { align: "right" });
          }
          doc.setTextColor(0, 0, 0);
          y += 5;
          lineIdx++;
          continue;
        }

        // Bullet
        if (isBullet(line)) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(0, 0, 0);
          var bulletText = "• " + trimmed.replace(/^\s*[•\-\*]\s*/, "");
          var bulletIndent = marginL + 4;
          var bulletW = contentW - 4;
          var wrapped = doc.splitTextToSize(bulletText, bulletW);
          for (var w = 0; w < wrapped.length; w++) {
            y = checkPage(y, 4.5);
            doc.text(wrapped[w], w === 0 ? bulletIndent : bulletIndent + 3, y);
            y += 4.5;
          }
          lineIdx++;
          continue;
        }

        // Sub-label (e.g. "Responsibilities:")
        if (/:\s*$/.test(trimmed) && trimmed.length < 60) {
          y = checkPage(y, 5);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9.5);
          doc.setTextColor(0, 0, 0);
          doc.text(trimmed, marginL, y);
          y += 5;
          lineIdx++;
          continue;
        }

        // Default text
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        var wrapped2 = doc.splitTextToSize(trimmed, contentW);
        for (var w2 = 0; w2 < wrapped2.length; w2++) {
          y = checkPage(y, 4.5);
          doc.text(wrapped2[w2], marginL, y);
          y += 4.5;
        }
        y += 1;
        lineIdx++;
      }

      var firstLine = text.split("\n").find(function (l) { return l.trim(); });
      var safeName = (firstLine || "resume").replace(/[^a-zA-Z0-9\s]/g, "").trim().slice(0, 30).replace(/\s+/g, "-").toLowerCase();
      doc.save(safeName + "-tailored.pdf");
    } catch (err) {
      console.error("PDF export error:", err);
      utils.showToast("PDF export failed. Try HTML export instead.", "error");
    }
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
