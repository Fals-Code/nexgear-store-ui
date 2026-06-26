(() => {
  "use strict";

  if (window.NexAdminFeedback) return;

  const body = document.body;
  const page = body?.dataset.adminPage || (body?.classList.contains("page-admin-articles") ? "articles" : "");
  const supportedPages = new Set(["articles", "products", "users", "transactions"]);
  if (!body?.classList.contains("page-admin") || !supportedPages.has(page)) return;

  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));
  const toast = $(page === "articles" ? "#admin-toast" : "#suite-toast");
  let toastTimer = 0;
  let activeButton = null;

  const escapeHtml = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const iconMap = {
    success: "✓",
    info: "i",
    warning: "!",
    danger: "×",
  };

  const titleMap = {
    success: "Berhasil",
    info: "Informasi",
    warning: "Perlu diperhatikan",
    danger: "Tindakan selesai",
  };

  const announce = (message) => {
    if (window.NexA11y?.announce) {
      window.NexA11y.announce(message);
      return;
    }
    let region = $("#admin-feedback-live");
    if (!region) {
      region = document.createElement("div");
      region.id = "admin-feedback-live";
      region.className = "crud-live-region";
      region.setAttribute("role", "status");
      region.setAttribute("aria-live", "polite");
      region.setAttribute("aria-atomic", "true");
      document.body.append(region);
    }
    region.textContent = "";
    requestAnimationFrame(() => {
      region.textContent = message;
    });
  };

  const clearButtonState = (button = activeButton) => {
    if (!button) return;
    button.removeAttribute("aria-busy");
    button.dataset.feedbackState = "success";
    window.setTimeout(() => {
      button.removeAttribute("data-feedback-state");
    }, 650);
    if (button === activeButton) activeButton = null;
  };

  const begin = (button) => {
    if (!(button instanceof HTMLButtonElement) || button.disabled) return;
    clearButtonState(activeButton);
    activeButton = button;
    button.dataset.feedbackState = "processing";
    button.setAttribute("aria-busy", "true");
  };

  const hide = () => {
    if (!toast) return;
    toast.classList.remove("is-visible");
    toast.dataset.state = "closing";
    window.setTimeout(() => {
      toast.hidden = true;
      toast.dataset.state = "closed";
    }, 180);
  };

  const show = (message, options = {}) => {
    const tone = ["success", "info", "warning", "danger"].includes(options.tone)
      ? options.tone
      : "success";
    const title = options.title || titleMap[tone];
    const duration = Number.isFinite(options.duration) ? options.duration : 3200;

    clearButtonState();
    announce(`${title}. ${message}`);

    if (!toast) return;
    window.clearTimeout(toastTimer);
    toast.hidden = false;
    toast.dataset.tone = tone;
    toast.dataset.state = "open";
    toast.setAttribute("role", tone === "danger" ? "alert" : "status");
    toast.setAttribute("aria-live", tone === "danger" ? "assertive" : "polite");
    toast.innerHTML = `
      <span class="admin-toast__icon" aria-hidden="true">${iconMap[tone]}</span>
      <span class="admin-toast__copy">
        <strong>${escapeHtml(title)}</strong>
        <span>${escapeHtml(message)}</span>
      </span>
      <button class="admin-toast__close" type="button" aria-label="Tutup notifikasi">×</button>
      <span class="admin-toast__progress" aria-hidden="true"></span>`;

    toast.style.setProperty("--feedback-duration", `${duration}ms`);
    toast.classList.remove("is-visible");
    void toast.offsetWidth;
    requestAnimationFrame(() => toast.classList.add("is-visible"));
    $(".admin-toast__close", toast)?.addEventListener("click", hide, { once: true });
    toastTimer = window.setTimeout(hide, duration);
  };

  const csvCell = (value) => `"${String(value ?? "").replaceAll('"', '""').replace(/\s+/g, " ").trim()}"`;

  const exportVisibleRows = () => {
    const table = $(page === "articles" ? ".article-table" : ".suite-table");
    if (!table) {
      show("Tabel data belum tersedia untuk diekspor.", { tone: "warning", title: "Export gagal" });
      return;
    }

    const headerCells = $$('thead th', table);
    const excluded = new Set([0, headerCells.length - 1]);
    const headers = headerCells
      .filter((_, index) => !excluded.has(index))
      .map((cell) => csvCell(cell.textContent));
    const rows = $$('tbody tr', table)
      .filter((row) => !row.hidden)
      .map((row) => $$('td', row)
        .filter((_, index) => !excluded.has(index))
        .map((cell) => csvCell(cell.textContent)));

    if (!rows.length) {
      show("Tidak ada data pada hasil filter saat ini.", { tone: "warning", title: "Tidak ada data" });
      return;
    }

    const csv = `\uFEFF${[headers, ...rows].map((row) => row.join(",")).join("\n")}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `nexgear-${page}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    show(`${rows.length} baris data berhasil diunduh.`, { title: "Export selesai" });
  };

  const decorateExportButtons = () => {
    $$(".admin-hero-actions button").forEach((button) => {
      if (!/^export\b/i.test(button.textContent.trim())) return;
      button.dataset.crudExport = "true";
      button.addEventListener("click", exportVisibleRows);
    });
  };

  const actionSelector = [
    "[data-action]",
    "[data-menu-action]",
    "[data-bulk]",
    "[data-bulk-action]",
    "[data-save-draft]",
    "#suite-delete-confirm",
    "#delete-confirm",
    "#suite-form button[type='submit']",
    "#editor-drawer button[type='submit']",
    "[data-crud-refresh]",
    "[data-crud-export]",
  ].join(",");

  document.addEventListener("click", (event) => {
    const button = event.target.closest(actionSelector);
    if (!button) return;
    begin(button);
    window.setTimeout(() => {
      if (activeButton === button) clearButtonState(button);
    }, 520);
  }, true);

  toast?.addEventListener("mouseenter", () => window.clearTimeout(toastTimer));
  toast?.addEventListener("mouseleave", () => {
    toastTimer = window.setTimeout(hide, 1400);
  });

  decorateExportButtons();

  window.NexAdminFeedback = Object.freeze({ show, hide, begin, complete: clearButtonState });
})();