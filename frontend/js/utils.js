/**
 * Shared utilities: escape HTML, toast notifications, sleep.
 */
(function (global) {
  function esc(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  let toastTimer;
  function showToast(msg, type = "") {
    clearTimeout(toastTimer);
    const el = document.getElementById("toast");
    if (!el) return;
    el.textContent = msg;
    el.className = "toast" + (type ? " " + type : "");
    el.classList.add("show");
    toastTimer = setTimeout(function () {
      el.classList.remove("show");
    }, 3500);
  }

  function sleep(ms) {
    return new Promise(function (r) {
      setTimeout(r, ms);
    });
  }

  global.ResumeAI = global.ResumeAI || {};
  global.ResumeAI.utils = { esc, showToast, sleep };
})(typeof window !== "undefined" ? window : this);
