(() => {
  "use strict";

  if (window.NexAdminWorkspaceRegression) return;

  const body = document.body;
  const page = body?.dataset.adminPage || (body?.classList.contains("page-admin-articles") ? "articles" : "");
  const supported = new Set(["articles", "products", "users", "transactions"]);
  if (!body?.classList.contains("page-admin") || !supported.has(page)) return;

  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));
  const drawerSelector = page === "articles" ? "#editor-drawer" : "#suite-drawer";
  const results = new Map();
  let scheduledFrame = 0;

  const px = (value) => Number.parseFloat(value) || 0;
  const style = (element) => window.getComputedStyle(element);
  const isRendered = (element) => {
    if (!element) return false;
    const computed = style(element);
    const rect = element.getBoundingClientRect();
    return computed.display !== "none" && computed.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
  };

  const record = (name, pass, detail) => {
    results.set(name, { name, pass: Boolean(pass), detail });
  };

  const noSiblingOverlap = (elements) => {
    const visible = elements.filter(isRendered);
    for (let index = 0; index < visible.length - 1; index += 1) {
      const current = visible[index].getBoundingClientRect();
      const next = visible[index + 1].getBoundingClientRect();
      if (current.right > next.left + 0.5) return false;
    }
    return true;
  };

  const checkHeader = (drawer) => {
    const header = $(".suite-drawer-header, .editor-drawer__panel > header", drawer);
    const title = $(".workspace-header-title", header || drawer);
    const controls = $(".workspace-header-controls", header || drawer);
    const close = $(".workspace-header-close", controls || header || drawer);
    const controlButtons = $$(".workspace-header-button", controls || drawer);

    record("header:exists", Boolean(header && title && controls && close), "Header, title, controls, dan close button tersedia.");
    if (!header || !title || !controls || !close) return;

    const headerRect = header.getBoundingClientRect();
    const titleRect = title.getBoundingClientRect();
    const controlsRect = controls.getBoundingClientRect();
    record("header:contained", titleRect.left >= headerRect.left - 1 && controlsRect.right <= headerRect.right + 1, "Konten header berada di dalam panel.");
    record("header:no-overlap", titleRect.right <= controlsRect.left + 1, "Judul tidak bertabrakan dengan kontrol kanan.");
    record("header:controls-no-overlap", noSiblingOverlap([...controlButtons, close]), "Tombol Navigasi, Ringkasan, dan Tutup tidak saling menimpa.");

    controlButtons.forEach((button, index) => {
      const label = $("span", button);
      const rect = button.getBoundingClientRect();
      record(`header:button-${index}-height`, rect.height >= 40 && rect.height <= 44, `Tinggi tombol ${index + 1}: ${rect.height.toFixed(1)}px.`);
      if (label && isRendered(label)) {
        record(`header:button-${index}-nowrap`, label.scrollWidth <= label.clientWidth + 1 && label.scrollHeight <= label.clientHeight + 1, `Label tombol ${index + 1} tidak membungkus.`);
      }
    });

    const closeRect = close.getBoundingClientRect();
    record("header:close-square", Math.abs(closeRect.width - closeRect.height) <= 1 && closeRect.width >= 40 && closeRect.width <= 44, `Ukuran close button: ${closeRect.width.toFixed(1)} × ${closeRect.height.toFixed(1)}px.`);
  };

  const checkInputs = (drawer) => {
    const toggles = $$('.form-toggle > input[type="checkbox"]', drawer);
    toggles.forEach((input, index) => {
      const rect = input.getBoundingClientRect();
      record(`input:toggle-${index}`, rect.width >= 38 && rect.width <= 46 && rect.height >= 20 && rect.height <= 28, `Toggle ${index + 1}: ${rect.width.toFixed(1)} × ${rect.height.toFixed(1)}px.`);
    });

    const permissions = $$('.permission-matrix input[type="checkbox"]', drawer);
    permissions.forEach((input, index) => {
      const rect = input.getBoundingClientRect();
      record(`input:permission-${index}`, rect.width >= 16 && rect.width <= 20 && rect.height >= 16 && rect.height <= 20, `Permission checkbox ${index + 1}: ${rect.width.toFixed(1)} × ${rect.height.toFixed(1)}px.`);
    });
  };

  const checkFooter = (drawer) => {
    const footer = $(".form-sticky-actions", drawer);
    if (!footer) return;
    const cancel = $("[data-workspace-close]", footer);
    const submit = $("[data-workspace-submit]", footer) || $('button[type="submit"]', footer);
    if (window.innerWidth <= 820) {
      record("footer:mobile-cancel", isRendered(cancel), "Aksi Batal/Tutup terlihat pada mobile.");
      record("footer:mobile-submit", isRendered(submit), "Aksi submit utama terlihat pada mobile.");
    }
  };

  const checkStacking = (drawer) => {
    const panel = $(".suite-drawer-panel, .editor-drawer__panel", drawer);
    const unsaved = $("#admin-unsaved-dialog");
    if (!panel || !unsaved) return;
    const workspaceZ = px(style(drawer).zIndex) || px(style(panel).zIndex);
    const unsavedZ = px(style(unsaved).zIndex);
    record("stacking:unsaved", unsavedZ > workspaceZ, `Unsaved dialog z-index ${unsavedZ}; workspace ${workspaceZ}.`);
  };

  const publish = (drawer) => {
    const failures = Array.from(results.values()).filter((item) => !item.pass);
    const report = {
      page,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      theme: body.dataset.adminTheme || document.documentElement.dataset.theme || "dark",
      pass: failures.length === 0,
      checks: Array.from(results.values()),
      failures,
      timestamp: new Date().toISOString(),
    };

    drawer.dataset.regressionState = report.pass ? "pass" : "fail";
    body.dataset.workspaceRegression = report.pass ? "pass" : "fail";
    window.dispatchEvent(new CustomEvent("nexgear:workspace-regression", { detail: report }));

    if (failures.length) {
      console.groupCollapsed(`[NEXGEAR] Workspace regression gagal: ${page} (${failures.length})`);
      console.table(failures);
      console.groupEnd();
    }

    return report;
  };

  const run = () => {
    const drawer = $(drawerSelector);
    if (!drawer || !drawer.classList.contains("is-open")) return null;
    results.clear();
    checkHeader(drawer);
    checkInputs(drawer);
    checkFooter(drawer);
    checkStacking(drawer);
    record("body:scroll-lock", style(body).overflow === "hidden", `Body overflow: ${style(body).overflow}.`);
    return publish(drawer);
  };

  const schedule = () => {
    window.cancelAnimationFrame(scheduledFrame);
    scheduledFrame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(run);
    });
  };

  const drawer = $(drawerSelector);
  if (drawer) {
    new MutationObserver(schedule).observe(drawer, {
      attributes: true,
      attributeFilter: ["class", "aria-hidden", "data-nav", "data-summary", "data-workspace-mode"],
    });
  }

  window.addEventListener("resize", schedule, { passive: true });
  window.addEventListener("nexgear:workspace-opened", schedule);
  window.addEventListener("nexgear:workspace-layoutchange", schedule);

  window.NexAdminWorkspaceRegression = Object.freeze({ run, schedule });
})();
